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
}: {
  lista: { pais: Pais; qtd: number }[];
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
      <div className="overflow-hidden rounded-[10px] border border-linha bg-papel">
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
                  ? 0.38 + 0.62 * (achado.qtd / Math.max(1, max))
                  : 0.3;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={-1}
                    fill={achado ? "var(--color-bordo)" : "var(--color-bege)"}
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
      <div className="mt-3 flex items-center gap-3 text-[11px] text-cinza">
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
