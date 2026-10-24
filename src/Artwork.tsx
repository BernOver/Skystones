import { useId } from "react";
import {
  Droplets,
  Flame,
  Leaf,
  Mountain,
  Sparkles,
  Wind,
  Cog,
  Skull,
  CircleDot,
} from "lucide-react";
import { ELEMENTS, KEYWORD_RULES, SIDE_LETTERS, keywordGroups } from "./game";
import type { Creature, Edges, Element, Stone } from "./game";

export const ELEMENT_ICONS = {
  fire: Flame,
  life: Leaf,
  water: Droplets,
  air: Wind,
  magic: Sparkles,
  earth: Mountain,
  tech: Cog,
  undead: Skull,
  neutral: CircleDot,
};

export function CreatureArt({
  creature,
  element,
  className = "",
}: {
  creature: Creature;
  element: Element;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const palette = ELEMENTS[element];
  const color = palette.color;
  const dark = palette.ink;
  return (
    <svg
      className={`creature-art ${className}`}
      viewBox="0 0 200 180"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#fff9de" />
          <stop offset="1" stopColor={palette.pale} />
        </radialGradient>
        <pattern
          id={`${id}-grain`}
          width="13"
          height="13"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r=".6" fill={dark} opacity=".15" />
          <circle cx="9" cy="8" r=".5" fill={dark} opacity=".15" />
        </pattern>
      </defs>
      <circle cx="100" cy="88" r="73" fill={`url(#${id}-glow)`} />
      <circle
        cx="100"
        cy="88"
        r="65"
        stroke={dark}
        opacity=".11"
        strokeDasharray="2 6"
      />
      <g
        stroke={dark}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="m32 64 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"
          fill="#fffbeb"
          strokeWidth="1"
          opacity=".8"
        />
        <path
          d="m163 110 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z"
          fill="#fffbeb"
          strokeWidth="1"
          opacity=".8"
        />
        <circle
          cx="153"
          cy="45"
          r="3"
          fill={color}
          opacity=".6"
          stroke="none"
        />
        <ellipse
          cx="100"
          cy="154"
          rx="49"
          ry="6"
          fill={dark}
          opacity=".1"
          stroke="none"
        />
        {creature === "dragon" && (
          <>
            <path
              d="M81 102C49 102 35 81 40 52L66 67 69 39C89 49 102 72 99 92"
              fill={color}
            />
            <path d="m45 59 19 20 6-31M64 79l21 18" opacity=".55" />
            <path d="M119 107c27 9 35 0 40-15 9 25-11 45-42 32" fill={color} />
            <path
              d="M79 96c-12 17-17 43-6 49 9 4 18-1 24-3 14 5 35 7 41-1 6-9-16-9-14-18l1-31"
              fill={color}
            />
            <path
              d="M93 101c-6 14-6 31 3 39 13 3 24 3 28-1-11-7-11-19-7-32"
              fill="#f9dda5"
              stroke="none"
            />
            <path d="m102 53-2-17 12 10 12-13 1 19" fill="#f9dda5" />
            <path
              d="M86 69c0-18 15-25 30-21 16 3 17 19 16 24l16 5c8 3 7 16-4 20-8 4-26 4-35 0-12 1-23-11-23-28Z"
              fill={color}
            />
            <path d="M104 88c9 4 16 3 23 0" />
            <circle cx="116" cy="68" r="3.8" fill={dark} stroke="none" />
            <circle cx="138" cy="83" r="1.7" fill={dark} stroke="none" />
            <path d="m76 141 5-6m30 6 4-5M89 110l-9 8 13 2" />
            <path
              d="m153 72 8-13 3 9 8-4c-1 13-7 15-19 8Z"
              fill="#f0bb64"
              stroke="none"
            />
          </>
        )}
        {creature === "turtle" && (
          <>
            <path
              d="M62 123 49 139c-3 5 2 10 10 7l22-11m39-7 11 16c5 7 16 5 13-2l-8-20"
              fill={color}
            />
            <path d="m54 111-15-1 7 12 15 2" fill={color} />
            <path
              d="M55 118c-6-36 14-61 43-61 28-1 49 25 45 58-17 17-61 23-88 3Z"
              fill={color}
            />
            <path
              d="m77 71 23 13 23-13m-23 13v26l-24 15m24-15 27 12M56 104l21-7V71m0 26 23 13m23-39v28l20 8m-20-8-23 11"
              stroke="#f4efd4"
              strokeWidth="2"
              opacity=".8"
            />
            <path
              d="M132 106c-1-11 7-18 17-17 11 0 19 10 16 22-2 12-17 20-29 16-8-3-12-11-4-21Z"
              fill={color}
            />
            <circle cx="152" cy="103" r="3" fill={dark} stroke="none" />
            <path d="m149 115 9-2" />
            <path
              d="M95 59V40m0 12c-16 0-18-11-18-11 13-4 20 7 18 11Zm0-6c14-1 19-15 19-15-15-2-21 12-19 15Z"
              fill="#73956a"
              stroke="#4e7359"
            />
            <path
              d="m72 61-5-15m2 7c-13-2-13-11-13-11 11-2 14 7 13 11Z"
              fill="#73956a"
              stroke="#4e7359"
            />
            <circle cx="112" cy="49" r="6" fill="#f2c879" stroke="none" />
          </>
        )}
        {creature === "whale" && (
          <>
            <path
              d="M58 91C40 90 26 79 28 64c14-1 22 5 27 12 3-13 11-19 23-18 0 14-8 25-20 33Z"
              fill={color}
            />
            <path
              d="M53 87c11-17 30-31 61-29 39 2 58 24 52 47-6 27-34 39-66 31-33-7-53-26-47-49Z"
              fill={color}
            />
            <path
              d="M57 109c26 29 73 38 102 10-8 19-36 26-64 17-20-6-32-14-38-27Z"
              fill="#f7e8bd"
              stroke="none"
            />
            <path d="M101 115c-5 12-2 26 11 29 7-6 9-13 6-24" fill={color} />
            <path d="M138 109c7 4 13 4 19 0" />
            <circle cx="139" cy="91" r="4" fill={dark} stroke="none" />
            <path
              d="M107 57V43m0 5c-9 0-13-6-11-11 5 0 9 4 11 11Zm0 0c9-1 16-10 13-17-9 1-14 9-13 17Z"
              fill="#99c4c5"
              strokeWidth="1.5"
            />
            <path d="m41 142 10 3m100-10 11-4" opacity=".4" />
            <circle cx="159" cy="64" r="5" strokeWidth="1.3" />
            <circle cx="173" cy="48" r="3" strokeWidth="1.3" />
          </>
        )}
        {creature === "owl" && (
          <>
            <path d="M80 144h-7m51 0h-9m-34-8-2 12m38-12 2 12" />
            <path
              d="M62 69 58 43l26 12c10-5 23-5 33-1l25-16-1 35c13 29 3 66-33 69-39 3-62-27-46-73Z"
              fill={color}
            />
            <path
              d="M73 77c-17 17-18 37 2 48l8-24m45-28c19 17 20 40 1 50l-11-24"
              fill={color}
            />
            <path
              d="M103 65c-21-21-48 2-34 25 9 14 27 12 34 2 8 10 29 10 37-5 11-22-15-43-37-22Z"
              fill="#f5e9ce"
            />
            <circle cx="86" cy="78" r="9" fill="#fff9e8" />
            <circle cx="122" cy="77" r="9" fill="#fff9e8" />
            <circle cx="88" cy="78" r="4" fill={dark} stroke="none" />
            <circle cx="120" cy="77" r="4" fill={dark} stroke="none" />
            <path d="m98 90 6 9 6-10" fill="#d8aa59" />
            <path
              d="m88 112 4 4 4-4m10 0 4 4 4-4m-20 12 4 4 4-4m7 0 4 4 4-4"
              stroke="#f5e9ce"
              strokeWidth="2"
            />
            <path
              d="M151 30c-3 12 1 20 12 24-15 5-28-11-12-24Z"
              fill="#edcc86"
              stroke="none"
            />
          </>
        )}
        {creature === "fox" && (
          <>
            <path
              d="M88 130c-36 22-68 6-61-20 6-20 28-14 29-41 26 13 29 40 19 51l29-3"
              fill={color}
            />
            <path
              d="M33 126c-12-14-5-31 10-38 6 12 8 24-10 38Z"
              fill="#fff0cb"
              stroke="none"
            />
            <path
              d="M87 91c-11 16-12 45 0 50 10 4 32 2 38-1-1-8-12-8-13-14l7-30"
              fill={color}
            />
            <path
              d="M102 104c-9 9-12 20-5 31l12 4"
              fill="#f5e6c2"
              stroke="none"
            />
            <path
              d="m76 79-5-43 27 18 18-1 22-24-1 49c7 24-10 36-27 38-21-2-37-14-34-37Z"
              fill={color}
            />
            <path
              d="m79 49 6 22 8-13m36-16-3 25-8-10"
              fill="#f2c1a1"
              stroke="none"
            />
            <path
              d="M77 80c12-4 26 8 30 19 6-12 19-22 31-21-2 23-15 36-30 38-15-1-28-15-31-36Z"
              fill="#fff0cb"
              stroke="none"
            />
            <path d="m102 99 6 5 6-5Z" fill={dark} />
            <path d="m86 82 5 4m32-5-5 4" strokeWidth="3" />
            <path d="m91 139 4-5m23 4 3-4" />
          </>
        )}
        {creature === "golem" && (
          <>
            <path
              d="m68 89-20 8-7 29 13 7 20-18m57-29 20 13 8 28-16 6-19-20"
              fill={color}
            />
            <path d="m76 123-8 26 25 1 8-24m9-1 8 25 24-2-13-27" fill={color} />
            <path
              d="m66 73 18-23 40-1 17 26-3 43-25 17-35-10-14-28Z"
              fill={color}
            />
            <path
              d="m67 77 28 8 43-7m-43 7-7 23 22 22m-22-22 37-4"
              opacity=".5"
            />
            <path
              d="m81 57 3-16 13 4 11-16 15 8 1 15"
              fill="#8a9d6c"
              stroke="#5a7857"
            />
            <path d="m91 47 4-9m12 9 6-12" stroke="#b7bd87" />
            <circle cx="88" cy="88" r="3.5" fill={dark} stroke="none" />
            <circle cx="118" cy="87" r="3.5" fill={dark} stroke="none" />
            <path d="M96 101q8 7 15-1" />
            <path d="m52 112 5 3m87-2 5-2" />
            <path d="m103 64 6 8-6 7-6-7Z" fill="#f7dda0" stroke="none" />
          </>
        )}
        {creature === "mushroom" && (
          <>
            <path
              d="M76 87c7 17 8 36 1 49-5 11 43 16 48 2-10-17-14-30-9-51"
              fill="#f8e8bd"
            />
            <path
              d="M42 93c-8-10 23-57 57-58 35-2 66 38 61 51-5 15-98 23-118 7Z"
              fill={color}
            />
            <ellipse
              cx="101"
              cy="93"
              rx="55"
              ry="10"
              fill={dark}
              opacity=".17"
              stroke="none"
            />
            <path
              d="M56 76c1-9 9-16 16-12 7 6-7 20-16 12Zm33-27c10-6 23-1 21 8-2 12-25 6-21-8Zm35 23c2-8 16-8 20 1 5 13-25 13-20-1Z"
              fill="#f6e7b8"
              stroke="none"
            />
            <circle cx="92" cy="116" r="3" fill={dark} stroke="none" />
            <circle cx="110" cy="116" r="3" fill={dark} stroke="none" />
            <path d="M97 124q5 4 9 0m-39 18-8-13m6 8 8-8m61 15 6-15" />
            <path
              d="M143 125c-10-11-5-21 5-21 13-1 18 10 15 15-4 5-14 7-20 6Z"
              fill={color}
            />
            <path d="m151 125 2 16" />
            <circle cx="42" cy="119" r="3" fill="#e3bc62" stroke="none" />
          </>
        )}
        {creature === "cat" && (
          <>
            <path
              d="M128 123c30 0 35-31 21-37-11-5-18 11-9 15"
              fill="none"
              stroke={color}
              strokeWidth="14"
            />
            <path
              d="M78 98c-9 11-12 29-7 40 6 9 51 9 58 0 1-13-7-28-15-38"
              fill={color}
            />
            <path
              d="M86 114c-3 12-1 23 6 27h18c6-8 5-18-1-28"
              fill="#f6e9d8"
              stroke="none"
            />
            <path
              d="m66 73-1-34 26 16 25-1 24-19-2 39c7 25-7 39-34 39-28 0-44-16-38-40Z"
              fill={color}
            />
            <path
              d="m72 48 3 22 12-11m44-12-2 20-10-9"
              fill="#f5d0c5"
              stroke="none"
            />
            <path d="m80 82 5 3 5-3m26 0 5 3 5-3" strokeWidth="3" />
            <path d="m98 91 5 4 5-4" fill={dark} />
            <path
              d="m103 95-4 5m4-5 4 5M63 92l16 2m-17 6 16-2m49-3 16-3m-16 7 16 3"
              strokeWidth="1.6"
            />
            <path d="m82 140 4-6m29 7 3-6m-24-76 5 7m11-8-5 8" />
            <path
              d="m43 45 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"
              fill="#edc986"
              stroke="none"
            />
          </>
        )}
        {creature === "slime" && (
          <g>
            <path
              d="M47 127c0-24 22-55 51-55s56 31 56 55c0 28-108 29-107 0Z"
              fill={color}
            />
            <path
              d="M70 89c8-13 20-19 32-17"
              stroke="#fff8df"
              strokeWidth="7"
            />
            <ellipse cx="83" cy="117" rx="5" ry="7" fill={dark} />
            <ellipse cx="118" cy="117" rx="5" ry="7" fill={dark} />
            <path d="M94 130q8 9 16-1" />
            <circle cx="64" cy="51" r="9" fill={color} />
            <circle cx="128" cy="48" r="5" fill={color} />
          </g>
        )}
        {creature === "bat" && (
          <g>
            <path
              d="M86 97Q53 52 29 63l13 27-10 24 25-2 22 27M114 97q33-45 57-34l-13 27 10 24-25-2-22 27"
              fill={color}
            />
            <path d="m78 85 3-34 19 17 20-17 3 34" fill={color} />
            <ellipse cx="101" cy="111" rx="29" ry="38" fill={color} />
            <circle cx="90" cy="97" r="5" fill="#fff6d9" />
            <circle cx="112" cy="97" r="5" fill="#fff6d9" />
            <path d="m92 115 4 9 5-8 6 8 4-9" fill="#fff6d9" />
          </g>
        )}
        {creature === "spider" && (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <path
                  d={`M80 ${90 + i * 12} 53 ${67 + i * 20} 32 ${90 + i * 18}`}
                  strokeWidth="6"
                />
                <path
                  d={`M120 ${90 + i * 12} 147 ${67 + i * 20} 168 ${90 + i * 18}`}
                  strokeWidth="6"
                />
              </g>
            ))}
            <ellipse cx="100" cy="100" rx="35" ry="38" fill={color} />
            <ellipse cx="100" cy="129" rx="26" ry="23" fill={color} />
            <circle cx="89" cy="128" r="7" fill="#fff6d9" />
            <circle cx="112" cy="128" r="7" fill="#fff6d9" />
            <circle cx="90" cy="130" r="3" fill={dark} />
            <circle cx="111" cy="130" r="3" fill={dark} />
            <path d="M94 145q7 5 13-1" />
          </g>
        )}
        {creature === "robot" && (
          <g>
            <path d="M100 46v17" strokeWidth="5" />
            <circle cx="100" cy="40" r="7" fill={color} />
            <rect x="65" y="63" width="70" height="51" rx="12" fill={color} />
            <rect x="73" y="74" width="54" height="22" rx="5" fill="#fff4d9" />
            <circle cx="87" cy="85" r="5" fill={dark} />
            <circle cx="113" cy="85" r="5" fill={dark} />
            <rect x="72" y="118" width="56" height="33" rx="5" fill={color} />
            <path
              d="M62 119 48 136m89-17 15 17M85 151v12m30-12v12"
              strokeWidth="9"
            />
            <path d="M88 132h24m-12-7v14" stroke="#fff6d9" strokeWidth="4" />
          </g>
        )}
        {creature === "griffin" && (
          <g>
            <path
              d="M86 118 43 58l7 45-15-3 39 42m39-24 44-60-8 45 16-3-40 42"
              fill={color}
            />
            <ellipse cx="100" cy="124" rx="32" ry="28" fill={color} />
            <path d="m76 94 4-29 18 12 20-11 7 28" fill="#fff0cf" />
            <ellipse cx="101" cy="96" rx="27" ry="24" fill="#fff0cf" />
            <path d="m96 101 9 14 10-17Z" fill="#dfaf55" />
            <circle cx="87" cy="91" r="4" fill={dark} />
            <circle cx="115" cy="89" r="4" fill={dark} />
            <path d="M83 147v13m32-13v13" strokeWidth="7" />
          </g>
        )}
        {creature === "crab" && (
          <g>
            <path d="M72 120 45 100 36 78m92 42 27-20 9-22" strokeWidth="7" />
            <path
              d="m30 72-9-19 21 5 4-19 10 26-14 16Zm140 0 9-19-21 5-4-19-10 26 14 16Z"
              fill={color}
            />
            <ellipse cx="100" cy="125" rx="42" ry="27" fill={color} />
            <path d="m77 104-4-18m50 18 4-18" strokeWidth="5" />
            <circle cx="72" cy="82" r="8" fill="#fff5d7" />
            <circle cx="128" cy="82" r="8" fill="#fff5d7" />
            <circle cx="73" cy="83" r="3" fill={dark} />
            <circle cx="127" cy="83" r="3" fill={dark} />
            <path
              d="m69 139-20 16m33-9-9 18m45-18 9 18m4-25 20 16"
              strokeWidth="5"
            />
            <path d="M90 131q10 8 20 0" />
          </g>
        )}
        {creature === "serpent" && (
          <g>
            <path
              d="M60 145c-29-16-4-42 31-23s63 21 56-6c-7-29-59-8-61-34-3-24 31-35 46-18"
              stroke={color}
              strokeWidth="22"
            />
            <path d="M60 145c-29-16-4-42 31-23" stroke={dark} strokeWidth="2" />
            <ellipse cx="130" cy="68" rx="25" ry="20" fill={color} />
            <circle cx="137" cy="61" r="6" fill="#fff7d8" />
            <circle cx="139" cy="62" r="3" fill={dark} />
            <path d="m150 75 12 2 5-6m-5 6 6 5" stroke="#c77965" />
            <path d="m108 55 3-17 16 11" fill={color} />
          </g>
        )}
        {creature === "chest" && (
          <g>
            <path d="M49 89c0-32 102-32 102 0v19H49Z" fill={color} />
            <rect x="49" y="107" width="102" height="47" rx="8" fill={color} />
            <path
              d="M65 73v80m69-80v80M49 105h102"
              stroke="#e8c565"
              strokeWidth="8"
            />
            <rect x="89" y="99" width="22" height="27" rx="4" fill="#e8c565" />
            <circle cx="100" cy="110" r="4" fill={dark} />
            <path d="M100 113v6" strokeWidth="3" />
            <path
              d="m82 42 4-13 4 13 13 4-13 4-4 13-4-13-13-4Zm47 9 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z"
              fill="#e8c565"
              stroke="none"
            />
          </g>
        )}
      </g>
      <circle cx="100" cy="88" r="73" fill={`url(#${id}-grain)`} opacity=".5" />
    </svg>
  );
}

export function StoneCard({
  stone,
  owner,
  selected = false,
  compact = false,
  faded = false,
  edges = stone.edges,
  silenced = false,
}: {
  stone: Stone;
  owner?: 0 | 1;
  selected?: boolean;
  compact?: boolean;
  faded?: boolean;
  edges?: Edges;
  silenced?: boolean;
}) {
  const element = ELEMENTS[stone.element];
  const Icon = ELEMENT_ICONS[stone.element];
  return (
    <div
      className={`stone-card ${silenced ? "stone-silenced" : ""} ${owner !== undefined ? `owned-${owner}` : ""} ${selected ? "selected" : ""} ${compact ? "compact" : ""} ${faded ? "faded" : ""}`}
      style={
        {
          "--element-color": element.color,
          "--element-pale": element.pale,
          "--element-ink": element.ink,
        } as React.CSSProperties
      }
    >
      <div className="stone-art">
        {stone.image ? (
          <img
            src={stone.image}
            alt=""
            className={`uploaded-art ${stone.origin === "giants" ? "giants-art" : ""}`}
          />
        ) : (
          <CreatureArt creature={stone.creature} element={stone.element} />
        )}
        {edges.map((edge, i) => (
          <span
            className={`edge edge-${i} ${edge > stone.edges[i] ? "edge-buffed" : edge < stone.edges[i] ? "edge-reduced" : ""}`}
            key={i}
          >
            <b>{edge}</b>
            <span className="edge-spikes">
              {Array.from({ length: edge }, (_, n) => (
                <i key={n} />
              ))}
            </span>
          </span>
        ))}
      </div>
      {!!stone.keywords?.length && (
        <div className="stone-keywords">
          {silenced && <strong className="silenced-label">Silenced</strong>}
          {keywordGroups(stone.keywords!).map(
            ({ type, keywords: matches }, groupIndex) => {
              return matches.length ? (
                <span
                  key={groupIndex}
                  className={`stone-keyword keyword-${type}`}
                >
                  {KEYWORD_RULES[type].name}
                  {type === "sunder" &&
                  matches[0]?.type === "sunder" &&
                  (matches[0].amount ?? 1) > 1
                    ? ` ${matches[0].amount}`
                    : ""}
                  {type === "resonance" &&
                    (() => {
                      const elements = [
                        ...new Set(
                          matches.flatMap((keyword) =>
                            keyword.type === "resonance"
                              ? [ELEMENTS[keyword.element].name]
                              : [],
                          ),
                        ),
                      ];
                      return ` ${elements.length === 1 ? elements[0] : `×${elements.length}`}`;
                    })()}
                  <b>
                    {matches
                      .map((keyword) =>
                        keyword.type === "silence"
                          ? "ON PLAY"
                          : keyword.side === "any"
                            ? "ANY EDGE"
                            : SIDE_LETTERS[keyword.side],
                      )
                      .join("/")}
                  </b>
                </span>
              ) : null;
            },
          )}
        </div>
      )}
      <div className="stone-caption">
        <span>{stone.name}</span>
        <Icon size={13} strokeWidth={1.8} />
      </div>
    </div>
  );
}
