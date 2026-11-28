const assert = require("node:assert/strict");
// Inicie a build local na porta 4317 e disponibilize playwright-core via NODE_PATH.
const { chromium } = require("playwright-core");
const base = `http://127.0.0.1:${process.env.BOOKSIDE_TEST_PORT ?? 4317}`;
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",args:["--no-sandbox"]});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
    const erros = [];
    page.on("pageerror", e => erros.push(e.message));
    page.on("console", m => { if (m.type() === "error" && /Maximum update|unique.*key|same key/.test(m.text())) erros.push(m.text()); });
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.fulfill({json:{docs:[],items:[]}});
      if (url.pathname === "/api/livros") return route.fulfill({json:{items:[{id:"fixture",volumeInfo:{title:"Piranesi",authors:["Susanna Clarke"],language:"pt",pageCount:240}}]}});
      return route.continue();
    });
    await page.addInitScript(() => {
      if (!localStorage.getItem("bookside-perfil")) {
        localStorage.setItem("bookside-perfil",JSON.stringify({state:{
          nome:"leitora fictícia",usuario:"leitora.ficticia",
          livros:[{id:"fixture-local",titulo:"Uma obra",autor:"Autora",status:"lido",lidoEm:"2025-02-04T12:00:00Z",paginas:200,releituras:[{lidoEm:"2025-02-01T12:00:00Z",lidoSoMes:true}]}]
        },version:0}));
      }
    });
    await page.goto(`${base}/descobrir`);
    await page.getByRole("searchbox").fill("Piranesi");
    await page.getByRole("searchbox").press("Enter");
    await page.getByText("Piranesi",{exact:true}).first().waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log("OK descoberta direta no celular (catálogo fictício)");
    await page.goto(`${base}/journal/2025-02`);
    await page.getByRole("button",{name:"compartilhar",exact:true}).first().click();
    const modal=page.getByRole("dialog",{name:"compartilhar a edição"});
    await modal.waitFor();
    const download = page.waitForEvent("download");
    await modal.getByRole("button",{name:"compartilhar imagem",exact:true}).click();
    const arquivo=await download;
    const fs=require("node:fs");
    const bytes=fs.readFileSync(await arquivo.path());
    assert.equal(bytes.subarray(1,4).toString(),"PNG");
    assert(bytes.length > 1000);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [1080, 1920]);
    console.log("OK exportação de PNG do diário no Chromium",bytes.length,"bytes");
    await page.keyboard.press("Escape");
    await modal.waitFor({state:"hidden"});
    await page.goto(`${base}/livro/fixture-local`);
    page.once("dialog", (dialogo) => dialogo.accept());
    await page.getByRole("button", { name: "começar uma releitura" }).click();
    await page.getByRole("button", { name: "terminei", exact: true }).click();
    await page.getByRole("button", { name: "Registrar leitura", exact: true }).click();
    const celebracao = page.getByRole("dialog").filter({ hasText: "Uma obra" });
    await celebracao.waitFor();
    await page.keyboard.press("Escape");
    await celebracao.waitFor({ state: "hidden" });
    const livros = await page.evaluate(() => JSON.parse(localStorage.getItem("bookside-perfil")).state.livros);
    assert.equal(livros.length, 1);
    assert.equal(livros[0].status, "lido");
    assert.equal(livros[0].releituras.length, 2);
    assert.equal(livros[0].releituras[0].lidoSoMes, true);
    console.log("OK releitura registrada, celebração global e histórico preservado");
    const cadastro = await browser.newPage();
    await cadastro.goto(`${base}/confirmar-email`);
    await cadastro.getByRole("heading", { name: "seu perfil local" }).waitFor();
    assert.equal(await cadastro.getByRole("button", { name: "reenviar código" }).count(), 0);
    await cadastro.getByRole("button", { name: "continuar", exact: true }).click();
    await cadastro.waitForURL("**/criar-perfil/nome");
    console.log("OK confirmação local explica a falta de Supabase e continua sem código");
    assert.deepEqual(erros,[]);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
