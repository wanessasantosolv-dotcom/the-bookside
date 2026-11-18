/** Datas de leitura: "AAAA-MM-DD" no fuso de quem usa (para <input type="date">). */
export function diaLocal(d: Date = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4)
    .toISOString()
    .slice(0, 10);
}

/** "AAAA-MM-DD" → data salva (meio-dia, para não virar o dia anterior em nenhum fuso). */
export const dataDoDia = (dia: string) =>
  new Date(`${dia}T12:00:00`).toISOString();

/** data salva → "AAAA-MM-DD" */
export const diaDaData = (iso?: string) =>
  iso ? diaLocal(new Date(iso)) : undefined;

export const ontem = () => diaLocal(new Date(Date.now() - 864e5));
