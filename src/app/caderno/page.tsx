"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import styles from "./caderno.module.css";

const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const cores = ["#692536","#59634F","#43567D","#38252C","#B47787"];
const papeis = ["Liso","Pontilhado","Quadriculado","Pautado"] as const;
type Folha = { titulo: string; tipo: "indice"|"capas"|"leituras"|"resenhas"|"favoritos"|"proximas"|"notas"; livros?: LivroSalvo[]; meses?: number[] };
function grupos<T>(itens:T[], n:number):T[][] { return itens.length ? Array.from({length:Math.ceil(itens.length/n)},(_,i)=>itens.slice(i*n,(i+1)*n)) : [[]]; }
function data(l:LivroSalvo) {
  if(!l.lidoEm) return "Data não informada";
  if(l.lidoSoAno) return l.lidoEm.slice(0,4);
  const m=Number(l.lidoEm.slice(5,7))-1;
  if(l.lidoSoMes) return (meses[m]??"")+" "+l.lidoEm.slice(0,4);
  return l.lidoEm.slice(8,10)+"/"+l.lidoEm.slice(5,7)+"/"+l.lidoEm.slice(0,4);
}
function Capa({l}:{l:LivroSalvo}) { return l.capa ? <img className={styles.mini} src={l.capa} alt={"Capa de "+l.titulo} loading="lazy" /> : <span className={styles.semCapa}>{l.titulo}</span>; }
function Nota({nota}:{nota?:number}) { return typeof nota==="number" && nota>0 ? <span className={styles.nota} aria-label={nota+" de 5 estrelas"}>{Array.from({length:5},(_,i)=>nota>=i+1?"★":nota>i?"◐":"☆").join("")} <small>{nota.toLocaleString("pt-BR")}</small></span>:null; }
export default function CadernoPage(){
 const hidratado=useHidratado(), p=usePerfil();
 const [ano,setAno]=useState(new Date().getFullYear().toString());
 const [aberto,setAberto]=useState(false),[folha,setFolha]=useState(0),[cor,setCor]=useState(cores[0]),[papel,setPapel]=useState<typeof papeis[number]>("Liso");
 const [escolhas,setEscolhas]=useState<Record<string,string>>({});
 const chave=p.email ? "bookside:caderno:"+p.email : null;
 const [carregado,setCarregado]=useState<string|null>(null);
 useEffect(()=>{setCarregado(null);setCor(cores[0]);setPapel("Liso");setEscolhas({});setAberto(false);setFolha(0);if(!hidratado||!chave)return;try{const v=JSON.parse(localStorage.getItem(chave)||"{}");if(cores.includes(v.cor))setCor(v.cor);if(papeis.includes(v.papel))setPapel(v.papel);if(v.escolhas&&typeof v.escolhas==="object"&&!Array.isArray(v.escolhas))setEscolhas(v.escolhas);}catch{}setCarregado(chave);},[hidratado,chave]);
 useEffect(()=>{if(chave&&carregado===chave)try{localStorage.setItem(chave,JSON.stringify({cor,papel,escolhas}));}catch{}},[chave,carregado,cor,papel,escolhas]);
 const lidos=useMemo(()=>p.livros.filter(l=>l.status==="lido"&&l.lidoEm?.startsWith(ano)).sort((a,b)=>(b.lidoEm??"").localeCompare(a.lidoEm??"")),[p.livros,ano]);
 const anos=Array.from(new Set([new Date().getFullYear().toString(),...p.livros.flatMap(l=>l.status==="lido"&&l.lidoEm?[l.lidoEm.slice(0,4)]:[])])).sort().reverse();
 const proximos=p.livros.filter(l=>l.status==="quero");
 const notas=p.livros.filter(l=>l.citacao||l.anotacao||l.trechos?.length);
 const folhas:Folha[]=[{titulo:"Caderno de leitura",tipo:"indice"},{titulo:"Índice",tipo:"indice"},...grupos(lidos,12).map(livros=>({titulo:"Meu ano em livros",tipo:"capas" as const,livros})),...grupos(lidos,4).map(livros=>({titulo:"Registro de leituras",tipo:"leituras" as const,livros})),...grupos(lidos.filter(l=>l.resenha),2).map(livros=>({titulo:"Resenhas",tipo:"resenhas" as const,livros})),{titulo:"Favoritos do mês",tipo:"favoritos",meses:[0,1,2,3,4,5]},{titulo:"Favoritos do mês",tipo:"favoritos",meses:[6,7,8,9,10,11]},...grupos(proximos,8).map(livros=>({titulo:"Próximas leituras",tipo:"proximas" as const,livros})),...grupos(notas,2).map(livros=>({titulo:"Citações e anotações",tipo:"notas" as const,livros}))];
 const tipos=folhas.filter((f,i)=>f.tipo!=="indice"&&folhas.findIndex(x=>x.tipo===f.tipo)===i);
 const ir=(i:number)=>setFolha(Math.max(0,Math.min(folhas.length-1,i)));
 function render(f:Folha,i:number){
  return <article className={styles.folha} data-papel={papel} key={i}>
   <header><span>THE BOOKSIDE · {ano}</span><h2>{f.titulo}</h2></header>
   {i===0?<div className={styles.rosto}><span aria-hidden>✳</span><h3>{p.nome||"Meu caderno"}</h3><p>{ano}</p><p>{lidos.length} leituras registradas</p></div>:f.tipo==="indice"?<nav aria-label="Índice">{tipos.map(t=><button key={t.tipo} className={styles.indice} onClick={()=>ir(folhas.indexOf(t))}>{t.titulo}<span>{folhas.indexOf(t)+1}</span></button>)}</nav>:f.tipo==="favoritos"?<div className={styles.favoritos}>{f.meses?.map(m=>{const op=lidos.filter(l=>!l.lidoSoAno&&Number(l.lidoEm?.slice(5,7))===m+1);const k=ano+"-"+m;const escolhido=op.find(l=>l.id===escolhas[k])??[...op].filter(l=>typeof l.nota==="number"&&l.nota>0).sort((a,b)=>(b.nota??0)-(a.nota??0))[0];return <div key={m} className={styles.mes}><h3>{meses[m]}</h3>{escolhido?<><Capa l={escolhido}/><Nota nota={escolhido.nota}/></>:<span className={styles.vazio}>Sem favorito</span>}{op.length>0&&<select aria-label={"Favorito de "+meses[m]} value={escolhido?.id??""} onChange={e=>setEscolhas(s=>({...s,[k]:e.target.value}))}><option value="" disabled>Escolher livro</option>{op.map(l=><option key={l.id} value={l.id}>{l.titulo}</option>)}</select>}</div>})}</div>:!f.livros?.length?<p className={styles.vazio}>Nenhum registro nesta seção.</p>:f.tipo==="capas"||f.tipo==="proximas"?<div className={styles.mosaico}>{f.livros.map(l=><div key={l.id} className={f.tipo==="proximas"?styles.xadrez:styles.itemCapa}><Capa l={l}/><small>{l.titulo}</small></div>)}</div>:<div className={styles.registros}>{f.livros.map(l=><section key={l.id} className={styles.registro}><div className={styles.ficha}><Capa l={l}/><div><h3>{l.titulo}</h3><p>{l.autor}</p><Nota nota={l.nota}/><p>{data(l)}{l.paginas?" · "+l.paginas+" pág.":""}{l.formato?" · "+({fisico:"Físico",ebook:"E-book",audio:"Audiolivro"}[l.formato]):""}</p></div></div>{f.tipo==="resenhas"&& (l.resenhaSpoiler?<details><summary>Mostrar resenha com spoilers</summary><p className={styles.texto}>{l.resenha}</p></details>:<p className={styles.texto}>{l.resenha}</p>)}{f.tipo==="notas"&&<>{l.citacao&&<blockquote>{l.citacao}</blockquote>}{l.anotacao&&<p className={styles.texto}>{l.anotacao}</p>}{l.trechos?.map((t,j)=><div key={j}>{t.spoiler?<details><summary>Mostrar trecho com spoilers</summary><blockquote>{t.texto}</blockquote></details>:<blockquote>{t.texto}</blockquote>}{t.nota&&<p>{t.nota}</p>}</div>)}</>}{f.tipo==="leituras"&&l.resenha&&!l.resenhaSpoiler&&<p className={styles.resumo}>{l.resenha}</p>}</section>)}</div>}
   <footer>{String(i+1).padStart(2,"0")}</footer>
  </article>;
 }
 if(!hidratado||!p.email)return <AppShell aba="perfil"><p className="p-6">Carregando caderno</p></AppShell>;
 return <AppShell aba="perfil"><div className={styles.area}><div className={styles.topo}><Link href="/perfil">← Perfil</Link><h1>Caderno de leitura</h1><label>Ano <select value={ano} onChange={e=>{setAno(e.target.value);setFolha(0)}}>{anos.map(a=><option key={a}>{a}</option>)}</select></label></div>
 {!aberto?<button className={styles.capa} style={{background:cor}} onClick={()=>setAberto(true)}><span>THE BOOKSIDE</span><span aria-hidden className={styles.ornamento}>✳</span><strong>Caderno de leitura</strong><span>{ano}</span><small>Abrir caderno</small></button>:<><div className={styles.controles}><button onClick={()=>ir(0)}>Índice</button><button onClick={()=>setAberto(false)}>Fechar caderno</button></div><div className={styles.livro} style={{background:cor}}>{render(folhas[folha]??folhas[0],folha)}{folhas[folha+1]&&<div className={styles.direita}>{render(folhas[folha+1],folha+1)}</div>}</div><div className={styles.controles}><button disabled={folha===0} onClick={()=>ir(folha-1)}>← Anterior</button><span aria-live="polite">{folha+1} / {folhas.length}</span><button disabled={folha>=folhas.length-1} onClick={()=>ir(folha+1)}>Próxima →</button></div></>}
 <details className={styles.personalizar}><summary>Personalizar caderno</summary><div className={styles.controles}><span>Cor da capa</span>{cores.map((c,i)=><button key={c} aria-label={["Bordô","Verde","Azul","Ameixa","Rosa"][i]} aria-pressed={c===cor} className={styles.amostra} style={{background:c}} onClick={()=>setCor(c)}>{c===cor?"✓":""}</button>)}</div><label>Papel <select value={papel} onChange={e=>setPapel(e.target.value as typeof papel)}>{papeis.map(v=><option key={v}>{v}</option>)}</select></label><p>Preferências salvas neste navegador.</p></details>
 </div></AppShell>
}
