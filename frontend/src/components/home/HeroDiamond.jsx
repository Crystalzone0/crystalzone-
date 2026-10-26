/**
 * The hero diamond: a faceted gold gem drawn as lightweight SVG (no image files, no libraries).
 * The float, the slow light sweep and the flare twinkle are CSS classes in index.css, and all of them switch off
 * for visitors who prefer reduced motion.
 */
export default function HeroDiamond({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 330"
      className={`cz-hero-art ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cz-d-dark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A67C2E"/><stop offset="1" stopColor="#4A3210"/></linearGradient>
        <linearGradient id="cz-d-mid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E2C27A"/><stop offset="1" stopColor="#8C6A24"/></linearGradient>
        <linearGradient id="cz-d-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF8E0"/><stop offset=".55" stopColor="#EBD7A2"/><stop offset="1" stopColor="#C39A48"/></linearGradient>
        <linearGradient id="cz-d-champ" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F7EBC6"/><stop offset="1" stopColor="#B58C3C"/></linearGradient>
        <linearGradient id="cz-d-deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A581B"/><stop offset="1" stopColor="#2E1E08"/></linearGradient>
        <linearGradient id="cz-d-table" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBEA"/><stop offset=".45" stopColor="#F1DFAE"/><stop offset="1" stopColor="#C9A04E"/></linearGradient>
        <linearGradient id="cz-d-girdle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6B4A16"/><stop offset=".3" stopColor="#F2E1AE"/><stop offset=".55" stopColor="#B58C3C"/><stop offset=".8" stopColor="#F6E9BF"/><stop offset="1" stopColor="#5A3E12"/></linearGradient>
        <linearGradient id="cz-d-gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".45"/><stop offset=".45" stopColor="#fff" stopOpacity="0"/></linearGradient>
        <linearGradient id="cz-d-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#FFF8E0" stopOpacity=".6"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
        <radialGradient id="cz-d-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#E6C77F" stopOpacity=".30"/><stop offset=".6" stopColor="#C6A15B" stopOpacity=".10"/><stop offset="1" stopColor="#C6A15B" stopOpacity="0"/></radialGradient>
        <radialGradient id="cz-d-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#F3D58B" stopOpacity=".7"/><stop offset=".5" stopColor="#C6A15B" stopOpacity=".22"/><stop offset="1" stopColor="#C6A15B" stopOpacity="0"/></radialGradient>
        <linearGradient id="cz-d-rayR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F6E5AE" stopOpacity=".8"/><stop offset="1" stopColor="#C6A15B" stopOpacity="0"/></linearGradient>
        <linearGradient id="cz-d-rayL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#F6E5AE" stopOpacity=".8"/><stop offset="1" stopColor="#C6A15B" stopOpacity="0"/></linearGradient>
        <radialGradient id="cz-d-flare" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".95"/><stop offset=".25" stopColor="#FBEBB4" stopOpacity=".5"/><stop offset="1" stopColor="#C6A15B" stopOpacity="0"/></radialGradient>
        <clipPath id="cz-d-clip"><path d="M20 120L125 72L160 62H240L275 72L380 120V134L200 270L20 134Z"/></clipPath>
      </defs>

      <ellipse cx="200" cy="150" rx="215" ry="150" fill="url(#cz-d-halo)"/>
      <ellipse cx="200" cy="278" rx="170" ry="16" fill="url(#cz-d-floor)"/>
      <g>
        <polygon points="200,272 392,286 392,291" fill="url(#cz-d-rayR)"/>
        <polygon points="200,272 352,312 357,308" fill="url(#cz-d-rayR)"/>
        <polygon points="200,272 8,286 8,291" fill="url(#cz-d-rayL)"/>
        <polygon points="200,272 48,312 43,308" fill="url(#cz-d-rayL)"/>
        <polygon points="200,272 262,326 267,322" fill="url(#cz-d-rayR)" opacity=".7"/>
        <polygon points="200,272 138,326 133,322" fill="url(#cz-d-rayL)" opacity=".7"/>
      </g>

      <g className="cz-hero-diamond">
        <g stroke="rgba(255,248,225,.38)" strokeWidth=".55" strokeLinejoin="round">
          <polygon points="125,72 160,62 240,62 275,72 245,86 155,86" fill="url(#cz-d-table)"/>
          <polygon points="20,120 125,72 72,120" fill="url(#cz-d-mid)"/>
          <polygon points="125,72 72,120 100,120" fill="url(#cz-d-light)"/>
          <polygon points="125,72 100,120 128,120" fill="url(#cz-d-champ)"/>
          <polygon points="125,72 155,86 128,120" fill="url(#cz-d-dark)"/>
          <polygon points="155,86 128,120 176,120" fill="url(#cz-d-light)"/>
          <polygon points="155,86 176,120 200,120 200,86" fill="url(#cz-d-champ)"/>
          <polygon points="200,86 200,120 224,120 245,86" fill="url(#cz-d-mid)"/>
          <polygon points="245,86 224,120 272,120" fill="url(#cz-d-light)"/>
          <polygon points="245,86 275,72 272,120" fill="url(#cz-d-deep)"/>
          <polygon points="275,72 272,120 304,120" fill="url(#cz-d-champ)"/>
          <polygon points="275,72 304,120 328,120" fill="url(#cz-d-mid)"/>
          <polygon points="275,72 328,120 380,120" fill="url(#cz-d-dark)"/>
          <polygon points="125,72 160,62 155,86" fill="url(#cz-d-champ)"/>
          <polygon points="160,62 200,62 200,86 155,86" fill="url(#cz-d-light)" opacity=".9"/>
          <polygon points="240,62 275,72 245,86" fill="url(#cz-d-mid)"/>
          <rect x="20" y="120" width="360" height="14" fill="url(#cz-d-girdle)"/>
          <polygon points="20,134 72,134 200,270" fill="url(#cz-d-deep)"/>
          <polygon points="72,134 128,134 200,270" fill="url(#cz-d-champ)"/>
          <polygon points="128,134 176,134 200,270" fill="url(#cz-d-dark)"/>
          <polygon points="176,134 224,134 200,270" fill="url(#cz-d-light)"/>
          <polygon points="224,134 272,134 200,270" fill="url(#cz-d-mid)"/>
          <polygon points="272,134 328,134 200,270" fill="url(#cz-d-champ)"/>
          <polygon points="328,134 380,134 200,270" fill="url(#cz-d-deep)"/>
        </g>
        <g fill="none" stroke="rgba(255,248,225,.28)" strokeWidth=".5">
          <path d="M100 134L200 270M150 134L200 270M250 134L200 270M300 134L200 270"/>
          <path d="M72 120L100 120M128 120L155 86M224 120L245 86"/>
        </g>
        <polygon points="168,138 184,138 200,232" fill="#fff" opacity=".22"/>
        <polygon points="84,138 110,138 150,208" fill="#fff" opacity=".12"/>
        <polygon points="236,140 262,140 214,224" fill="#1d1204" opacity=".28"/>
        <polygon points="320,138 350,138 236,246" fill="#1d1204" opacity=".18"/>
        <polygon points="168,66 196,66 190,74 164,74" fill="#fff" opacity=".55"/>
        <path d="M20 120L125 72L160 62H240L275 72L380 120V134L200 270L20 134Z" fill="url(#cz-d-gloss)"/>
        <g clipPath="url(#cz-d-clip)"><g transform="skewX(-18)"><rect className="cz-hero-shine" x="-120" y="40" width="38" height="240" fill="url(#cz-d-shine)"/></g></g>
        <path d="M20 120L125 72L160 62H240L275 72L380 120V134L200 270L20 134Z" fill="none" stroke="#FBEFC4" strokeWidth="1.1" strokeLinejoin="round"/>
        <path d="M20 120H380" stroke="#FFF8E0" strokeOpacity=".6" strokeWidth=".6"/>
        <circle cx="292" cy="82" r="32" fill="url(#cz-d-flare)" className="cz-hero-flare"/>
        <path d="M292 56V108M266 82H318" stroke="#fff" strokeOpacity=".7" strokeWidth="1" className="cz-hero-flare"/>
        <circle cx="96" cy="108" r="16" fill="url(#cz-d-flare)" className="cz-hero-flare" style={{ animationDelay: '2.4s' }}/>
        <path d="M96 94V122M82 108H110" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" className="cz-hero-flare" style={{ animationDelay: '2.4s' }}/>
      </g>
    </svg>
  );
}