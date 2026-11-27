"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";

/** a sessão em andamento fica guardada: dá para sair da tela e voltar */
const CHAVE = "bookside-foco";
type Sessao = {
  livroId: string;
  /** quando começou a contar (ms) — ou null se está pausada */
  desde: number | null;
  /** tempo já contado antes da última pausa (ms) */
  acumulado: number;
  /** meta em minutos (0 = livre) */
  meta: number;
  paginaInicial?: number;
};
const ler = (): Sessao | null => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "null");
  } catch {
    return null;
  }
};
const gravar = (s: Sessao | null) => {
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento */
  }
};
const decorrido = (s: Sessao) =>
  s.acumulado + (s.desde ? Date.now() - s.desde : 0);
const relogio = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const ss = t % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(ss).padStart(2, "0")}`;
};

/** ruído marrom bem baixinho (feito no navegador, sem arquivo de som) */
function useRuido(ligado: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (!ligado) return;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const c = new AC();
    ctx.current = c;
    const tamanho = 2 * c.sampleRate;
    const buffer = c.createBuffer(1, tamanho, c.sampleRate);
    const dados = buffer.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < tamanho; i++) {
      const branco = Math.random() * 2 - 1;
      ultimo = (ultimo + 0.02 * branco) / 1.02;
      dados[i] = ultimo * 3.5;
    }
    const fonte = c.createBufferSource();
    fonte.buffer = buffer;
    fonte.loop = true;
    const volume = c.createGain();
    volume.gain.value = 0.18;
    fonte.connect(volume).connect(c.destination);
    fonte.start();
    return () => {
      fonte.stop();
      void c.close();
    };
  }, [ligado]);
}

function Foco() {
  const router = useRouter();
  const params = useSearchParams();
  const livros = usePerfil((s) => s.livros);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const lendo = livros.filter((l) => l.status === "lendo");
  const [sessao, setSessao] = useState<Sessao | null>(() => ler());
  const [livroId, setLivroId] = useState(
    () => sessao?.livroId ?? params.get("livro") ?? lendo[0]?.id ?? "",
  );
  const [meta, setMeta] = useState(sessao?.meta ?? 25);
  const [, setTique] = useState(0);
  const [terminando, setTerminando] = useState(false);
  const [pagina, setPagina] = useState("");
  const [som, setSom] = useState(false);
  useRuido(som && !!sessao?.desde);

  // atualiza o relógio a cada segundo
  useEffect(() => {
    if (!sessao?.desde) return;
    const t = setInterval(() => setTique((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [sessao?.desde]);

  // a tela não apaga enquanto conta
  useEffect(() => {
    if (!sessao?.desde || !("wakeLock" in navigator)) return;
    let trava: WakeLockSentinel | null = null;
    navigator.wakeLock
      .request("screen")
      .then((w) => (trava = w))
      .catch(() => {});
    return () => {
      void trava?.release();
    };
  }, [sessao?.desde]);

  const livro = livros.find((l) => l.id === livroId);
  const ms = sessao ? decorrido(sessao) : 0;
  const alvo = (sessao?.meta ?? meta) * 60000;
  const chegou = !!alvo && ms >= alvo;
  const pct = alvo ? Math.min(1, ms / alvo) : (ms % 3600000) / 3600000;

  // avisa (vibra) quando chega na meta
  const avisou = useRef(false);
  useEffect(() => {
    if (chegou && !avisou.current) {
      avisou.current = true;
      navigator.vibrate?.([120, 80, 120]);
    }
  }, [chegou]);

  function mudar(s: Sessao | null) {
    gravar(s);
    setSessao(s);
  }
  function comecar() {
    if (!livro) return;
    avisou.current = false;
    mudar({
      livroId: livro.id,
      desde: Date.now(),
      acumulado: 0,
      meta,
      paginaInicial: livro.paginaAtual,
    });
  }
  const pausar = () =>
    sessao && mudar({ ...sessao, acumulado: decorrido(sessao), desde: null });
  const continuar = () => sessao && mudar({ ...sessao, desde: Date.now() });

  function concluir() {
    if (!sessao || !livro) return;
    const minutos = Math.max(1, Math.round(decorrido(sessao) / 60000));
    const p = Number(pagina);
    const paginas =
      p && sessao.paginaInicial !== undefined
        ? Math.max(0, p - sessao.paginaInicial)
        : undefined;
    editarLivro(livro, {
      sessoes: [
        ...(livro.sessoes ?? []),
        {
          em: new Date(Date.now() - decorrido(sessao)).toISOString(),
          minutos,
          paginas,
        },
      ].slice(-300),
      ...(p
        ? { paginaAtual: livro.paginas ? Math.min(p, livro.paginas) : p }
        : {}),
    });
    mudar(null);
    setTerminando(false);
    setPagina("");
    router.push(`/livro/${livro.id}`);
  }

  const raio = 120;
  const volta = 2 * Math.PI * raio;
  const minutosTotais = Math.round(
    (livro?.sessoes ?? []).reduce((t, x) => t + x.minutos, 0),
  );

  return (
    <div className="inverso flex min-h-dvh flex-1 flex-col bg-[#1c1418] px-6 pt-3 pb-10 text-creme lg:px-12 lg:pt-8">
      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Voltar
            padrao="/inicio"
            className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-rosa-claro"
          />
          <span className="text-[10px] font-semibold tracking-[.22em] text-rosa-claro/80 uppercase">
            modo foco
          </span>
        </div>

        {!lendo.length && !livro ? (
          <p className="mt-16 text-center font-accent text-lg italic text-rosa-claro">
            marque um livro como “lendo” para usar o modo foco.
          </p>
        ) : (
          <>
            {/* o livro */}
            <div className="mt-6 flex items-center gap-4">
              {livro ? (
                <CapaLivro
                  titulo={livro.titulo}
                  capa={livro.capa}
                  cor={corDoLivro(livro.id)}
                  className="w-14 flex-none [&>span:last-child]:hidden"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                {sessao ? (
                  <p className="truncate font-revista text-xl italic">
                    {livro?.titulo}
                  </p>
                ) : (
                  <select
                    value={livroId}
                    onChange={(e) => setLivroId(e.target.value)}
                    aria-label="qual livro"
                    className="h-11 w-full rounded-pill border border-creme/25 bg-transparent px-4 font-revista text-lg italic text-creme outline-none"
                  >
                    {lendo.map((l) => (
                      <option key={l.id} value={l.id} className="text-ameixa">
                        {l.titulo}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-xs text-rosa-claro/80">
                  {livro?.paginaAtual && livro.paginas
                    ? `página ${livro.paginaAtual} de ${livro.paginas}`
                    : livro?.autor}
                  {minutosTotais
                    ? ` · ${minutosTotais >= 60 ? `${Math.floor(minutosTotais / 60)}h${String(minutosTotais % 60).padStart(2, "0")}` : `${minutosTotais} min`} lidos neste livro`
                    : ""}
                </p>
              </div>
            </div>

            {/* o relógio */}
            <div className="relative mx-auto mt-10 flex aspect-square w-full max-w-[280px] items-center justify-center">
              <svg
                viewBox="0 0 280 280"
                className="absolute inset-0 -rotate-90"
                aria-hidden
              >
                <circle
                  cx="140"
                  cy="140"
                  r={raio}
                  fill="none"
                  stroke="rgba(249,245,238,.12)"
                  strokeWidth="6"
                />
                <circle
                  cx="140"
                  cy="140"
                  r={raio}
                  fill="none"
                  stroke={chegou ? "#C9A46A" : "#ECAABB"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={volta}
                  strokeDashoffset={volta * (1 - pct)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="text-center">
                <p
                  className="font-revista text-[56px] leading-none tabular-nums"
                  aria-live="off"
                >
                  {sessao ? relogio(ms) : meta ? `${meta}:00` : "0:00"}
                </p>
                <p className="mt-2 text-[11px] tracking-[.16em] text-rosa-claro/80 uppercase">
                  {!sessao
                    ? meta
                      ? `meta de ${meta} min`
                      : "tempo livre"
                    : chegou
                      ? "meta cumprida ✦ continue se quiser"
                      : sessao.desde
                        ? "lendo…"
                        : "pausado"}
                </p>
              </div>
            </div>

            {!sessao ? (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[0, 15, 25, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={meta === m}
                    onClick={() => setMeta(m)}
                    className={`flex h-10 items-center rounded-pill border px-4 text-[13px] font-semibold ${
                      meta === m
                        ? "border-rosa-claro bg-rosa-claro text-[#1c1418]"
                        : "border-creme/25 text-creme"
                    }`}
                  >
                    {m ? `${m} min` : "livre"}
                  </button>
                ))}
              </div>
            ) : null}

            <label className="mx-auto mt-6 flex items-center gap-2 text-xs text-rosa-claro/90">
              <input
                type="checkbox"
                checked={som}
                onChange={(e) => setSom(e.target.checked)}
                className="size-4 accent-[#ECAABB]"
              />
              som de fundo suave (ruído marrom)
            </label>

            <div className="mt-auto flex flex-col gap-2.5 pt-10">
              {!sessao ? (
                <button
                  type="button"
                  onClick={comecar}
                  disabled={!livro}
                  className="h-14 rounded-pill bg-creme text-[15px] font-semibold text-[#1c1418] disabled:opacity-40"
                >
                  começar a ler
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={sessao.desde ? pausar : continuar}
                    className="h-14 rounded-pill bg-creme text-[15px] font-semibold text-[#1c1418]"
                  >
                    {sessao.desde ? "pausar" : "continuar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      pausar();
                      setTerminando(true);
                    }}
                    className="h-12 rounded-pill border border-creme/30 text-sm font-semibold text-creme"
                  >
                    terminar sessão
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {terminando && sessao ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-[420px] animate-subir rounded-t-[20px] bg-creme px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] text-ameixa sm:rounded-[20px]">
            <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
              sessão de {Math.max(1, Math.round(decorrido(sessao) / 60000))} min
              ✦
            </p>
            <h2 className="mt-1 font-display text-[26px] leading-[1.1] font-semibold italic text-bordo">
              em que página você parou?
            </h2>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={pagina}
              onChange={(e) => setPagina(e.target.value)}
              placeholder={
                livro?.paginaAtual ? String(livro.paginaAtual) : "página"
              }
              autoFocus
              className="mt-4 h-12 w-full rounded-[12px] border border-bege bg-creme-quente px-4 text-lg outline-none focus:border-bordo"
            />
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={concluir}
                className="h-12 flex-1 rounded-pill bg-bordo text-sm font-semibold text-creme"
              >
                guardar sessão
              </button>
              <button
                type="button"
                onClick={() => {
                  setTerminando(false);
                  continuar();
                }}
                className="h-12 rounded-pill border border-bege px-5 text-sm font-semibold text-ameixa"
              >
                voltar a ler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FocoPage() {
  const hidratado = useHidratado();
  return (
    <AppShell aba="inicio" menuCelular={false}>
      {hidratado ? (
        <Suspense fallback={null}>
          <Foco />
        </Suspense>
      ) : null}
    </AppShell>
  );
}
