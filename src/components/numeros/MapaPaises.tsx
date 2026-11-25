"use client";

import { useMemo } from "react";
import type React from "react";
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
  selecionado,
  onSelecionar,
}: {
  lista: { pais: Pais; qtd: number }[];
  /** uma cor por país (ex.: a mesma da legenda); sem isso, bordô mais escuro quanto mais livros */
  corDoPais?: (pais: Pais) => string;
  /** sem a borda/fundo em volta e sem a legenda de intensidade */
  semMoldura?: boolean;
  /** nome do país em destaque (os outros ficam mais claros) */
  selecionado?: string | null;
  /** clicar num país pintado */
  onSelecionar?: (pais: Pais) => void;
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
        {/* Mercator sem a Antártida: proporção de mapa-múndi de verdade, sem achatar */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 125, center: [0, 30] }}
          width={790}
          height={460}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies
                .filter((geo) => String(Number(geo.id)) !== "10")
                .map((geo) => {
                // o mapa guarda alguns códigos com zero na frente ("076" = Brasil)
                const achado = porId.get(String(Number(geo.id)));
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
                    tabIndex={achado && onSelecionar ? 0 : -1}
                    role={achado && onSelecionar ? "button" : undefined}
                    aria-label={
                      achado && onSelecionar
                        ? `${achado.pais.nome}: ${achado.qtd} ${achado.qtd === 1 ? "livro" : "livros"}`
                        : undefined
                    }
                    onClick={achado && onSelecionar ? () => onSelecionar(achado.pais) : undefined}
                    onKeyDown={
                      achado && onSelecionar
                        ? (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelecionar(achado.pais);
                            }
                          }
                        : undefined
                    }
                    fill={
                      achado
                        ? (corDoPais?.(achado.pais) ?? "var(--color-bordo)")
                        : "var(--color-bege)"
                    }
                    fillOpacity={
                      achado && selecionado && achado.pais.nome !== selecionado
                        ? opacidade * 0.35
                        : opacidade
                    }
                    stroke="var(--color-papel)"
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none", cursor: achado && onSelecionar ? "pointer" : "default" },
                      hover: { outline: "none", cursor: achado && onSelecionar ? "pointer" : "default" },
                      pressed: { outline: "none" },
                    }}
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
