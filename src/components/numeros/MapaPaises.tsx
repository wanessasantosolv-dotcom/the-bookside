"use client";

import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import countries from "i18n-iso-countries";
import pt from "i18n-iso-countries/langs/pt.json";
import type { Pais } from "@/lib/nacionalidade";

countries.registerLocale(pt);

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** código alpha-2 (ISO) → código numérico do topojson (sem zero à esquerda) */
function numerico(alpha2?: string): string | null {
  if (!alpha2) return null;
  const n = countries.alpha2ToNumeric(alpha2);
  return n ? String(Number(n)) : null;
}

/** o mapa-múndi com os países das autoras lidas pintados, mais escuro quanto mais livros */
export function MapaPaises({
  lista,
  corDoPais,
  semMoldura,
}: {
  lista: { pais: Pais; qtd: number }[];
  /** uma cor por país (ex.: a mesma da legenda); sem isso, bordô mais escuro quanto mais livros */
  corDoPais?: (pais: Pais) => string;
  /** sem a borda/fundo em volta e sem a legenda de intensidade */
  semMoldura?: boolean;
}) {
  const { porId, max } = useMemo(() => {
    const porId = new Map<string, { pais: Pais; qtd: number }>();
    let max = 0;
    for (const item of lista) {
      const id = numerico(item.pais.codigo);
      if (!id) continue;
      porId.set(id, item);
      if (item.qtd > max) max = item.qtd;
    }
    return { porId, max };
  }, [lista]);

  return (
    <div>
      <div className={semMoldura ? "" : "overflow-hidden rounded-[10px] border border-linha bg-papel"}>
        <ComposableMap
          projectionConfig={{ scale: 128 }}
          width={800}
          height={380}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const achado = porId.get(String(geo.id));
                const opacidade = achado
                  ? corDoPais
                    ? 1
                    : 0.38 + 0.62 * (achado.qtd / Math.max(1, max))
                  : semMoldura
                    ? 0.35
                    : 0.3;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={-1}
                    fill={
                      achado
                        ? (corDoPais?.(achado.pais) ?? "var(--color-bordo)")
                        : "var(--color-bege)"
                    }
                    fillOpacity={opacidade}
                    stroke="var(--color-papel)"
                    strokeWidth={0.6}
                    style={{ outline: "none" }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      {/* legenda */}
      <div className={`mt-3 flex items-center gap-3 text-[11px] text-cinza ${semMoldura || corDoPais ? "hidden" : ""}`}>
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-[3px] border border-linha"
            style={{ background: "var(--color-bege)", opacity: 0.4 }}
          />
          ainda não leu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-16 rounded-[3px]" style={MAPA_GRADIENTE} />
          menos → mais livros
        </span>
      </div>
    </div>
  );
}

const MAPA_GRADIENTE = {
  background:
    "linear-gradient(to right, color-mix(in srgb, var(--color-bordo) 38%, transparent), var(--color-bordo))",
};
