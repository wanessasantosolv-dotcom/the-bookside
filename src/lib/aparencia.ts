const CHAVE = "bookside-perfil";

/**
 * Antes da página aparecer: lê a aparência salva e já escurece, sem piscar claro.
 * (roda como script no <head>; mesma regra do componente abaixo)
 */
export const scriptAparencia = `(function(){try{var p=JSON.parse(localStorage.getItem("${CHAVE}")||"{}");var a=(p.state||{}).aparencia||"claro";var e=a==="escuro"||(a==="sistema"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(e)r.dataset.modo="escuro";var c=JSON.parse(localStorage.getItem("bookside-tema-cache")||"null");var v=c&&c[e?"escuro":"claro"];if(v){for(var k in v.p)r.style.setProperty(k,v.p[k]);for(var d in v.d)r.dataset[d]=v.d[d];}}catch(_){}})();`;
