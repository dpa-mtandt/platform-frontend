/**
 * MTANDT equipment-silhouette texture (boom lift, crane, forklift, scissor lift) as a
 * tiled SVG layer. Reused on a light base (the app pages) and a dark base (the login
 * panel) by passing a different `color`/`opacity`. Purely decorative.
 */
export function EquipmentPattern({ color = '#353535', opacity = 0.05, id = 'mt-equip' }: { color?: string; opacity?: number; id?: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        {/* Boom lift (aerial work platform) */}
        <g id={`${id}-boom`} fill={color}>
          <rect x="2" y="66" width="78" height="18" rx="4" />
          <circle cx="18" cy="90" r="10" />
          <circle cx="62" cy="90" r="10" />
          <rect x="30" y="46" width="26" height="24" rx="3" />
          <polygon points="42,56 96,16 104,25 50,65" />
          <rect x="93" y="2" width="24" height="16" rx="2" />
          <rect x="93" y="-6" width="3" height="9" />
          <rect x="114" y="-6" width="3" height="9" />
        </g>
        {/* Telescopic mobile crane */}
        <g id={`${id}-crane`} fill={color}>
          <rect x="0" y="60" width="98" height="16" rx="3" />
          <circle cx="16" cy="80" r="9" />
          <circle cx="44" cy="80" r="9" />
          <circle cx="80" cy="80" r="9" />
          <rect x="6" y="42" width="26" height="20" rx="2" />
          <rect x="36" y="44" width="20" height="18" rx="2" />
          <polygon points="46,54 126,8 133,17 53,63" />
          <rect x="123" y="10" width="3" height="34" />
          <rect x="119" y="44" width="11" height="7" rx="1" />
        </g>
        {/* Forklift */}
        <g id={`${id}-fork`} fill={color}>
          <path d="M6 38 h26 l12 16 h12 v22 H6 Z" />
          <rect x="10" y="14" width="6" height="26" />
          <rect x="40" y="14" width="6" height="26" />
          <rect x="10" y="12" width="36" height="5" rx="1" />
          <circle cx="20" cy="80" r="9" />
          <circle cx="52" cy="80" r="9" />
          <rect x="60" y="14" width="6" height="62" />
          <rect x="66" y="70" width="24" height="5" />
          <rect x="66" y="46" width="16" height="24" />
        </g>
        {/* Scissor lift */}
        <g id={`${id}-scissor`} fill={color}>
          <rect x="4" y="64" width="84" height="14" rx="3" />
          <circle cx="18" cy="82" r="8" />
          <circle cx="74" cy="82" r="8" />
          <g stroke={color} strokeWidth="5" fill="none">
            <path d="M16 62 L76 32" />
            <path d="M76 62 L16 32" />
            <path d="M16 47 L76 47" />
          </g>
          <rect x="6" y="18" width="80" height="13" rx="2" />
          <rect x="6" y="4" width="4" height="16" />
          <rect x="82" y="4" width="4" height="16" />
          <rect x="6" y="4" width="80" height="4" rx="1" />
        </g>

        <pattern id={id} width="470" height="330" patternUnits="userSpaceOnUse" patternTransform="rotate(-4)">
          <use href={`#${id}-boom`} x="14" y="24" />
          <use href={`#${id}-crane`} x="292" y="6" />
          <use href={`#${id}-fork`} x="252" y="206" />
          <use href={`#${id}-scissor`} x="28" y="210" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

/**
 * Subtle MTANDT-branded page backdrop for the app: the MT&T yellow as soft ambient
 * glows over a warm off-white, plus a very faint (~5%) equipment texture. Fixed behind
 * all content so every page shares the same branding without distracting from the UI.
 */
export function BrandBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#faf9f4]">
      <div className="absolute -right-48 -top-56 h-[46rem] w-[46rem] rounded-full bg-brand/25 blur-[110px]" />
      <div className="absolute -bottom-60 -left-48 h-[40rem] w-[40rem] rounded-full bg-brand/[0.12] blur-[110px]" />
      <EquipmentPattern color="#353535" opacity={0.05} id="mt-app" />
    </div>
  );
}
