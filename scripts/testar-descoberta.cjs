// Testes das regras de qualidade da descoberta. Uso: node scripts/testar-descoberta.cjs
const ts = require("typescript"); const fs = require("fs"); const path = require("path"); const os = require("os"); const assert = require("assert");
const raiz = path.join(__dirname, ".."); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dq-"));
const src = fs.readFileSync(path.join(raiz, "src/lib/descoberta-qualidade.ts"), "utf8");
fs.writeFileSync(path.join(tmp, "q.cjs"), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
const Q = require(path.join(tmp, "q.cjs"));
let ok = 0; const t = (n, f) => { f(); ok++; console.log("ok -", n); };

// regressão: o que aparecia antes em "livros coreanos", "literatura japonesa"…
const fora = [
  { titulo: "Dicionário Coreano-Português", categorias: ["Foreign Language Study"] },
  { titulo: "Coreano para iniciantes", subtitulo: "curso completo", categorias: ["Foreign Language Study / Korean"] },
  { titulo: "Gramática da língua japonesa", categorias: [] },
  { titulo: "Japonês: guia de conversação", categorias: ["Travel"] },
  { titulo: "Apostila ENEM 2024 Literatura", categorias: ["Study Aids"] },
  { titulo: "Livro de colorir: jardins encantados", categorias: ["Games & Activities"] },
  { titulo: "Resumo de Dom Casmurro", subtitulo: "guia de estudo para vestibular" },
  { titulo: "Anais do congresso de literatura comparada", categorias: ["Language Arts & Disciplines"] },
  { titulo: "Manual de redação", categorias: ["Reference"] },
];
const dentro = [
  { titulo: "A vegetariana", categorias: ["Fiction"] },
  { titulo: "Dicionário de lugares imaginários", categorias: ["Literary Collections"] },
  { titulo: "O dicionário amoroso da língua portuguesa", categorias: ["Literary Criticism"] },
  { titulo: "O ano do pensamento mágico", categorias: ["Biography & Autobiography"] },
  { titulo: "Sapiens", categorias: ["History"] },
  { titulo: "Poemas escolhidos", categorias: ["Poetry"] },
  { titulo: "Torto arado" },
  { titulo: "Manual da faxineira", categorias: ["Fiction"] },
];
t("materiais não literários ficam fora da descoberta", () => { for (const l of fora) assert(Q.naoLiterario(l), l.titulo); });
t("obras legítimas (inclusive com 'dicionário'/'manual' no título) continuam", () => { for (const l of dentro) assert.equal(Q.naoLiterario(l), null, l.titulo); });
t("quem pede dicionário ou material didático encontra", () => {
  assert.equal(Q.naoLiterario(fora[0], "dicionário de coreano"), null);
  assert.equal(Q.naoLiterario(fora[4], "apostila enem"), null);
  assert(Q.naoLiterario(fora[0], "livros coreanos"));
});
t("edição em português exige idioma confirmado", () => {
  assert(Q.ehEdicaoPt({ idioma: "pt" })); assert(Q.ehEdicaoPt({ idioma: "pt-BR" })); assert(Q.ehEdicaoPt({ idioma: "por" }));
  assert(!Q.ehEdicaoPt({ idioma: "en" })); assert(!Q.ehEdicaoPt({}));
});
t("tipos de fonte e pesos (comercial e editora não são recomendação independente)", () => {
  assert.equal(Q.tipoDaFonte("quatrocincoum.com.br"), "critica");
  assert.equal(Q.tipoDaFonte("goodreads.com"), "leitores");
  assert.equal(Q.tipoDaFonte("amazon.com.br"), "comercial");
  assert.equal(Q.tipoDaFonte("companhiadasletras.com.br"), "editora");
  assert(Q.PESO_FONTE.critica > Q.PESO_FONTE.leitores && Q.PESO_FONTE.leitores > Q.PESO_FONTE.editora && Q.PESO_FONTE.comercial === 0);
});
t("média bayesiana não favorece amostras pequenas; sem dado é null, não zero", () => {
  const poucas = Q.notaBayesiana({ media: 5, total: 2 }); const muitas = Q.notaBayesiana({ media: 4.4, total: 900 });
  assert(muitas > poucas); assert.equal(Q.notaBayesiana(undefined), null);
});
t("pesos redistribuídos quando faltam sinais (sem valores fictícios)", () => {
  const so = Q.pontuar({ posicao: 0, total: 10, caracteristicas: 2, pedidas: 2, fontes: [] });
  assert(so.valor > 0.9 && so.confianca === 0.4);
  const com = Q.pontuar({ posicao: 0, total: 10, caracteristicas: 2, pedidas: 2, fontes: [{ tipo: "critica", dominio: "a" }, { tipo: "premio", dominio: "b" }, { tipo: "leitores", dominio: "c" }], avaliacao: { media: 4.5, total: 500 } });
  assert(Math.abs(com.confianca - 0.95) < 1e-9); // só a afinidade (espontânea) ficou de fora
});
t("popular mas fora da pesquisa não passa na frente do pertinente com crítica", () => {
  const pertinente = Q.pontuar({ posicao: 0, total: 12, caracteristicas: 2, pedidas: 2, fontes: [{ tipo: "critica", dominio: "x" }] }).valor;
  const popular = Q.pontuar({ posicao: 11, total: 12, caracteristicas: 0, pedidas: 2, fontes: [{ tipo: "leitores", dominio: "g" }], avaliacao: { media: 4.6, total: 50000 } }).valor;
  assert(pertinente > popular, `${pertinente} <= ${popular}`);
});
t("diversidade: no máximo 2 por autoria antes das demais", () => {
  const l = ["a", "a", "a", "b", "a", "c"].map((autor, i) => ({ autor, i }));
  assert.deepEqual(Q.diversificar(l).map((x) => x.i), [0, 1, 3, 5, 2, 4]);
});
t("mesma obra em edições diferentes vira uma chave só", () => {
  assert.equal(Q.chaveDaObra("Piranesi", "Susanna Clarke"), Q.chaveDaObra("Piranesi: edição especial", "susanna clarke"));
});
// Carrega as curadorias reais, sem rede, usando o mesmo compilador dos testes existentes.
const Module = require("module");
const carregados = new Map();
function carregar(nome) {
  if (carregados.has(nome)) return carregados.get(nome).exports;
  const arquivo = path.join(raiz, "src/lib", nome + ".ts");
  const m = new Module(arquivo, module);
  carregados.set(nome, m);
  m.require = (id) => id.startsWith("@/lib/") ? carregar(id.slice(6)) : require(id);
  m._compile(ts.transpileModule(fs.readFileSync(arquivo, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, arquivo);
  return m.exports;
}
const F = carregar("curadoria-fixa");
t("contingência não inventa obras para critérios desconhecidos", () => {
  assert.deepEqual(F.obrasFixas([]), []);
  assert.deepEqual(F.obrasFixas(["lit-coreana", "inexistente"]), []);
});
t("contingência combina origem e atmosfera por interseção", () => {
  const obras = F.obrasFixas(["lit-coreana", "acolhedora"]);
  assert(obras.length > 0);
  for (const obra of obras) {
    for (const id of ["lit-coreana", "acolhedora"]) {
      assert(F.CURADORIA_FIXA[id].some(x => x.titulo.toLowerCase() === obra.titulo.toLowerCase() && x.autor.toLowerCase() === obra.autor.toLowerCase()));
    }
  }
});
t("origens incompatíveis não são misturadas para preencher resultados", () => {
  assert.deepEqual(F.obrasFixas(["lit-coreana", "lit-brasileira"]), []);
});
t("critério repetido não altera a seleção editorial", () => {
  assert.deepEqual(F.obrasFixas(["lit-coreana", "lit-coreana"]), F.obrasFixas(["lit-coreana"]));
});
t("obras homônimas de autores com o mesmo sobrenome não se confundem", () => {
  assert.notEqual(Q.chaveDaObra("Um título", "Henry James"), Q.chaveDaObra("Um título", "William James"));
});
console.log(ok + " testes passaram");
