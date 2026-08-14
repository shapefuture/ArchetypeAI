import React from 'react';

export type CustomSpecies = 'hamster' | 'bunny' | 'fox' | 'ghost' | 'star';
export type CustomExpression = 'happy' | 'worried' | 'grumpy' | 'crying' | 'excited';
export type CustomAccessory = 'none' | 'clipboard' | 'cookies' | 'shield' | 'blanket' | 'teddy' | 'lantern' | 'heart';

export interface CustomStickerProps {
  species: CustomSpecies;
  expression: CustomExpression;
  accessory: CustomAccessory;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  name: string;
  className?: string;
  interactive?: boolean;
  isUnburdened?: boolean;
}

export const CustomSticker: React.FC<CustomStickerProps> = ({
  species,
  expression,
  accessory,
  primaryColor,
  secondaryColor,
  accentColor,
  className = '',
  interactive = false,
  isUnburdened = false,
}) => {
  const activeExpression = isUnburdened ? 'happy' : expression;

  return (
    <svg
      viewBox="0 0 200 200"
      className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-2 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
    >
      <defs>
        <filter id="premium-shadow-custom-v2" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1a1c1e" floodOpacity="0.15" />
        </filter>
        <radialGradient id="custom-lantern-glow-v2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
          <stop offset="50%" stopColor="#fde047" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fffdec" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
      <g filter="url(#premium-shadow-custom-v2)">
        {/* Unified Vinyl Die-Cut backing shape */}
        <circle cx="100" cy="108" r="54" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" />
        
        {species === 'bunny' && (
          <g fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round">
            <path d="M 68,85 L 50,30 C 45,15 65,15 75,35 Z" />
            <path d="M 132,85 L 150,30 C 155,15 135,15 125,35 Z" />
          </g>
        )}
        {species === 'fox' && (
          <g fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round">
            <polygon points="50,72 38,35 78,55" />
            <polygon points="150,72 162,35 122,55" />
          </g>
        )}
        {species === 'ghost' && (
          <path d="M 100,50 C 65,90 65,140 100,145 C 135,140 135,90 100,50 Z" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        )}
        {species === 'star' && (
          <path d="M 100,35 L 118,78 L 165,82 L 128,112 L 140,158 L 100,135 L 60,158 L 72,112 L 35,82 L 82,78 Z" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        )}

        {/* Accessory backings */}
        {accessory === 'blanket' && (
          <circle cx="100" cy="115" r="58" fill="#ffffff" stroke="#ffffff" strokeWidth="16" />
        )}
        {accessory === 'shield' && (
          <g fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round">
            <circle cx="145" cy="125" r="22" />
            <path d="M 40,110 L 65,145 L 35,140 Z" />
          </g>
        )}
        {accessory === 'teddy' && (
          <circle cx="130" cy="118" r="22" fill="#ffffff" stroke="#ffffff" strokeWidth="16" />
        )}
        {accessory === 'lantern' && (
          <rect x="30" y="115" width="28" height="36" rx="6" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        )}
        {accessory === 'clipboard' && (
          <rect x="105" y="95" width="48" height="62" rx="6" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        )}
        {accessory === 'cookies' && (
          <ellipse cx="100" cy="135" rx="36" ry="22" fill="#ffffff" stroke="#ffffff" strokeWidth="16" />
        )}
        {accessory === 'heart' && (
          <path d="M 100,140 C 100,140 75,110 75,95 C 75,80 92,80 100,92 C 108,80 125,80 125,95 C 125,110 100,140 100,140 Z" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        )}
      </g>

      {/* ================= LAYER 2: CHARACTER ILLUSTRATION ================= */}
      {/* Species specific parts */}
      {species === 'bunny' && (
        <g>
          <path d="M 72,80 L 52,35 C 48,20 62,18 72,32 L 85,80 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 67,75 L 57,42 C 54,30 64,28 69,38 L 78,75 Z" fill="#fff1f2" />
          <path d="M 128,80 L 148,35 C 152,20 138,18 128,32 L 115,80 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 133,75 L 143,42 C 146,30 136,28 131,38 L 122,75 Z" fill="#fff1f2" />
        </g>
      )}

      {species === 'fox' && (
        <g>
          <path d="M 66,72 L 50,38 L 78,56 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 63,67 L 55,46 L 71,57 Z" fill="#fff1f2" />
          <path d="M 134,72 L 150,38 L 122,56 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 137,67 L 145,46 L 129,57 Z" fill="#fff1f2" />
        </g>
      )}

      {species === 'hamster' && (
        <g>
          <circle cx="65" cy="65" r="15" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4.5" />
          <circle cx="65" cy="65" r="8" fill="#fff1f2" />
          <circle cx="135" cy="65" r="15" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4.5" />
          <circle cx="135" cy="65" r="8" fill="#fff1f2" />
        </g>
      )}

      {/* Main Body Shape */}
      {species === 'ghost' ? (
        <path d="M 100,55 C 68,90 68,135 100,140 C 132,135 132,90 100,55 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="5" strokeLinejoin="round" />
      ) : species === 'star' ? (
        <path d="M 100,40 L 115,80 L 160,84 L 125,112 L 136,154 L 100,132 L 64,154 L 75,112 L 40,84 L 85,80 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="5" strokeLinejoin="round" />
      ) : (
        <path d="M 100,72 C 126,72 136,90 136,112 C 136,130 122,145 100,145 C 78,145 64,130 64,112 C 64,90 74,72 100,72 Z" fill={primaryColor} stroke="#1e1e1a" strokeWidth="5" strokeLinejoin="round" />
      )}

      {/* Soft belly patch */}
      {['hamster', 'bunny', 'fox'].includes(species) && (
        <ellipse cx="100" cy="125" rx="24" ry="16" fill={secondaryColor} />
      )}

      {/* Facial Features */}
      <g>
        {activeExpression === 'happy' && (
          <g>
            <path d="M 78,98 Q 85,104 90,98" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 122,98 Q 115,104 110,98" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        )}
        
        {activeExpression === 'worried' && (
          <g>
            <circle cx="83" cy="98" r="8" fill="#1e1e1a" />
            <circle cx="117" cy="98" r="8" fill="#1e1e1a" />
            <circle cx="81" cy="95" r="2.5" fill="#ffffff" />
            <circle cx="115" cy="95" r="2.5" fill="#ffffff" />
            <path d="M 74,86 Q 83,89 88,84" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 126,86 Q 117,89 112,84" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {activeExpression === 'grumpy' && (
          <g>
            <circle cx="84" cy="99" r="8" fill="#1e1e1a" />
            <circle cx="116" cy="99" r="8" fill="#1e1e1a" />
            <circle cx="85.5" cy="96" r="2.5" fill="#ffffff" />
            <circle cx="114.5" cy="96" r="2.5" fill="#ffffff" />
            <path d="M 75,89 L 91,94" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
            <path d="M 125,89 L 109,94" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {activeExpression === 'crying' && (
          <g>
            <circle cx="83" cy="97" r="9.5" fill="#1e1e1a" />
            <circle cx="117" cy="97" r="9.5" fill="#1e1e1a" />
            <circle cx="80.5" cy="94" r="3.2" fill="#ffffff" />
            <circle cx="114.5" cy="94" r="3.2" fill="#ffffff" />
            <path d="M 86,103 C 86,103 88,109 85,111 Q 82,110 83,106 Z" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="1.2" />
            <path d="M 114,103 C 114,103 112,109 115,111 Q 118,110 117,106 Z" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="1.2" />
          </g>
        )}

        {activeExpression === 'excited' && (
          <g>
            <circle cx="82" cy="97" r="10" fill="#1e1e1a" />
            <circle cx="118" cy="97" r="10" fill="#1e1e1a" />
            <path d="M 82,91 L 83.5,95 L 87.5,95 L 84,97.5 L 85.5,101.5 L 82,99 L 78.5,101.5 L 80,97.5 L 76.5,95 L 80.5,95 Z" fill="#ffffff" />
            <path d="M 118,91 L 119.5,95 L 123.5,95 L 120,97.5 L 121.5,101.5 L 118,99 L 114.5,101.5 L 116,97.5 L 112.5,95 L 116.5,95 Z" fill="#ffffff" />
          </g>
        )}
      </g>

      {/* Blushing cheeks */}
      <g opacity="0.5">
        <ellipse cx="73" cy="106" rx="8" ry="4.5" fill={accentColor} />
        <ellipse cx="127" cy="106" rx="8" ry="4.5" fill={accentColor} />
      </g>

      {/* Nose & Mouth */}
      <polygon points="100,101 98,99 102,99" fill="#1e1e1a" />
      <g>
        {activeExpression === 'grumpy' || activeExpression === 'crying' ? (
          <path d="M 96,108 Q 100,105 104,108" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />
        ) : (
          <path d="M 96,106 Q 100,110 104,106" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />
        )}
      </g>

      {species === 'fox' && (
        <path d="M 94,98 Q 100,103 106,98" fill="none" stroke="#1e1e1a" strokeWidth="2" />
      )}

      {/* Accessories */}
      {accessory === 'blanket' && (
        <g>
          <path d="M 68,115 C 68,95 132,95 132,115 C 132,142 68,142 68,115 Z" fill={secondaryColor} stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 68,115 Q 100,135 132,115" fill="none" stroke={accentColor} strokeWidth="3" />
          <circle cx="76" cy="118" r="5" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
          <circle cx="124" cy="118" r="5" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
        </g>
      )}

      {accessory === 'clipboard' && (
        <g transform="translate(10, 5) rotate(-5, 120, 120)">
          <rect x="110" y="100" width="38" height="50" rx="4" fill="#d97706" stroke="#1e1e1a" strokeWidth="3.5" />
          <rect x="115" y="106" width="28" height="40" fill="#fffdec" stroke="#1e1e1a" strokeWidth="2.5" />
          <rect x="122" y="96" width="14" height="6" rx="1" fill="#94a3b8" stroke="#1e1e1a" strokeWidth="2.5" />
          <line x1="120" y1="112" x2="136" y2="112" stroke="#1e1e1a" strokeWidth="2" strokeLinecap="round" />
          <line x1="120" y1="120" x2="132" y2="120" stroke="#1e1e1a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="106" cy="120" r="6" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
        </g>
      )}

      {accessory === 'cookies' && (
        <g transform="translate(0, 10)">
          <ellipse cx="100" cy="125" rx="30" ry="12" fill="#e2e8f0" stroke="#1e1e1a" strokeWidth="3.5" />
          <ellipse cx="100" cy="123" rx="30" ry="12" fill="#ffffff" stroke="#1e1e1a" strokeWidth="3.5" />
          <path d="M 90,121 C 90,121 88,117 86,119 C 84,121 86,125 90,128 C 94,125 96,121 94,119 C 92,117 90,121 90,121 Z" fill={accentColor} stroke="#1e1e1a" strokeWidth="2.5" />
          <circle cx="112" cy="121" r="5" fill="#d97706" stroke="#1e1e1a" strokeWidth="2.5" />
          <circle cx="70" cy="126" r="6" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
          <circle cx="130" cy="126" r="6" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
        </g>
      )}

      {accessory === 'shield' && (
        <g>
          <g transform="translate(142, 125)">
            <circle cx="0" cy="0" r="14" fill="#d97706" stroke="#1e1e1a" strokeWidth="4" />
            <circle cx="0" cy="0" r="8" fill={accentColor} stroke="#1e1e1a" strokeWidth="3" />
          </g>
          <g transform="translate(45, 115) rotate(-35)">
            <rect x="-4" y="-22" width="8" height="22" rx="2" fill="#e2e8f0" stroke="#1e1e1a" strokeWidth="3.5" />
            <rect x="-8" y="0" width="16" height="4" rx="1" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="3" />
          </g>
          <circle cx="58" cy="124" r="6.5" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
          <circle cx="126" cy="124" r="6.5" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" />
        </g>
      )}

      {accessory === 'teddy' && (
        <g transform="translate(112, 105)">
          <circle cx="12" cy="12" r="10" fill="#b45309" stroke="#1e1e1a" strokeWidth="3" />
          <circle cx="3" cy="3" r="3.5" fill="#b45309" stroke="#1e1e1a" strokeWidth="2.5" />
          <circle cx="21" cy="3" r="3.5" fill="#b45309" stroke="#1e1e1a" strokeWidth="2.5" />
          <ellipse cx="12" cy="15" rx="4" ry="2.5" fill="#fef3c7" stroke="#1e1e1a" strokeWidth="2" />
          <polygon points="12,14.5 11,13 13,13" fill="#1e1e1a" />
          <circle cx="8" cy="10" r="1.5" fill="#1e1e1a" />
          <circle cx="16" cy="10" r="1.5" fill="#1e1e1a" />
          <path d="M -15,15 C -10,15 -6,19 -8,24" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 5,15 C 2,15 -2,19 0,24" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}

      {accessory === 'lantern' && (
        <g>
          <polygon points="42,130 5,165 65,190" fill="url(#custom-lantern-glow-v2)" opacity="0.5" />
          <path d="M 64,120 C 58,120 52,124 53,130 C 54,134 62,132 64,128" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3" strokeLinejoin="round" />
          <g transform="translate(32, 122)">
            <path d="M 4,8 L 16,8 L 10,2 Z" fill="#94a3b8" stroke="#1e1e1a" strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="5" y="8" width="10" height="14" rx="1" fill="#fde047" stroke="#1e1e1a" strokeWidth="3.5" />
            <line x1="8" y1="8" x2="8" y2="22" stroke="#1e1e1a" strokeWidth="1.5" />
            <line x1="12" y1="8" x2="12" y2="22" stroke="#1e1e1a" strokeWidth="1.5" />
          </g>
        </g>
      )}

      {accessory === 'heart' && (
        <g>
          <path d="M 100,135 C 100,135 80,110 80,98 C 80,86 92,86 100,96 C 108,86 120,86 120,98 C 120,110 100,135 100,135 Z" fill={accentColor} stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 86,98 A 4,4 0 0,1 93,94" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="82" cy="112" r="6" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3.5" />
          <circle cx="118" cy="112" r="6" fill={primaryColor} stroke="#1e1e1a" strokeWidth="3.5" />
        </g>
      )}

      {/* Feet (if not ghost/star) */}
      {!['ghost', 'star'].includes(species) && (
        <g>
          <ellipse cx="85" cy="151" rx="8" ry="4.5" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4" />
          <ellipse cx="115" cy="151" rx="8" ry="4.5" fill={primaryColor} stroke="#1e1e1a" strokeWidth="4" />
        </g>
      )}

      {/* Tiny Whimsical Sparkles */}
      <g>
        {isUnburdened ? (
          <g fill="#fbbf24" stroke="#1e1e1a" strokeWidth="1.5">
            <path d="M 50,60 L 52,63 L 55,63 L 53,65 L 54,68 L 50,66 L 46,68 L 47,65 L 45,63 L 48,63 Z" />
            <path d="M 150,60 L 152,63 L 155,63 L 153,65 L 154,68 L 150,66 L 146,68 L 147,65 L 145,63 L 148,63 Z" />
          </g>
        ) : (
          <g fill={accentColor} opacity="0.6">
            <circle cx="50" cy="70" r="3" />
            <circle cx="150" cy="70" r="3" />
          </g>
        )}
      </g>
    </svg>
  );
};
