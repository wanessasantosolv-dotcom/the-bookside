// Testes da lógica de nas entrelinhas. Uso: node scripts/testar-entrelinhas.cjs
const ts = require("typescript"); const fs = require("fs"); const path = require("path"); const os = require("os");
const raiz = path.join(__dirname, ".."); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ne-"));
fs.copyFileSync(path.join(raiz, "src/data/nas-entrelinhas-v2.json"), path.join(tmp, "nas-entrelinhas-v2.json"));
const src = fs.readFileSync(path.join(raiz, "src/lib/entrelinhas.ts"), "utf8").replace("../data/nas-entrelinhas-v2.json", "./nas-entrelinhas-v2.json");
fs.writeFileSync(path.join(tmp, "e.cjs"), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText);
const E = require(path.join(tmp, "e.cjs"));
let ok=0; const t=(n,f)=>{f();ok++;console.log("ok -",n)};
t("10 perguntas, 4 alternativas, 2 cartas cada, 8 cartas por pergunta",()=>{
  assert.equal(E.PERGUNTAS.length,10);
  for(const p of E.PERGUNTAS){assert.equal(p.alternativas.length,4);const all=p.alternativas.flatMap(a=>Object.keys(a.pontos));assert.equal(new Set(all).size,8);for(const a of p.alternativas)assert.equal(Object.keys(a.pontos).length,2);}
});
t("soma final = 20 para respostas aleatórias",()=>{for(let k=0;k<2000;k++){const r={};for(const p of E.PERGUNTAS)r[p.id]=p.alternativas[Math.floor(Math.random()*4)].id;const s=E.pontuar(r);assert.equal(Object.values(s).reduce((a,b)=>a+b,0),20);assert(Math.max(...Object.values(s))<=10);}});
t("trocar uma resposta não acumula pontos",()=>{const r={};for(const p of E.PERGUNTAS)r[p.id]=p.alternativas[0].id;const a=E.pontuar(r);r.q01=E.PERGUNTAS[0].alternativas[1].id;r.q01=E.PERGUNTAS[0].alternativas[0].id;assert.deepEqual(E.pontuar(r),a);});
t("embaralhar preserva id, texto, imagem e pontos",()=>{const o=E.novaOrdem();for(const p of E.PERGUNTAS){assert.deepEqual([...o[p.id]].sort(),p.alternativas.map(a=>a.id).sort());}const q=E.PERGUNTAS[2];for(const id of o[q.id]){const a=q.alternativas.find(x=>x.id===id);assert(a.imagem&&a.texto&&Object.keys(a.pontos).length===2);}});
t("ordem embaralhada varia entre execuções (posição não ligada à carta)",()=>{const firsts=new Map();for(let k=0;k<4000;k++){const o=E.novaOrdem();const f=o.q01[0];firsts.set(f,(firsts.get(f)||0)+1);}assert.equal(firsts.size,4);for(const v of firsts.values())assert(Math.abs(v-1000)<150,v);});
t("cada carta pode ser resultado único",()=>{for(const c of E.CARTAS){const r={};for(const p of E.PERGUNTAS){r[p.id]=p.alternativas.find(a=>a.pontos[c]).id;}const l=E.lideres(r);assert.deepEqual(l,[c]);}});
t("empate devolve só os empatados",()=>{const r={};for(const p of E.PERGUNTAS)r[p.id]=p.alternativas[0].id;const s=E.pontuar(r);const m=Math.max(...Object.values(s));const l=E.lideres(r);assert.deepEqual(l.sort(),E.CARTAS.filter(c=>s[c]===m).sort());});
t("respondidas exige as 10",()=>{const r={};assert(!E.respondidas(r));for(const p of E.PERGUNTAS)r[p.id]=p.alternativas[3].id;assert(E.respondidas(r));});
t("catálogo: 8 cartas em português, numeradas I–VIII, Curadora do Tempo",()=>{assert.equal(Object.keys(E.CATALOGO).length,8);assert.equal(E.CATALOGO.C.nome,"A Curadora do Tempo");assert.deepEqual(E.CARTAS.map(c=>E.CATALOGO[c].numero),["I","II","III","IV","V","VI","VII","VIII"]);for(const c of E.CARTAS)assert(!/The |Dreamer|Collector/.test(E.CATALOGO[c].nome));});
t("imagens das cartas e perguntas existem",()=>{const fs=require("fs");for(const c of E.CARTAS)assert(fs.existsSync(path.join(raiz,"public")+E.imagemDaCarta(c)));assert(fs.existsSync(path.join(raiz,"public")+E.VERSO));for(const p of E.PERGUNTAS)for(const a of p.alternativas)if(a.imagem)assert(fs.existsSync(path.join(raiz,"public")+E.imagemDaAlternativa(a)));});
console.log(ok+" testes passaram");
