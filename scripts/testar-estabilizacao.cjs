const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test } = require("node:test");
const ts = require("typescript");

const raiz = path.join(__dirname, "../src");
const resolver = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolver.call(this, id.startsWith("@/") ? path.join(raiz, id.slice(2)) : id, ...args);
};
require.extensions[".ts"] = (modulo, arquivo) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(arquivo, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  modulo._compile(outputText, arquivo);
};

const { POST } = require("../src/app/api/descobrir/route.ts");
const { executarDescoberta } = require("../src/lib/descoberta-servidor.ts");
const { calcularNumeros, diasDeLeitura } = require("../src/lib/numeros.ts");
const { lidosNoAno } = require("../src/lib/estantes.ts");
const { diasDeLeituraNoAno, anosComLeitura } = require("../src/lib/jornada.ts");
const { livrosDoMes } = require("../src/lib/journal.ts");
const { calcularProgresso } = require("../src/lib/desafios.ts");
const { useCelebracao, celebrar } = require("../src/lib/celebrar.ts");

const livro = { id: "obra", titulo: "Uma obra", autor: "Autora", paginas: 200, status: "lido" };
const leitura = {
  ...livro,
  iniciadoEm: "2025-02-03T12:00:00Z",
  lidoEm: "2025-02-04T12:00:00Z",
  releituras: [
    { lidoEm: "2024-01-01T12:00:00Z", lidoSoAno: true, nota: 3 },
    { lidoEm: "2025-02-01T12:00:00Z", lidoSoMes: true, nota: 4 },
  ],
};

test("meta, números, Jornada e diário preservam o histórico e sua precisão", () => {
  assert.equal(lidosNoAno([leitura], 2024), 1);
  assert.equal(lidosNoAno([leitura], 2025), 2);
  assert.equal(lidosNoAno([leitura, leitura], 2025), 2);
  assert.equal(lidosNoAno([{ ...leitura, status: "lendo" }], 2025), 1);
  assert.equal(calcularNumeros([leitura], 3, 2025, new Date(2026, 0, 1)).lidos.length, 2);
  assert.deepEqual(anosComLeitura([leitura], new Date(2026, 0, 1)), [2026, 2025, 2024]);
  assert.equal(diasDeLeituraNoAno([leitura], 2025, new Date(2026, 0, 1)), 2);
  assert.equal(livrosDoMes([leitura], "2024-01").length, 0);
  assert.equal(livrosDoMes([leitura], "2025-02").length, 2);
  assert.equal(diasDeLeitura({ ...leitura, lidoSoMes: true }), null);
});

test("desafio de período só recebe datas parciais que cabem por inteiro", () => {
  const progresso = (inicio, fim) => calcularProgresso({ tipo: "livros", inicio, fim }, [leitura]).progresso;
  assert.equal(progresso("2025-02-01", "2025-02-28"), 2);
  assert.equal(progresso("2025-02-01", "2025-02-04"), 1);
  assert.equal(progresso("2024-01-01", "2024-01-31"), 0);
  assert.equal(progresso("2024-01-01", "2024-12-31"), 1);
});

test("celebração mantém a ordem e ignora notificações duplicadas", () => {
  const a = { tipo: "livro", livroId: "a", titulo: "A" };
  const b = { tipo: "livro", livroId: "b", titulo: "B" };
  celebrar(a);
  celebrar(a);
  celebrar(b);
  assert.equal(useCelebracao.getState().atual.livroId, "a");
  assert.equal(useCelebracao.getState().pendentes.length, 1);
  useCelebracao.getState().fechar();
  assert.equal(useCelebracao.getState().atual.livroId, "b");
  useCelebracao.getState().fechar();
  assert.equal(useCelebracao.getState().atual, null);
});

test("descoberta rejeita corpo inválido após autenticação, e ignora sementes inválidas", async (t) => {
  const condicoes = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const ambiente = condicoes.map((nome) => process.env[nome]);
  process.env[condicoes[0]] = "https://supabase.example";
  process.env[condicoes[1]] = "chave-ficticia";
  t.after(() => condicoes.forEach((nome, i) => {
    if (ambiente[i] === undefined) delete process.env[nome];
    else process.env[nome] = ambiente[i];
  }));
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "https://supabase.example/auth/v1/user");
    return Response.json({ id: "conta-ficticia" });
  });
  assert.equal((await POST(new Request("http://localhost/api/descobrir"))).status, 401);
  const req = new Request("http://localhost/api/descobrir", {
    method: "POST", headers: { authorization: "Bearer ficticio" }, body: "null",
  });
  assert.equal((await POST(req)).status, 400);
  assert.deepEqual((await executarDescoberta({ sementes: [null, "inválida"] })).resultados, []);
});

test("a rota mantém evidências e isola o cache por conta e exclusões", async (t) => {
  const variaveis = {
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ficticia",
    GEMINI_API_KEY: "ficticia",
    GEMINI_MODEL: "modelo-ficticio",
  };
  const anteriores = Object.keys(variaveis).map((nome) => [nome, process.env[nome]]);
  Object.assign(process.env, variaveis);
  t.after(() => anteriores.forEach(([nome, valor]) => {
    if (valor === undefined) delete process.env[nome];
    else process.env[nome] = valor;
  }));

  let pesquisas = 0;
  t.mock.method(globalThis, "fetch", async (entrada, opcoes) => {
    const host = new URL(entrada).hostname;
    if (host === "supabase.example") return Response.json({ id: opcoes.headers.Authorization.split(" ")[1] });
    if (host === "www.googleapis.com") return Response.json({ items: [{
      id: "piranesi", volumeInfo: {
        title: "Piranesi", authors: ["Susanna Clarke"], language: "pt",
        imageLinks: { thumbnail: "https://capas.example/piranesi.png" },
      },
    }] });
    assert.equal(host, "generativelanguage.googleapis.com");
    const corpo = JSON.parse(opcoes.body);
    if (corpo.tools) {
      pesquisas++;
      return Response.json({ candidates: [{
        content: { parts: [{ text: "Piranesi é uma recomendação." }] },
        groundingMetadata: {
          groundingChunks: [{}, { web: { title: "Revista Literária", uri: "https://revista.example/piranesi" } }],
          groundingSupports: [{ segment: { text: "Lemos Piranesi." }, groundingChunkIndices: [1] }],
        },
      }] });
    }
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ livros: [
      null, { titulo: "Piranesi", autor: "Susanna Clarke", paginas: [0] },
      { titulo: "Inventado", autor: "Autora Fictícia", paginas: [1] },
    ] }) }] } }] });
  });
  const buscar = async (conta, excluir = []) => {
    const r = await POST(new Request("http://localhost/api/descobrir", {
      method: "POST", headers: { authorization: `Bearer ${conta}` },
      body: JSON.stringify({ consulta: "literatura", excluir }),
    }));
    assert.equal(r.status, 200);
    return r.json();
  };
  const primeira = await buscar("conta-a");
  assert.equal(primeira.resultados.length, 1);
  assert.equal(primeira.resultados[0].livro.titulo, "Piranesi");
  assert.equal(primeira.resultados[0].fontes[0].url, "https://revista.example/piranesi");
  await buscar("conta-a");
  assert.equal(pesquisas, 1);
  await buscar("conta-b");
  assert.equal(pesquisas, 2);
  assert.deepEqual((await buscar("conta-a", ["Piranesi"])).resultados, []);
  assert.equal(pesquisas, 3);
});

test("a sincronização isola rascunhos e não grava quando a leitura remota falha", async (t) => {
  const moduloSupabase = require("../src/lib/supabase.ts");
  const { usePerfil } = require("../src/lib/perfil-store.ts");
  const chaves = new Map([
    ["bookside-perfil-dono", "conta-a"],
    ["bookside-perfil-pendente", JSON.stringify({ usuario: "conta-a", em: "2025-01-01", campos: ["nome"] })],
  ]);
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (chave) => chaves.get(chave) ?? null,
    setItem: (chave, valor) => chaves.set(chave, valor),
    removeItem: (chave) => chaves.delete(chave),
  } });
  t.after(() => {
    if (storage) Object.defineProperty(globalThis, "localStorage", storage);
    else delete globalThis.localStorage;
  });

  const original = moduloSupabase.supabase;
  t.after(() => { moduloSupabase.supabase = original; });
  let falhar = false;
  let tentativas = 0;
  moduloSupabase.supabase = {
    from: () => ({
      select: () => ({
        eq: (_campo, id) => ({
          maybeSingle: async () => falhar ? { error: { code: "offline" } } : {
            data: { dados: { nome: id }, atualizado_em: "2025-02-01T00:00:00Z" },
          },
        }),
      }),
      update: () => { tentativas++; throw Error("gravação inesperada"); },
    }),
  };
  const { carregarPerfil, salvarPerfil, useNuvem } = require("../src/lib/nuvem.ts");
  usePerfil.setState({ nome: "rascunho da conta A" });
  await carregarPerfil({ id: "conta-b" });
  assert.equal(usePerfil.getState().nome, "conta-b");
  assert.equal(JSON.parse(chaves.get("bookside-perfil-anterior-conta-a")).dados.nome, "rascunho da conta A");
  assert.equal(chaves.get("bookside-perfil-dono"), "conta-b");
  falhar = true;
  await salvarPerfil("conta-b");
  assert.equal(tentativas, 0);
  assert.equal(useNuvem.getState().estado, "erro");
});
