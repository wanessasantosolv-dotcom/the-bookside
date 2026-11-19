const CHAVE = "bookside-perfil";

/**
 * Antes da página aparecer: lê a aparência salva e já escurece, sem piscar claro.
 * (roda como script no <head>; mesma regra do componente abaixo)
 */
export const scriptAparencia = `(function(){try{var p=JSON.parse(localStorage.getItem("${CHAVE}")||"{}");var a=(p.state||{}).aparencia||"claro";var e=a==="escuro"||(a==="sistema"&&matchMedia("(prefers-color-scheme: dark)").matches);if(e)document.documentElement.dataset.modo="escuro";}catch(_){}})();`;
