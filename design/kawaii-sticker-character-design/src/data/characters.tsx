import React from 'react';

export interface IFSCharacter {
  id: string;
  name: string;
  role: 'Self' | 'Manager' | 'Firefighter' | 'Exile';
  roleTitle: string;
  roleDescription: string;
  motto: string;
  description: string;
  burden: string;
  gift: string;
  prompts: string[];
  color: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    bg: string;
    border: string;
  };
  chatResponses: {
    greeting: string;
    onThankYou: string;
    onAskBurden: string;
    onAskGift: string;
    onRelax: string;
  };
  renderSticker: (props: { className?: string; interactive?: boolean; isUnburdened?: boolean }) => React.JSX.Element;
}

export const characters: IFSCharacter[] = [
  {
    id: 'sol-self',
    name: 'Sol (The Core Self)',
    role: 'Self',
    roleTitle: 'The Core Self',
    roleDescription: 'Your natural, undamaged essence. It cannot be hurt and holds the healing qualities of leadership, compassion, and calm.',
    motto: 'I am here with you, always. There is room for all of your parts.',
    description: 'Sol is a peaceful, glowing celestial star-bunny who radiates warmth, calm, and unconditional love. Sol sits in a gentle meditative pose, surrounded by soft stardust. Sol doesn\'t carry burdens; instead, they act as the compassionate leader who listens to and heals all other parts.',
    burden: 'None. The Self is unburdened and holds the natural healing energy of the system.',
    gift: 'Calm, Compassion, Curiosity, Connection, Confidence, Courage, Clarity, and Creativity (The 8 Cs).',
    prompts: [
      "How can I bring more compassion to my parts today?",
      "Can I take a deep breath and feel my core warmth?",
      "What part of me needs a listening ear right now?"
    ],
    color: {
      primary: '#fef08a', // pastel yellow
      secondary: '#fef9c3',
      accent: '#fbbf24',
      dark: '#451a03',
      bg: 'from-amber-50 to-yellow-100',
      border: 'border-yellow-200'
    },
    chatResponses: {
      greeting: "Hello, dear one. I am your Core Self—the calm, compassionate space within you. I am always here, holding a safe space for every single one of your parts. How are you feeling in your body right now?",
      onThankYou: "Thank you for connecting with me. You are doing beautiful work just by being curious and present. Your parts feel this warmth.",
      onAskBurden: "I don't carry a burden, but I am here to help lighten the heavy loads that your other parts have carried for so long. We can help them together.",
      onAskGift: "My gift to you is unconditional presence. When your protectors feel safe to step back, my natural calm, clarity, and compassion will naturally shine through.",
      onRelax: "Take a gentle breath. Let your shoulders soften. I am right here, and we have all the time in the world."
    },
    renderSticker: ({ className = '', interactive = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          {/* High-fidelity drop shadow for 3D sticker effect under single light source */}
          <filter id="sticker-shadow-sol" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          {/* Subtle tactile paper grain texture */}
          <filter id="paper-grain-sol" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
          {/* Celestial radial glow */}
          <radialGradient id="glow-sol" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#fffdec" stopOpacity="1" />
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-sol)">
          {/* Merged silhouette of star-bunny ears, body, and sparkles for a clean 4-6mm white die-cut border */}
          <path
            d="M 100 25 L 108 45 L 128 30 L 115 55 L 138 45 L 125 70 
               C 155 75, 165 105, 165 125 
               C 165 155, 145 168, 100 168 
               C 55 168, 35 155, 35 125 
               C 35 105, 45 75, 75 70 
               L 62 70 L 75 55 L 62 45 L 85 55 L 72 30 L 92 45 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-sol)">
          {/* Ambient Golden Glow */}
          <circle cx="100" cy="115" r="50" fill="url(#glow-sol)" />

          {/* Meditating Celestial Star-Bunny Ears */}
          {/* Left Ear */}
          <path 
            d="M 76 65 C 50 25, 80 15, 88 55 C 90 70, 86 85, 84 95" 
            fill="#fffdeb" 
            stroke="#3d2a1c" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path d="M 77 62 C 60 38, 80 30, 83 55 C 84 68, 81 78, 80 85" fill="#fbcfe8" opacity="0.75" />
          
          {/* Right Ear */}
          <path 
            d="M 124 65 C 150 25, 120 15, 112 55 C 110 70, 114 85, 116 95" 
            fill="#fffdeb" 
            stroke="#3d2a1c" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path d="M 123 62 C 140 38, 120 30, 117 55 C 116 68, 119 78, 120 85" fill="#fbcfe8" opacity="0.75" />

          {/* Main Body & Head */}
          <path 
            d="M 100 78 
               C 132 78, 148 98, 148 120 
               C 148 142, 132 160, 100 160 
               C 68 160, 52 142, 52 120 
               C 52 98, 68 78, 100 78 Z" 
            fill="#fffdec" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" 
          />

          {/* Soft Creamy Cel-Shading for depth */}
          <path 
            d="M 54 125 C 54 140, 68 158, 100 158 C 132 158, 146 140, 146 125 C 130 135, 70 135, 54 125 Z" 
            fill="#fef9c3" 
            opacity="0.8" 
          />

          {/* Flower Crown */}
          <g>
            <circle cx="100" cy="80" r="7" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="88" cy="83" r="6" fill="#a7f3d0" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="112" cy="83" r="6" fill="#c084fc" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="100" cy="80" r="2.5" fill="#fbbf24" />
            <circle cx="88" cy="83" r="2" fill="#fbbf24" />
            <circle cx="112" cy="83" r="2" fill="#fbbf24" />
          </g>

          {/* Peaceful Eyes (Sleeping Arches) */}
          <path d="M 78 112 Q 88 120, 92 112" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 122 112 Q 112 120, 108 112" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          
          {/* Glowing Third-Eye Star */}
          <path 
            d="M 100 92 L 102 97 L 107 97 L 103 100 L 105 105 L 100 102 L 95 105 L 97 100 L 93 97 L 98 97 Z" 
            fill="#fbbf24" 
            stroke="#3d2a1c" 
            strokeWidth="1.8" 
            strokeLinejoin="round"
          />

          {/* Rosy Pastel Blushing Cheeks */}
          <ellipse cx="74" cy="120" rx="8" ry="4.5" fill="#f472b6" opacity="0.65" />
          <ellipse cx="126" cy="120" rx="8" ry="4.5" fill="#f472b6" opacity="0.65" />
          <line x1="71" y1="120" x2="77" y2="118" stroke="#fbcfe8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="123" y1="120" x2="129" y2="118" stroke="#fbcfe8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Tiny Smiling Mouth */}
          <path d="M 97 118 Q 100 121, 103 118" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />

          {/* Meditating Paws */}
          <path d="M 76 135 C 84 135, 88 139, 88 143 C 88 147, 82 148, 76 145" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 124 135 C 116 135, 112 139, 112 143 C 112 147, 118 148, 124 145" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2.5" strokeLinejoin="round" />

          {/* Glowing Lotus Seat */}
          <path 
            d="M 62 148 C 62 160, 138 160, 138 148 C 138 142, 62 142, 62 148 Z" 
            fill="#fef9c3" 
            stroke="#3d2a1c" 
            strokeWidth="3.2" 
            strokeLinejoin="round" 
          />
          <path d="M 75 152 Q 100 158, 125 152" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />

          {/* Floating Stardust Sparkles */}
          {/* Top Sparkle */}
          <path d="M 100 35 L 102 40 L 107 40 L 103 42 L 104 47 L 100 44 L 96 47 L 97 42 L 93 40 L 98 40 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1" />
          {/* Left Sparkle */}
          <path d="M 45 78 L 47 82 L 52 82 L 48 84 L 49 89 L 45 86 L 41 89 L 42 84 L 38 82 L 43 82 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.2" />
          {/* Right Sparkle */}
          <path d="M 155 78 L 157 82 L 162 82 L 158 84 L 159 89 L 155 86 L 151 89 L 152 84 L 148 82 L 153 82 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.2" />
        </g>
      </svg>
    )
  },
  {
    id: 'critic-manager',
    name: 'Perfectionist Critic (The Manager)',
    role: 'Manager',
    roleTitle: 'The Manager (Protector)',
    roleDescription: 'Proactive protectors that run your day-to-day life. They work tirelessly to keep you organized, high-performing, and safe from emotional pain or social rejection.',
    motto: 'We must be absolutely perfect, or they will see how flawed we are!',
    description: 'This is a super cute, fluffy blue-grey hamster-bear who wears giant round glasses and holds an oversized wooden clipboard. He has a tiny, very serious frown and a little furrowed brow. He spends all day checking off lists and looking out for mistakes, thinking he is the only one keeping the system from falling apart.',
    burden: 'The exhausting duty of hyper-vigilance, preventing any errors, and carrying the belief: "If I make a mistake, I am completely unlovable."',
    gift: 'Incredible organization, foresight, discernment, and a strong drive to care for your life in practical ways (without the harsh criticism).',
    prompts: [
      "What are you worried would happen if we made a small mistake today?",
      "Can you feel how hard you've been working to protect me?",
      "Would it be okay to take a 10-minute break while I hold the clipboard?"
    ],
    color: {
      primary: '#bfdbfe', // pastel blue
      secondary: '#dbeafe',
      accent: '#3b82f6',
      dark: '#1e3a8a',
      bg: 'from-blue-50 to-indigo-100',
      border: 'border-blue-200'
    },
    chatResponses: {
      greeting: "Hmph. I don't really have time to chat. There are 47 items on our checklist and at least three things we could have done better yesterday. But... since you're here, what did you need? Is it important?",
      onThankYou: "Thank... you? *fidgets with clipboard* Wait, you're not mad that I pointed out that typo? I... I just don't want anyone else to judge us. It's exhausting being the only one who cares about details.",
      onAskBurden: "My burden? If I stop scanning for mistakes for even a second, we will fail. Everyone will see we aren't good enough. I have to keep this clipboard glued to my paws. I'm so tired, but I can't stop.",
      onAskGift: "If I didn't have to yell at you to keep us safe? I would love to use my organizing powers to plan fun adventures, or just help you write beautiful things with clear, peaceful focus.",
      onRelax: "*lowers glasses slightly* A break? You... you will watch the perimeter? Okay. I will put the pencil down for just a few minutes. But only if you promise to keep us safe."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-critic" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-critic" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-critic)">
          <path 
            d="M 100 50 C 135 50, 155 70, 155 105 
               C 155 105, 162 110, 162 135 
               C 162 165, 135 170, 100 170 
               C 65 170, 38 165, 38 135 
               C 38 110, 45 105, 45 105 
               C 45 70, 65 50, 100 50 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-critic)">
          {/* Fluffy Blue Hamster Ears */}
          <circle cx="68" cy="70" r="16" fill="#93c5fd" stroke="#3d2a1c" strokeWidth="3.5" />
          <circle cx="68" cy="70" r="9" fill="#fbcfe8" />
          
          <circle cx="132" cy="70" r="16" fill="#93c5fd" stroke="#3d2a1c" strokeWidth="3.5" />
          <circle cx="132" cy="70" r="9" fill="#fbcfe8" />

          {/* Main Body */}
          <circle cx="100" cy="118" r="48" fill="#bfdbfe" stroke="#3d2a1c" strokeWidth="3.5" />

          {/* Soft Creamy Belly Patch */}
          <ellipse cx="100" cy="132" rx="26" ry="20" fill="#eff6ff" />

          {/* Eyes (positioned behind glasses) */}
          <circle cx="82" cy="104" r="5.5" fill="#3d2a1c" />
          <circle cx="118" cy="104" r="5.5" fill="#3d2a1c" />
          <circle cx="80" cy="102" r="1.8" fill="#ffffff" />
          <circle cx="116" cy="102" r="1.8" fill="#ffffff" />

          {/* Giant Round Intellectual Glasses */}
          <circle cx="82" cy="104" r="18" fill="none" stroke="#3d2a1c" strokeWidth="3.5" />
          <circle cx="82" cy="104" r="18" fill="#e0f2fe" opacity="0.3" />
          
          <circle cx="118" cy="104" r="18" fill="none" stroke="#3d2a1c" strokeWidth="3.5" />
          <circle cx="118" cy="104" r="18" fill="#e0f2fe" opacity="0.3" />
          
          {/* Bridge & Temple pieces */}
          <path d="M 100 104 Q 100 100 100 104" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="64" y1="104" x2="58" y2="102" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="136" y1="104" x2="142" y2="102" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Brows indicating state */}
          {!isUnburdened ? (
            <g stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 72 82 L 88 88" />
              <path d="M 128 82 L 112 88" />
            </g>
          ) : (
            <g stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 73 82 Q 80 78 87 82" />
              <path d="M 127 82 Q 120 78 113 82" />
            </g>
          )}

          {/* Blushing cheeks */}
          <ellipse cx="68" cy="114" rx="7" ry="3.5" fill="#fbcfe8" />
          <ellipse cx="132" cy="114" rx="7" ry="3.5" fill="#fbcfe8" />

          {/* Nose & Mouth */}
          <polygon points="100,111 97,108 103,108" fill="#3d2a1c" />
          {!isUnburdened ? (
            <path d="M 96 117 Q 100 114 104 117" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <path d="M 96 115 Q 100 120 104 115" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* The Clipboard */}
          <g transform="translate(10, 8) rotate(-6, 120, 120)">
            <rect x="110" y="100" width="38" height="50" rx="4" fill="#d97706" stroke="#3d2a1c" strokeWidth="3" />
            <rect x="115" y="106" width="28" height="40" fill="#fefefe" stroke="#3d2a1c" strokeWidth="2" />
            <rect x="122" y="96" width="14" height="6" rx="1" fill="#94a3b8" stroke="#3d2a1c" strokeWidth="2" />
            
            {isUnburdened ? (
              <g stroke="#3d2a1c" strokeWidth="1.5" strokeLinecap="round" fill="none" transform="translate(118, 112)">
                <path d="M 2 4 L 4 6 L 8 2" stroke="#10b981" strokeWidth="2" />
                <path d="M 2 12 L 4 14 L 8 10" stroke="#10b981" strokeWidth="2" />
                <path d="M 4 24 A 2 2 0 0 1 8 24 A 2 2 0 0 1 12 24 L 8 28 Z" fill="#ef4444" stroke="none" />
                <text x="14" y="22" fontSize="7" fontFamily="sans-serif" fontWeight="bold" fill="#3d2a1c">PLAY</text>
              </g>
            ) : (
              <g stroke="#3d2a1c" strokeWidth="1.2" strokeLinecap="round" fill="none" transform="translate(118, 112)">
                <rect x="1" y="2" width="4" height="4" />
                <line x1="6" y1="4" x2="20" y2="4" />
                <rect x="1" y="10" width="4" height="4" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <rect x="1" y="18" width="4" height="4" />
                <line x1="6" y1="20" x2="22" y2="20" />
                <path d="M 2 13 L 4 11 M 2 11 L 4 13" stroke="#ef4444" strokeWidth="1" />
                <path d="M 2 21 L 4 19 M 2 19 L 4 21" stroke="#ef4444" strokeWidth="1" />
              </g>
            )}
          </g>

          {/* Left paw holding clipboard */}
          <path d="M 104 132 C 108 132, 113 135, 112 141 C 111 145, 104 144, 102 140" fill="#bfdbfe" stroke="#3d2a1c" strokeWidth="3" />
          
          {/* Right paw holding pencil */}
          <g transform="translate(-10, 5)">
            <path d="M 76 127 C 72 127, 67 130, 68 136 C 69 140, 76 139, 78 135" fill="#bfdbfe" stroke="#3d2a1c" strokeWidth="3" />
            <path d="M 64 135 L 56 128 L 54 130 L 62 137 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.5" />
            <polygon points="54,130 50,133 53,129" fill="#f87171" stroke="#3d2a1c" strokeWidth="1" />
          </g>

          {/* Cute stomping feet */}
          <ellipse cx="84" cy="164" rx="9" ry="4.5" fill="#93c5fd" stroke="#3d2a1c" strokeWidth="3" />
          <ellipse cx="116" cy="164" rx="9" ry="4.5" fill="#93c5fd" stroke="#3d2a1c" strokeWidth="3" />

          {/* Stress drops indicating hypervigilance */}
          {!isUnburdened && (
            <g transform="translate(142, 65)" stroke="#3d2a1c" strokeWidth="2" fill="none">
              <path d="M 0 0 Q 3 -5 6 -3" strokeWidth="1.5" />
              <path d="M -5 8 Q -2 3 1 5" strokeWidth="1.5" />
            </g>
          )}
        </g>
      </svg>
    )
  },
  {
    id: 'pleaser-manager',
    name: 'People Pleaser (The Manager)',
    role: 'Manager',
    roleTitle: 'The Manager (Protector)',
    roleDescription: 'Proactive protectors that manage interactions. They ensure everyone else is happy, comfortable, and pleased so you are never rejected or abandoned.',
    motto: 'If I bake cookies and make sure everyone likes me, they will never leave.',
    description: 'Lulu is an incredibly sweet, pastel-pink bunny wearing a tiny white apron with a red heart on the chest. She has massive, sparkly, pleading eyes with bright catchlights, and holds a plate of freshly baked heart-shaped cookies. She smiles so wide it almost hides how tired her arms are from carrying that plate.',
    burden: 'The belief that: "I am only safe and worthy if I am useful and liked by others. My own needs do not matter."',
    gift: 'Deep empathy, genuine kindness, nurturing connection, and a wonderful ability to create warm, welcoming spaces for others.',
    prompts: [
      "What do you need right now, completely independent of what others want?",
      "Can we say a gentle 'no' to something together today?",
      "I love you just for being you, not for what you do. How does that feel?"
    ],
    color: {
      primary: '#fbcfe8', // pastel pink
      secondary: '#fdf2f8',
      accent: '#ec4899',
      dark: '#9d174d',
      bg: 'from-pink-50 to-rose-100',
      border: 'border-pink-200'
    },
    chatResponses: {
      greeting: "Oh! Hello! *smiles brightly, cheeks blushing* I'm so glad you stopped by! I baked these heart-shaped cookies just for you. Are they okay? Do you like them? Is there anything else I can get you to make you comfortable?",
      onThankYou: "You... you like them? Oh, that makes me so happy! I just want everyone to get along and feel good. If you're happy, then I can finally breathe a little bit.",
      onAskBurden: "My burden? *eyes wobble slightly* I'm always so worried someone will be upset with us. If they get angry, it feels like the world is ending. I feel like I have to say 'yes' to everyone, even when I'm so, so tired.",
      onAskGift: "If I didn't have to please everyone? I would love to use my warm heart to bring people together in true friendship, where I can share my cookies but also share my *own* voice and feel loved for who I am.",
      onRelax: "*sets the cookie plate down on a table* You mean... I don't have to hold this all the time? And you still want me around? Wow. My paws feel so light. I'd love to just sit and eat a cookie with you."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened: _isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-pleaser" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-pleaser" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-pleaser)">
          <path 
            d="M 100 75 C 126 75, 142 90, 142 115 
               C 142 115, 150 120, 150 145 
               C 150 168, 125 172, 100 172 
               C 75 172, 50 168, 50 145 
               C 50 120, 58 115, 58 115 
               C 58 90, 74 75, 100 75 
               Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-pleaser)">
          {/* Long floppy ears */}
          <path d="M 72 80 L 52 35 C 48 20, 62 18, 72 32 L 85 80 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 67 75 L 57 42 C 54 30, 64 28, 69 38 L 78 75 Z" fill="#fdf2f8" />
          
          <path d="M 128 80 L 148 35 C 152 20, 138 18, 128 32 L 115 80 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 133 75 L 143 42 C 146 30, 136 28, 131 38 L 122 75 Z" fill="#fdf2f8" />

          {/* Main Body */}
          <path d="M 100 75 
                   C 126 75, 136 95, 136 115 
                   C 136 132, 122 148, 100 148 
                   C 78 148, 64 132, 64 115 
                   C 64 95, 74 75, 100 75 Z" 
                fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          {/* White Apron */}
          <path d="M 82 105 L 118 105 L 122 135 L 78 135 Z" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 82 105 Q 90 95 90 85" fill="none" stroke="#3d2a1c" strokeWidth="2" />
          <path d="M 118 105 Q 110 95 110 85" fill="none" stroke="#3d2a1c" strokeWidth="2" />
          <path d="M 100 112 C 100 112, 97 108, 95 110 C 93 112, 95 116, 100 120 C 105 116, 107 112, 105 110 C 103 108, 100 112, 100 112 Z" fill="#ec4899" />

          {/* Big Sparkly Eyes */}
          <g>
            <circle cx="82" cy="100" r="8" fill="#3d2a1c" />
            <circle cx="118" cy="100" r="8" fill="#3d2a1c" />
            <circle cx="80" cy="98" r="2.5" fill="#ffffff" />
            <circle cx="84.5" cy="102" r="1" fill="#ffffff" />
            <circle cx="116" cy="98" r="2.5" fill="#ffffff" />
            <circle cx="120.5" cy="102" r="1" fill="#ffffff" />
          </g>

          {/* Blushing pink cheeks */}
          <ellipse cx="74" cy="109" rx="8" ry="4" fill="#f472b6" opacity="0.6" />
          <ellipse cx="126" cy="109" rx="8" ry="4" fill="#f472b6" opacity="0.6" />

          {/* Cute bunny nose & smile */}
          <polygon points="100,105 98,103 102,103" fill="#3d2a1c" />
          <path d="M 97 109 Q 100 112 103 109" fill="none" stroke="#3d2a1c" strokeWidth="2" strokeLinecap="round" />

          {/* Cookie Plate */}
          <g transform="translate(0, 10)">
            <ellipse cx="100" cy="125" rx="30" ry="12" fill="#e2e8f0" stroke="#3d2a1c" strokeWidth="3" />
            <ellipse cx="100" cy="123" rx="30" ry="12" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" />
            
            {/* Cookies */}
            <path d="M 85 120 C 85 120, 82 116, 80 118 C 78 120, 80 124, 85 127 C 90 124, 92 120, 90 118 C 88 116, 85 120, 85 120 Z" fill="#d97706" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="115" cy="121" r="6" fill="#d97706" stroke="#3d2a1c" strokeWidth="2" />
            <path d="M 100 114 L 102 118 L 106 118 L 103 121 L 104 125 L 100 123 L 96 125 L 97 121 L 94 118 L 98 118 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" />
          </g>

          {/* Paws holding the plate */}
          <path d="M 72 128 C 76 128, 80 132, 77 137" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 128 128 C 124 128, 120 132, 123 137" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Cute feet at the bottom */}
          <ellipse cx="86" cy="148" rx="8" ry="4" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3" />
          <ellipse cx="114" cy="148" rx="8" ry="4" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3" />

          {/* Heart floating over head */}
          <path d="M 100 52 C 100 52, 97 48, 95 50 C 93 52, 95 56, 100 60 C 105 56, 107 52, 105 50 C 103 48, 100 52, 100 52 Z" fill="#ec4899" stroke="#3d2a1c" strokeWidth="1.5" />
        </g>
      </svg>
    )
  },
  {
    id: 'planner-manager',
    name: 'The Overthinker (The Manager)',
    role: 'Manager',
    roleTitle: 'The Manager (Protector)',
    roleDescription: 'Proactive protectors who use intellectual analysis, endless planning, and mental loops to map out every threat and keep the system ahead of danger.',
    motto: 'If we compile enough spreadsheets and predict every outcome, nothing can hurt us!',
    description: 'Ponder is a tiny lavender owl wearing a cute starry nightcap. He sits on a stack of pastel books, surrounded by steaming coffee mugs. He has large, wide, slightly worried eyes, looking intently at a glowing yellow question mark floating above his head. He is constantly spinning scenarios, drafting lists, and drinking coffee to stay awake.',
    burden: 'The belief that: "The world is unsafe and unpredictable. If I stop thinking, analyzing, and worrying, we will be completely blindsided and crushed."',
    gift: 'Brilliant intellectual clarity, strategic thinking, deep curiosity, problem-solving, and a massive capacity for learning and wisdom.',
    prompts: [
      "What is the absolute worst case scenario you are trying to prevent right now?",
      "Can we thank your amazing mind for its creative scenarios, and let it rest for 5 minutes?",
      "What does it feel like to simply exist in this moment without a problem to solve?"
    ],
    color: {
      primary: '#ddd6fe', // pastel purple
      secondary: '#ede9fe',
      accent: '#8b5cf6',
      dark: '#5b21b6',
      bg: 'from-violet-50 to-purple-100',
      border: 'border-purple-200'
    },
    chatResponses: {
      greeting: "Wait! Don't interrupt, I'm currently modeling 14 different conversational paths for this encounter. *adjusts nightcap* Okay, pathway 4 seems safest. Hello. I have analyzed our schedule, our budget, and our long-term goals. We are 4.2% behind. What is your query?",
      onThankYou: "Thank me? But I haven't even finished the risk assessment! Although... it is nice to be appreciated. Most parts just tell me to 'stop thinking.' They don't understand that thinking is what keeps us alive!",
      onAskBurden: "If I quiet down, we will make a terrible mistake. We will trust the wrong person, or miss a deadline, and everything will collapse. I have to stay awake. That's why I drink so much coffee. I'm so tired, my feathers are fraying.",
      onAskGift: "If it was safe? Oh, I would love to just read books for fun! I would love to research fascinating topics, learn new languages, and use my mind to create beautiful theories, rather than just worrying about disasters.",
      onRelax: "*takes a long sip of chamomile tea* Okay. I will close my notebooks. I will trust that your Self can handle the next ten minutes. But if a crisis occurs, I've left a 50-page manual on the desk."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-planner" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-planner" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-planner)">
          <path 
            d="M 100 55 C 122 55, 142 65, 142 95 
               C 142 95, 155 100, 155 125 
               C 155 155, 130 162, 100 162 
               C 70 162, 45 155, 45 125 
               C 45 100, 58 95, 58 95 
               C 58 65, 78 55, 100 55 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-planner)">
          {/* Stack of Books */}
          <rect x="58" y="142" width="84" height="12" rx="2" fill="#99f6e4" stroke="#3d2a1c" strokeWidth="3" />
          <line x1="68" y1="148" x2="132" y2="148" stroke="#3d2a1c" strokeWidth="1.5" />
          
          <rect x="64" y="132" width="72" height="11" rx="2" fill="#ffedd5" stroke="#3d2a1c" strokeWidth="3" />
          <line x1="74" y1="137" x2="126" y2="137" stroke="#3d2a1c" strokeWidth="1.5" />

          <rect x="70" y="122" width="60" height="11" rx="2" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3" />
          <line x1="78" y1="127" x2="122" y2="127" stroke="#3d2a1c" strokeWidth="1.5" />

          {/* Owl Body */}
          <path d="M 100 70 
                   C 122 70, 132 85, 132 105 
                   C 132 120, 122 130, 100 130 
                   C 78 130, 68 120, 68 105 
                   C 68 85, 78 70, 100 70 Z" 
                fill="#ddd6fe" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          {/* Owl Chest Patch */}
          <path d="M 100 95 C 112 95, 118 105, 118 118 C 118 125, 110 128, 100 128 C 90 128, 82 125, 82 118 C 82 105, 88 95, 100 95 Z" fill="#f5f3ff" />

          {/* Big Owl Eyes */}
          <circle cx="85" cy="95" r="14" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" />
          <circle cx="115" cy="95" r="14" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" />

          {isUnburdened ? (
            <g>
              <circle cx="85" cy="95" r="6" fill="#3d2a1c" />
              <circle cx="115" cy="95" r="6" fill="#3d2a1c" />
              <circle cx="83" cy="93" r="2" fill="#ffffff" />
              <circle cx="113" cy="93" r="2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              <circle cx="87" cy="93" r="6" fill="#3d2a1c" />
              <circle cx="113" cy="93" r="6" fill="#3d2a1c" />
              <circle cx="85.5" cy="91" r="2" fill="#ffffff" />
              <circle cx="111.5" cy="91" r="2" fill="#ffffff" />
            </g>
          )}

          <polygon points="100,98 96,93 104,93" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" strokeLinejoin="round" />

          {/* Nightcap */}
          <path d="M 80 72 
                   C 75 58, 60 50, 48 56 
                   C 40 62, 42 74, 50 78 
                   C 58 82, 70 78, 75 75" 
                fill="#a78bfa" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="45" cy="55" r="6" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2" />

          {/* Wings */}
          <path d="M 69 95 C 60 100, 60 115, 70 120" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 131 95 C 140 100, 140 115, 130 120" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Glowing Floating Question Mark or Lightbulb */}
          {isUnburdened ? (
            <g transform="translate(142, 35)">
              <circle cx="0" cy="0" r="7" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" />
              <path d="M -3 4 L 3 4 M -2 7 L 2 7" stroke="#3d2a1c" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="translate(142, 45)">
              <path d="M -8 -8 C -8 -15, 4 -15, 4 -8 C 4 -4, -2 -2, -2 3" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              <circle cx="-2" cy="9" r="2" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1" />
            </g>
          )}
        </g>
      </svg>
    )
  },
  {
    id: 'distractor-firefighter',
    name: 'The Distractor (The Firefighter)',
    role: 'Firefighter',
    roleTitle: 'The Firefighter (Reactive Protector)',
    roleDescription: 'Reactive protectors that leap into action when an Exile is triggered. They work impulsively to divert your attention, numb you, or change the subject immediately to extinguish emotional pain.',
    motto: 'Pain? No way! Look over here! Video games, candy, and sparkly things! Yay!',
    description: 'Sprinkles is a hyperactive, pastel-orange kitten wearing mint-green gaming headphones, holding a pink video game controller. One eye is winking happily, a half-eaten lollipop sticks out of her mouth, and she is surrounded by flying stars and neon candy wrappers. She keeps you scrolling, playing, and snacking so you never have to feel the sad things underneath.',
    burden: 'The desperate, frantic drive to escape painful emotions, carrying the panic that: "If we feel the sorrow or shame, it will swallow us alive. I must keep us distracted at all costs!"',
    gift: 'Incredible playfulness, spontaneous joy, enthusiasm, creativity, and the ability to bring lightness, rest, and celebration to your life.',
    prompts: [
      "What heavy feeling started to bubble up just before you felt the urge to distract yourself?",
      "Can we let this little kitten know she doesn't have to dance so hard to keep us safe?",
      "Would it be okay to sit quietly together for just three deep breaths? I will protect you."
    ],
    color: {
      primary: '#fed7aa', // pastel orange
      secondary: '#ffedd5',
      accent: '#f97316',
      dark: '#7c2d12',
      bg: 'from-orange-50 to-amber-100',
      border: 'border-orange-200'
    },
    chatResponses: {
      greeting: "*does a little spin* HEY! Look, a butterfly! Wait, no, I'm playing a game! Do you want a piece of candy? I have 10 types of candy! Let's do something fun, let's play a game, let's watch 40 funny animal videos right now! What do you want to do?! Anything but sit still!",
      onThankYou: "Awww, thanks! *winks and throws confetti* You're super cool! No one ever thanks me, they just call me a 'bad habit' or 'wasted time.' But I'm just trying to make sure we don't cry!",
      onAskBurden: "Oh, the sad stuff? No, no, no! We don't talk about that! It's super scary and dark down there. If we go there, we'll sink like a stone! That's why I have to keep the music loud, the screens bright, and the sugar flowing. It's a lot of work!",
      onAskGift: "If we were totally safe? I'd love to just play for the pure fun of it! I'd love to make silly art, dance in the living room, and make you laugh without feeling like I'm running away from a monster.",
      onRelax: "*lowers headphones* You... you promise you've got this? You won't let the sad monster hurt us? Okay. I can turn the volume down. Let's just cuddle and draw a little picture together. No rush."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened: _isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-distractor" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-distractor" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-distractor)">
          <path 
            d="M 100 70 C 124 70, 142 80, 142 105 
               C 142 105, 152 110, 152 135 
               C 152 165, 125 168, 100 168 
               C 75 168, 48 165, 48 135 
               C 48 110, 58 105, 58 105 
               C 58 80, 76 70, 100 70 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-distractor)">
          {/* Cat Ears */}
          <path d="M 65 72 L 52 40 L 78 56 Z" fill="#fed7aa" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 62 67 L 57 48 L 71 57 Z" fill="#fbcfe8" />
          
          <path d="M 135 72 L 148 40 L 122 56 Z" fill="#fed7aa" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 138 67 L 143 48 L 129 57 Z" fill="#fbcfe8" />

          {/* Main Body */}
          <path d="M 100 70 
                   C 124 70, 134 85, 134 105 
                   C 134 125, 122 135, 100 135 
                   C 78 135, 66 125, 66 105 
                   C 66 85, 76 70, 100 70 Z" 
                fill="#fed7aa" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          {/* Eyes */}
          <path d="M 76 96 Q 84 102 86 94" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="116" cy="95" r="7" fill="#3d2a1c" />
          <circle cx="114" cy="93" r="2.5" fill="#ffffff" />

          {/* Headphones */}
          <path d="M 68 85 A 36 36 0 0 1 132 85" fill="none" stroke="#3d2a1c" strokeWidth="7" />
          <path d="M 68 85 A 36 36 0 0 1 132 85" fill="none" stroke="#99f6e4" strokeWidth="4" />
          <rect x="58" y="85" width="10" height="20" rx="4" fill="#2dd4bf" stroke="#3d2a1c" strokeWidth="3" />
          <rect x="132" y="85" width="10" height="20" rx="4" fill="#2dd4bf" stroke="#3d2a1c" strokeWidth="3" />

          {/* Game Controller */}
          <g transform="translate(75, 120)">
            <rect x="0" y="0" width="50" height="26" rx="8" fill="#f472b6" stroke="#3d2a1c" strokeWidth="3" />
            <circle cx="36" cy="11" r="2.5" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'binger-firefighter',
    name: 'Comfort Seeker (The Firefighter)',
    role: 'Firefighter',
    roleTitle: 'The Firefighter (Reactive Protector)',
    roleDescription: 'Reactive protectors who use comforting behaviors, nesting, food, or soothing substances to numb pain, create a cozy buffer, and ground a highly distressed system.',
    motto: 'Let\'s wrap ourselves in 10 blankets, eat a giant strawberry cupcake, and ignore the cold world.',
    description: 'Puff is an extremely round, chubby white hamster completely cocooned inside a pastel-teal blanket like a soft burrito. Only his adorable face, pink cheeks, and tiny paws are peeking out. He is holding a giant cupcake with thick pink frosting and a red cherry on top. He creates a cozy, delicious wall between you and any cold, painful realities.',
    burden: 'The heavy burden of soothing overwhelming emptiness, loneliness, or emotional pain through immediate sensory comfort, carrying the fear: "Without this cozy wall, we will freeze in the coldness of this life."',
    gift: 'Deep nurturing, self-soothing, the ability to slow down, create comforting sanctuaries, and enjoy the simple, sensory pleasures of life in a healthy way.',
    prompts: [
      "What cold or lonely feeling is this cozy blanket trying to keep out?",
      "Can we thank this round hamster for keeping us warm when we felt so frozen?",
      "How can we offer this part deep comfort and warmth from our Core Self today?"
    ],
    color: {
      primary: '#ccfbf1', // pastel teal
      secondary: '#f0fdfa',
      accent: '#0d9488',
      dark: '#115e59',
      bg: 'from-teal-50 to-emerald-100',
      border: 'border-teal-200'
    },
    chatResponses: {
      greeting: "*peeks out from a fluffy teal blanket burrito, mouth full of frosting* Oh... hello. *swallows* Do you want half of my cupcake? It has a cherry. It's very warm and safe inside this blanket. The outside world is very loud and cold today. You can crawl in here if you want.",
      onThankYou: "*blushes deep pink* Really? You're not going to yell at me for eating cake? Most parts call me 'lazy' or say I have no willpower. But I only eat when we feel really, really empty inside. I'm just trying to fill the empty space.",
      onAskBurden: "There is a very cold, lonely feeling. Like we're completely alone in a dark, empty room. It hurts so much. If I don't wrap us up and give us sweet, warm treats, it feels like we will just fade away. I have to keep us insulated.",
      onAskGift: "If the empty room was filled with warmth? Oh, I would love to help you enjoy food and cozy beds just for the fun of it! I could help you create a beautiful, peaceful home, cook delicious meals, and help you rest deeply without feeling guilty.",
      onRelax: "*snuggles deeper into the blanket* I will share my cherry with you. We can just sit here, warm and quiet. You don't have to do anything. You are safe."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened: _isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-binger" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-binger" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-binger)">
          <path 
            d="M 100 65 C 130 65, 155 80, 155 115 
               C 155 115, 162 120, 162 145 
               C 162 168, 125 172, 100 172 
               C 75 172, 50 168, 50 145 
               C 50 120, 58 115, 58 115 
               C 58 80, 70 65, 100 65 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-binger)">
          <circle cx="100" cy="115" r="52" fill="#99f6e4" stroke="#3d2a1c" strokeWidth="3.5" />
          <path d="M 70 95 C 70 70, 130 70, 130 95 C 130 115, 70 115, 70 95 Z" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
          
          <circle cx="88" cy="90" r="5.5" fill="#3d2a1c" />
          <circle cx="112" cy="90" r="5.5" fill="#3d2a1c" />
          
          {/* Giant Cupcake */}
          <g transform="translate(0, 10)">
            <path d="M 80 122 L 120 122 L 114 145 L 86 145 Z" fill="#ffedd5" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 74 120 C 72 110, 128 110, 126 120 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
            <circle cx="100" cy="98" r="6" fill="#ef4444" stroke="#3d2a1c" strokeWidth="2" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'angry-firefighter',
    name: 'Angry Protector (The Firefighter)',
    role: 'Firefighter',
    roleTitle: 'The Firefighter (Reactive Protector)',
    roleDescription: 'Reactive protectors that use anger, boundaries, or aggression to fiercely defend vulnerable Exiles, pushing others away before they can hurt or reject you.',
    motto: 'RAWR! Don\'t you dare come any closer, or I will burn this whole house down!',
    description: 'Spike is a tiny red-panda wearing an oversized cardboard box warrior helmet. He is holding a tiny wooden sword and a round shield. He has puffy red-panda cheeks, steam blowing from his nose, and a fierce but adorable "rawr" expression. He yells and stomps to look scary, but secretly he is just a terrified child trying to shield a wounded brother.',
    burden: 'The exhausting duty of constantly fighting, carrying resentment, and believing: "If I don\'t bite first, they will tear us to pieces. I must never show vulnerability."',
    gift: 'Incredible boundary-setting, passion, courage, protective strength, justice, and high energy to stand up for yourself when mistreated.',
    prompts: [
      "Who or what are you trying to protect with this big, fiery anger?",
      "Can we let this tiny warrior know he doesn't have to fight the whole world alone anymore?",
      "How can I, as the adult, step in and protect this boundary so you can rest?"
    ],
    color: {
      primary: '#fee2e2', // pastel red
      secondary: '#fef2f2',
      accent: '#ef4444',
      dark: '#991b1b',
      bg: 'from-red-50 to-rose-100',
      border: 'border-red-200'
    },
    chatResponses: {
      greeting: "*stomps tiny foot, puffing out cheeks* BACK OFF! I have a sword and I am NOT afraid to use it! *waves tiny wooden sword* Don't you dare look at us like that! We don't need your help, we don't need anyone! Why are you even here?!",
      onThankYou: "*stops mid-swing, blinking* Wait. You're... thanking me? For being angry? But... usually people just tell me to calm down or say I'm being dramatic. They don't see that if I don't growl, they will walk all over us!",
      onAskBurden: "It's so heavy being on guard 24/7. Everyone is a threat. If I let my guard down, they will hurt the little ones inside. I have to keep my spikes up. My throat hurts from growling, and my arms are so tired from holding this shield.",
      onAskGift: "If it was safe? I would love to be your passion! I would love to help you set healthy, firm boundaries with a calm voice. I could help you stand up for what's right, and use my fire to paint, create, and build amazing things.",
      onRelax: "*lowers the cardboard helmet, revealing soft furry ears* You... you will stand up for us? You will tell them 'no' so I don't have to yell? Okay. *places sword down* I'm actually really tired. Can I just get a hug?"
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-angry" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-angry" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-angry)">
          <path 
            d="M 100 80 C 124 80, 142 90, 142 115 
               C 142 115, 155 120, 155 145 
               C 155 168, 125 172, 100 172 
               C 75 172, 48 168, 48 145 
               C 48 120, 58 115, 58 115 
               C 58 90, 76 80, 100 80 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-angry)">
          <path d="M 100 80 
                   C 124 80, 132 95, 132 115 
                   C 132 132, 120 142, 100 142 
                   C 80 142, 68 132, 68 115 
                   C 68 95, 76 80, 100 80 Z" 
                fill="#f87171" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          
          {/* Cardboard Box Helmet */}
          <rect x="66" y="58" width="68" height="36" rx="3" fill="#d97706" stroke="#3d2a1c" strokeWidth="3" />
          <rect x="74" y="82" width="52" height="6" rx="2" fill="#78350f" stroke="#3d2a1c" strokeWidth="1.5" />

          {/* Angry Eyes */}
          {isUnburdened ? (
            <g>
              <circle cx="86" cy="105" r="5.5" fill="#3d2a1c" />
              <circle cx="114" cy="105" r="5.5" fill="#3d2a1c" />
            </g>
          ) : (
            <g>
              <circle cx="86" cy="105" r="5.5" fill="#3d2a1c" />
              <circle cx="114" cy="105" r="5.5" fill="#3d2a1c" />
              <path d="M 76 95 L 92 101" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 124 95 L 108 101" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* Wooden Sword */}
          <g transform="translate(45, 115) rotate(-35)">
            <rect x="-4" y="-22" width="8" height="22" rx="2" fill="#e2e8f0" stroke="#3d2a1c" strokeWidth="2.5" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'lonely-exile',
    name: 'The Lonely Child (The Exile)',
    role: 'Exile',
    roleTitle: 'The Exile (Vulnerable Part)',
    roleDescription: 'Young, tender parts that have experienced trauma, rejection, or neglect. They carry the heavy "burdens" of pain, shame, and fear, locked away deep inside by protectors so you can function.',
    motto: 'I am so small, and it is so dark in here... Will you stay with me this time?',
    description: 'Barnaby is a tiny, teardrop-shaped pastel-blue ghost child wearing oversized blue-and-yellow striped pajama pants. He clutches a worn-out brown teddy bear with visible stitch marks. He has huge, watery, dark eyes with a single shimmering tear. He has been locked in the dark basement of the psyche, holding all the sadness of past rejections.',
    burden: 'The freezing weight of absolute isolation, abandonment, and the core belief: "I am fundamentally flawed, unlovable, and everyone will eventually leave me."',
    gift: 'Incredible sensitivity, depth of feeling, innocence, pure wonder, deep capacity for intimacy, and sweet, child-like trust.',
    prompts: [
      "How long have you been waiting in the dark, sweet little one?",
      "I am here now. I am an adult, and I promise I will never lock you away or leave you.",
      "What would you like me to know about how lonely it was back then?"
    ],
    color: {
      primary: '#bae6fd', // pastel blue-sky
      secondary: '#f0f9ff',
      accent: '#0284c7',
      dark: '#075985',
      bg: 'from-sky-50 to-blue-100',
      border: 'border-sky-200'
    },
    chatResponses: {
      greeting: "*looks up with huge, watery eyes, clutching his teddy bear tighter* H-hello... Are you... are you going to lock the door again? It's really cold and dark in here, and I've been waiting for a very long time. Can you... can you sit with me? Just for a little bit?",
      onThankYou: "*a tiny sparkle appears in his eyes* You... you want to stay? You're not ashamed of my tears? No one usually wants to look at me because I make them feel sad. Thank you for being nice to me.",
      onAskBurden: "I hold all the times we were left out on the playground, and the times we cried in the closet and no one came. It feels like a giant, heavy block of ice in my chest. I feel like I'm completely unlovable, and that's why I was locked away.",
      onAskGift: "If I didn't have to carry this ice? I love to look at clouds, and paint with bright fingers, and hug people tightly! I have so much love to give, and I can help you feel deep wonder and joy at the tiniest things, like a ladybug on a leaf.",
      onRelax: "*slowly lets go of the tight grip on the teddy bear* The ice is... starting to melt. It feels warm. I don't feel so alone anymore. Can we hold hands and walk out into the sunshine?"
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-lonely" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-lonely" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-lonely)">
          <path 
            d="M 100 50 C 65 90, 65 140, 100 145 C 135 140, 135 90, 100 50 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-lonely)">
          <path d="M 100 55 
                   C 68 90, 68 135, 100 140 
                   C 132 135, 132 90, 100 55 Z" 
                fill="#bae6fd" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          {/* Big Watery Sad Eyes */}
          <circle cx="86" cy="95" r="9" fill="#3d2a1c" />
          <circle cx="114" cy="95" r="9" fill="#3d2a1c" />
          <circle cx="83.5" cy="92.5" r="3" fill="#ffffff" />
          <circle cx="111.5" cy="92.5" r="3" fill="#ffffff" />

          {!isUnburdened && (
            <path d="M 116 100 C 116 100, 118 108, 115 111 C 112 114, 108 111, 111 106 Z" fill="#38bdf8" stroke="#3d2a1c" strokeWidth="1.2" />
          )}

          {isUnburdened ? (
            <path d="M 97 105 Q 100 108 103 105" fill="none" stroke="#3d2a1c" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M 97 106 Q 100 102 103 106" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Teddy Bear */}
          <g transform="translate(112, 105)">
            <circle cx="12" cy="12" r="11" fill="#b45309" stroke="#3d2a1c" strokeWidth="2.5" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'scared-exile',
    name: 'Scared Little One (The Exile)',
    role: 'Exile',
    roleTitle: 'The Exile (Vulnerable Part)',
    roleDescription: 'Young, tender parts that hold the fear, terror, and vulnerability of past overwhelming events. They hide away to protect the system from feeling the shock again.',
    motto: 'Is it safe to peek out? It\'s so loud out there... I\'ll just hold my little light.',
    description: 'Shylo is an adorable, mint-green baby turtle pulling his head and tiny paws halfway inside a pastel-pink shell patterned with yellow stars. In one paw, he holds a tiny glowing yellow lantern that casts a soft, warm yellow cone of light. He peeks out with massive, wide, innocent eyes, ready to retreat at the slightest noise.',
    burden: 'The paralyzing fear of the world, carrying the traumatic shock of past events and the belief: "The world is fundamentally unsafe, and if I am fully seen, I will be destroyed."',
    gift: 'Innocence, gentle caution, awareness of safety, pure receptivity, and a beautiful, quiet inner light that guides the way in dark times.',
    prompts: [
      "I see you, sweet little turtle. You can stay inside your shell as long as you need.",
      "I have built a safe, quiet circle around us. Nothing can get to you here.",
      "Would you like me to sit next to your shell and read you a story?"
    ],
    color: {
      primary: '#a7f3d0', // pastel green
      secondary: '#f0fdf4',
      accent: '#059669',
      dark: '#064e3b',
      bg: 'from-emerald-50 to-teal-100',
      border: 'border-emerald-200'
    },
    chatResponses: {
      greeting: "*pulls head slightly back into the shell, then peeks out slowly, raising a tiny glowing lantern* Oh... h-hello. You... you aren't shouting. It's very quiet where you are. Is it... is it safe out there? I brought my little light so I wouldn't get lost in the dark.",
      onThankYou: "*smiles a tiny, shy turtle smile* Thank you. I like my lantern. It keeps me warm. It's nice that you like it too. Usually, everyone is running so fast, they don't see my light.",
      onAskBurden: "There was a very big storm. The lightning was so loud, and everyone was screaming. It felt like my shell was going to crack. I got so scared that I locked myself in here forever. I'm always waiting for the next big noise.",
      onAskGift: "My gift? I hold the quiet light. When the storm is over, I can show you the quiet, beautiful path through the woods. I can help you be very gentle, and help you see the soft beauty in quiet, hidden places.",
      onRelax: "*slowly extends his neck, peeking fully out of the shell* It feels very warm and safe here. The storm has stopped. I can set my lantern down and let you hold my paw. Let's look at the stars."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened: _isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-scared" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1c1611" floodOpacity="0.3" />
          </filter>
          <filter id="paper-grain-scared" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* LAYER 1: PREMIUM WHITE DIE-CUT BACKING & DROP SHADOW */}
        <g filter="url(#sticker-shadow-scared)">
          <path 
            d="M 100 70 C 125 70, 148 85, 148 115 C 148 138, 122 146, 100 146 C 82 146, 74 138, 74 115 C 74 85, 82 70, 100 70 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* LAYER 2: CHARACTER ARTWORK WITH COMPOSITE PAPER GRAIN */}
        <g filter="url(#paper-grain-scared)">
          <path d="M 100 70 
                   C 125 70, 148 85, 148 115 
                   C 148 138, 122 146, 100 146 
                   C 82 146, 74 138, 74 115 
                   C 74 85, 82 70, 100 70 Z" 
                fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          
          <path d="M 80 108 C 80 108, 62 105, 62 92 C 62 78, 76 74, 82 86 C 85 92, 86 100, 86 108 Z" 
                fill="#a7f3d0" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          <circle cx="68" cy="88" r="7.5" fill="#3d2a1c" />
          <circle cx="66.2" cy="85.5" r="2" fill="#ffffff" />
        </g>
      </svg>
    )
  }
];
