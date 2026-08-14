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
    bg: string;
    border: string;
    glow: string;
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
      primary: '#fffbeb', // premium cream-yellow
      secondary: '#fef3c7',
      accent: '#fbbf24',
      bg: 'from-amber-50/40 via-yellow-100/20 to-amber-100/30',
      border: 'border-yellow-300/40',
      glow: 'rgba(251, 191, 36, 0.4)'
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-2 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          {/* Advanced multi-stage sticker drop shadow mimicking top-left light source */}
          <filter id="premium-shadow-sol" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#1e1e1a" floodOpacity="0.15" />
          </filter>
          {/* Heavy matte watercolor paper texture */}
          <filter id="heavy-grain-sol" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
          {/* Rich golden gradient */}
          <radialGradient id="aurora-sol" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#fef3c7" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#fde047" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          {/* Inner ear gradient */}
          <linearGradient id="ear-sol" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-sol)">
          {/* Outer vinyl cut line - beautifully organic outline covering all details */}
          <path 
            d="M 100,20 
               C 112,20 115,12 128,15 
               C 138,18 135,38 145,45 
               C 155,50 178,50 180,68 
               C 182,80 168,95 172,110 
               C 176,125 182,145 170,158 
               C 158,170 132,165 120,175 
               C 108,185 92,185 80,175 
               C 68,165 42,170 30,158 
               C 18,145 24,125 28,110 
               C 32,95 18,80 20,68 
               C 22,50 45,50 55,45 
               C 65,38 62,18 72,15 
               C 85,12 88,20 100,20 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-sol)">
          {/* Celestial Aurora Glow */}
          <circle cx="100" cy="108" r="62" fill="url(#aurora-sol)" opacity="0.85" />

          {/* Meditating Lotus Petals (Back) */}
          <path d="M 68,148 C 55,148 50,162 70,165 C 90,168 100,155 100,155 C 100,155 110,168 130,165 C 150,162 145,148 132,148 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          {/* Left Floppy Celestial Ear */}
          <path d="M 68,68 C 45,28 85,12 88,58 C 90,75 82,88 78,92" fill="#fffbeb" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 66,62 C 52,38 78,25 82,56 C 84,68 78,78 74,82" fill="url(#ear-sol)" opacity="0.75" />

          {/* Right Floppy Celestial Ear */}
          <path d="M 132,68 C 155,28 115,12 112,58 C 110,75 118,88 122,92" fill="#fffbeb" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 134,62 C 148,38 122,25 118,56 C 116,68 122,78 126,82" fill="url(#ear-sol)" opacity="0.75" />

          {/* Main Body (Chibi Star-Bunny Shape) */}
          <path 
            d="M 100,75 
               C 126,75 142,92 142,112 
               C 142,132 128,155 100,155 
               C 72,155 58,132 58,112 
               C 58,92 74,75 100,75 Z" 
            fill="#fffdec" 
            stroke="#3d2a1c" 
            strokeWidth="4" 
            strokeLinejoin="round" 
          />

          {/* Star-Bunny Cheek fluff */}
          <path d="M 58,115 Q 52,118 58,122" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 142,115 Q 148,118 142,122" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Meditating Closed Eyes (Peaceful Arches) */}
          <path d="M 76,108 Q 85,116 90,108" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M 124,108 Q 115,116 110,108" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />

          {/* Glowing Third Eye Star (Forehead) */}
          <path d="M 100,85 L 103,92 L 110,92 L 105,96 L 107,103 L 100,99 L 93,103 L 95,96 L 90,92 L 97,92 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" strokeLinejoin="round" />

          {/* Soft Blushing Cheeks */}
          <ellipse cx="73" cy="116" rx="8" ry="4" fill="#fbcfe8" />
          <ellipse cx="127" cy="116" rx="8" ry="4" fill="#fbcfe8" />
          {/* Subtle blush highlight lines */}
          <line x1="70" y1="116" x2="76" y2="114" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="124" y1="116" x2="130" y2="114" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

          {/* Tiny Smiling Mouth */}
          <path d="M 97,114 Q 100,117 103,114" fill="none" stroke="#3d2a1c" strokeWidth="2.8" strokeLinecap="round" />

          {/* Lotus Meditation Pose Hands (Gyan Mudra) */}
          {/* Left Hand */}
          <path d="M 72,132 C 78,132 84,136 82,142 C 80,146 72,146 68,140" fill="#fffdec" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="80" cy="138" r="2.5" fill="#fbbf24" />
          {/* Right Hand */}
          <path d="M 128,132 C 122,132 116,136 118,142 C 120,146 128,146 132,140" fill="#fffdec" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="120" cy="138" r="2.5" fill="#fbbf24" />

          {/* Exquisite Crown of Flowers */}
          <g>
            {/* Center Rose */}
            <circle cx="100" cy="74" r="7.5" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="2.5" />
            <path d="M 97,74 C 97,71 103,71 103,74" fill="none" stroke="#3d2a1c" strokeWidth="1.5" />
            {/* Left Blossom */}
            <circle cx="88" cy="77" r="6" fill="#c084fc" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="88" cy="77" r="1.8" fill="#fbbf24" />
            {/* Right Blossom */}
            <circle cx="112" cy="77" r="6" fill="#a7f3d0" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="112" cy="77" r="1.8" fill="#fbbf24" />
            {/* Tiny leaves */}
            <path d="M 80,80 Q 76,76 82,74 Z" fill="#34d399" stroke="#3d2a1c" strokeWidth="1.5" />
            <path d="M 120,80 Q 124,76 118,74 Z" fill="#34d399" stroke="#3d2a1c" strokeWidth="1.5" />
          </g>

          {/* Sparkles / Celestial Dust */}
          <path d="M 38,65 L 41,70 L 46,70 L 42,73 L 44,78 L 38,75 L 32,78 L 34,73 L 30,70 L 35,70 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M 162,65 L 165,70 L 170,70 L 166,73 L 168,78 L 162,75 L 156,78 L 158,73 L 154,70 L 159,70 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="2.5" fill="#ffffff" />
          <circle cx="150" cy="50" r="2.5" fill="#ffffff" />
          <circle cx="100" cy="35" r="3.5" fill="#fbbf24" />
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
      primary: '#dbeafe', // premium pastel blue
      secondary: '#eff6ff',
      accent: '#2563eb',
      bg: 'from-blue-50/40 via-sky-100/20 to-blue-100/30',
      border: 'border-blue-300/40',
      glow: 'rgba(37, 99, 235, 0.3)'
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:-rotate-2 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-critic" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-critic" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
          <linearGradient id="fur-critic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-critic)">
          <path 
            d="M 100,45 
               C 112,45 115,38 128,40 
               C 138,42 142,50 148,58 
               C 158,68 152,85 156,98 
               C 160,112 165,135 152,148 
               C 138,162 118,155 100,155 
               C 82,155 62,162 48,148 
               C 35,135 40,112 44,98 
               C 48,85 42,68 52,58 
               C 58,50 62,42 72,40 
               C 85,38 88,45 100,45 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-critic)">
          {/* Round Fluffy Ears */}
          <circle cx="62" cy="62" r="16" fill="url(#fur-critic)" stroke="#3d2a1c" strokeWidth="3.5" />
          <circle cx="62" cy="62" r="9" fill="#fbcfe8" />
          
          <circle cx="138" cy="62" r="16" fill="url(#fur-critic)" stroke="#3d2a1c" strokeWidth="3.5" />
          <circle cx="138" cy="62" r="9" fill="#fbcfe8" />

          {/* Main Body (Hamster Circle) */}
          <circle cx="100" cy="108" r="48" fill="url(#fur-critic)" stroke="#3d2a1c" strokeWidth="4" />

          {/* Creamy White Belly Patch */}
          <ellipse cx="100" cy="126" rx="28" ry="18" fill="#eff6ff" />

          {/* Eyes (behind glasses) */}
          <circle cx="82" cy="94" r="5.5" fill="#3d2a1c" />
          <circle cx="118" cy="94" r="5.5" fill="#3d2a1c" />
          <circle cx="80" cy="92" r="1.8" fill="#ffffff" />
          <circle cx="116" cy="92" r="1.8" fill="#ffffff" />

          {/* Giant Gold-Rimmed Glasses */}
          {/* Left Lens */}
          <circle cx="82" cy="94" r="20" fill="none" stroke="#fbbf24" strokeWidth="3.8" />
          <circle cx="82" cy="94" r="20" fill="#e0f2fe" opacity="0.2" />
          {/* Right Lens */}
          <circle cx="118" cy="94" r="20" fill="none" stroke="#fbbf24" strokeWidth="3.8" />
          <circle cx="118" cy="94" r="20" fill="#e0f2fe" opacity="0.2" />
          {/* Bridge */}
          <path d="M 100,94 Q 100,90 100,94" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          {/* Glasses Frame wings */}
          <line x1="62" y1="94" x2="56" y2="92" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="138" y1="94" x2="144" y2="92" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Furrowed Brow (only if not unburdened) */}
          {!isUnburdened ? (
            <g stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 72,68 Q 80,72 86,68" />
              <path d="M 128,68 Q 120,72 114,68" />
            </g>
          ) : (
            <g stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 72,70 Q 80,66 86,70" />
              <path d="M 128,70 Q 120,66 114,70" />
            </g>
          )}

          {/* Blushing Cheeks */}
          <ellipse cx="68" cy="106" rx="7" ry="3.5" fill="#fbcfe8" />
          <ellipse cx="132" cy="106" rx="7" ry="3.5" fill="#fbcfe8" />

          {/* Nose & Mouth */}
          <polygon points="100,101 97,98 103,98" fill="#3d2a1c" />
          {!isUnburdened ? (
            <path d="M 96,107 Q 100,104 104,107" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <path d="M 96,105 Q 100,109 104,105" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* The Clipboard (Oversized) */}
          <g transform="translate(10, 2) rotate(-6, 120, 120)">
            {/* Wooden Board */}
            <rect x="110" y="96" width="40" height="52" rx="4" fill="#d97706" stroke="#3d2a1c" strokeWidth="3" />
            {/* Paper */}
            <rect x="114" y="102" width="32" height="42" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2" />
            {/* Metal Clip */}
            <rect x="123" y="92" width="14" height="7" rx="1.5" fill="#94a3b8" stroke="#3d2a1c" strokeWidth="2" />
            
            {/* Checklists */}
            {isUnburdened ? (
              <g stroke="#10b981" strokeWidth="2" strokeLinecap="round" fill="none" transform="translate(118, 108)">
                <path d="M 2,4 L 4,6 L 8,2" />
                <path d="M 2,12 L 4,14 L 8,10" />
                {/* Heart */}
                <path d="M 4,22 C 4,22 6,20 8,22 C 10,20 12,22 12,22 C 12,22 10,26 8,28 C 6,26 4,22 4,22 Z" fill="#ef4444" stroke="none" />
                <text x="14" y="20" fontSize="7" fontFamily="sans-serif" fontWeight="bold" fill="#3d2a1c" stroke="none">PLAY</text>
              </g>
            ) : (
              <g stroke="#3d2a1c" strokeWidth="1.5" strokeLinecap="round" fill="none" transform="translate(118, 108)">
                <rect x="1" y="2" width="4" height="4" />
                <line x1="7" y1="4" x2="22" y2="4" />
                <rect x="1" y="10" width="4" height="4" />
                <line x1="7" y1="12" x2="20" y2="12" />
                <rect x="1" y="18" width="4" height="4" />
                <line x1="7" y1="20" x2="24" y2="20" />
                {/* Red stress marks */}
                <path d="M 1,11 L 5,15 M 1,15 L 5,11" stroke="#ef4444" strokeWidth="1.2" />
              </g>
            )}
          </g>

          {/* Left Paw holding clipboard */}
          <path d="M 104,124 C 108,124 113,128 112,134 C 111,138 104,137 102,133" fill="url(#fur-critic)" stroke="#3d2a1c" strokeWidth="3.5" />
          
          {/* Right Paw holding a pencil */}
          <g transform="translate(-10, 0)">
            <path d="M 76,124 C 72,124 67,128 68,134 C 69,138 76,137 78,133" fill="url(#fur-critic)" stroke="#3d2a1c" strokeWidth="3.5" />
            {/* Yellow Pencil */}
            <path d="M 64,131 L 56,124 L 54,126 L 62,133 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.5" />
            <polygon points="54,126 50,129 52,125" fill="#f87171" stroke="#3d2a1c" strokeWidth="1" />
          </g>

          {/* Tiny feet */}
          <ellipse cx="85" cy="154" rx="8" ry="4.5" fill="#60a5fa" stroke="#3d2a1c" strokeWidth="3.5" />
          <ellipse cx="115" cy="154" rx="8" ry="4.5" fill="#60a5fa" stroke="#3d2a1c" strokeWidth="3.5" />
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
      primary: '#fbcfe8', // premium pastel pink
      secondary: '#fdf2f8',
      accent: '#db2777',
      bg: 'from-pink-50/40 via-rose-100/20 to-pink-100/30',
      border: 'border-pink-300/40',
      glow: 'rgba(219, 39, 119, 0.3)'
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-3 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-pleaser" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-pleaser" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
          <linearGradient id="ear-pleaser" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-pleaser)">
          <path 
            d="M 100,50 
               C 112,50 118,45 125,30 
               C 132,15 152,15 155,32 
               C 158,50 138,80 142,95 
               C 146,110 148,135 135,148 
               C 120,162 100,155 100,155 
               C 100,155 80,162 65,148 
               C 52,135 54,110 58,95 
               C 62,80 42,50 45,32 
               C 48,15 68,15 75,30 
               C 82,45 88,50 100,50 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-pleaser)">
          {/* Long Floppy Ears */}
          {/* Left Ear */}
          <path d="M 72,80 L 52,35 C 48,20 62,18 72,32 L 85,80 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 67,75 L 57,42 C 54,30 64,28 69,38 L 78,75 Z" fill="url(#ear-pleaser)" />
          
          {/* Right Ear */}
          <path d="M 128,80 L 148,35 C 152,20 138,18 128,32 L 115,80 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 133,75 L 143,42 C 146,30 136,28 131,38 L 122,75 Z" fill="url(#ear-pleaser)" />

          {/* Main Body */}
          <path 
            d="M 100,75 
               C 126,75 136,92 136,112 
               C 136,130 122,148 100,148 
               C 78,148 64,130 64,112 
               C 64,92 74,75 100,75 Z" 
            fill="#fbcfe8" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" 
          />

          {/* Elegant White Apron */}
          <path d="M 82,105 L 118,105 L 122,135 L 78,135 Z" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Apron Straps */}
          <path d="M 82,105 Q 90,95 90,85" fill="none" stroke="#3d2a1c" strokeWidth="2" />
          <path d="M 118,105 Q 110,95 110,85" fill="none" stroke="#3d2a1c" strokeWidth="2" />
          {/* Magenta Heart on Apron */}
          <path d="M 100,112 C 100,112 97,108 95,110 C 93,112 95,116 100,120 C 105,116 107,112 105,110 C 103,108 100,112 100,112 Z" fill="#db2777" />

          {/* Big Pleading Sparkly Eyes */}
          <g>
            <circle cx="82" cy="98" r="8.5" fill="#3d2a1c" />
            <circle cx="118" cy="98" r="8.5" fill="#3d2a1c" />
            {/* Catchlights */}
            <circle cx="80" cy="96" r="2.8" fill="#ffffff" />
            <circle cx="84.5" cy="100.5" r="1.2" fill="#ffffff" />
            <circle cx="116" cy="96" r="2.8" fill="#ffffff" />
            <circle cx="120.5" cy="100.5" r="1.2" fill="#ffffff" />
            {/* Eyelashes */}
            <path d="M 74,95 Q 72,92 70,94" fill="none" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 126,95 Q 128,92 130,94" fill="none" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Blushing Pink Cheeks */}
          <ellipse cx="74" cy="107" rx="8" ry="4.5" fill="#db2777" opacity="0.45" />
          <ellipse cx="126" cy="107" rx="8" ry="4.5" fill="#db2777" opacity="0.45" />

          {/* Cute Nose & Smile */}
          <polygon points="100,103 98,101 102,101" fill="#3d2a1c" />
          <path d="M 97,107 Q 100,110 103,107" fill="none" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />

          {/* Cookie Plate (held in front) */}
          <g transform="translate(0, 10)">
            <ellipse cx="100" cy="125" rx="32" ry="13" fill="#e2e8f0" stroke="#3d2a1c" strokeWidth="3" />
            <ellipse cx="100" cy="123" rx="32" ry="13" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" />
            
            {/* Heart Cookies */}
            <path d="M 85,120 C 85,120 82,116 80,118 C 78,120 80,124 85,127 C 90,124 92,120 90,118 C 88,116 85,120 85,120 Z" fill="#d97706" stroke="#3d2a1c" strokeWidth="2" />
            <path d="M 115,120 C 115,120 112,116 110,118 C 108,120 110,124 115,127 C 120,124 122,120 120,118 C 118,116 115,120 115,120 Z" fill="#d97706" stroke="#3d2a1c" strokeWidth="2" />
            {/* Chocolate chips */}
            <circle cx="83" cy="121" r="0.8" fill="#78350f" />
            <circle cx="87" cy="123" r="0.8" fill="#78350f" />
            <circle cx="113" cy="121" r="0.8" fill="#78350f" />
            <circle cx="117" cy="123" r="0.8" fill="#78350f" />
          </g>

          {/* Paws holding the plate */}
          <path d="M 70,128 C 74,128 78,132 75,137" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M 130,128 C 126,128 122,132 125,137" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />

          {/* Cute Feet */}
          <ellipse cx="86" cy="148" rx="8" ry="4.5" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" />
          <ellipse cx="114" cy="148" rx="8" ry="4.5" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" />
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
      primary: '#ddd6fe', // premium pastel purple
      secondary: '#ede9fe',
      accent: '#7c3aed',
      bg: 'from-violet-50/40 via-purple-100/20 to-violet-100/30',
      border: 'border-purple-300/40',
      glow: 'rgba(124, 58, 237, 0.3)'
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-2 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-planner" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-planner" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-planner)">
          <path 
            d="M 100,45 
               C 112,45 118,35 130,40 
               C 142,45 148,60 152,75 
               C 156,90 150,110 145,120 
               C 140,130 152,142 142,158 
               C 132,170 108,168 100,168 
               C 92,168 68,170 58,158 
               C 48,142 60,130 55,120 
               C 50,110 44,90 48,75 
               C 52,60 58,45 70,40 
               C 82,35 88,45 100,45 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-planner)">
          {/* Stack of Books */}
          {/* Bottom Book - Teal */}
          <rect x="58" y="142" width="84" height="12" rx="2" fill="#99f6e4" stroke="#3d2a1c" strokeWidth="3" />
          <line x1="68" y1="148" x2="132" y2="148" stroke="#3d2a1c" strokeWidth="1.5" />
          
          {/* Middle Book - Peach */}
          <rect x="64" y="132" width="72" height="11" rx="2" fill="#ffedd5" stroke="#3d2a1c" strokeWidth="3" />
          <line x1="74" y1="137" x2="126" y2="137" stroke="#3d2a1c" strokeWidth="1.5" />

          {/* Top Book - Pink */}
          <rect x="70" y="122" width="60" height="11" rx="2" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3" />
          <line x1="78" y1="127" x2="122" y2="127" stroke="#3d2a1c" strokeWidth="1.5" />

          {/* Owl Body */}
          <path 
            d="M 100,68 
               C 122,68 132,83 132,103 
               C 132,118 122,128 100,128 
               C 78,128 68,118 68,103 
               C 68,83 78,68 100,68 Z" 
            fill="#ddd6fe" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" 
          />

          {/* Owl White Chest Patch */}
          <path d="M 100,93 C 112,93 118,103 118,116 C 118,123 110,126 100,126 C 90,126 82,123 82,116 C 82,93 88,93 100,93 Z" fill="#f5f3ff" />
          {/* Feathers */}
          <path d="M 95,103 L 97,106 L 99,103 M 101,103 L 103,106 L 105,103" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />

          {/* Big Owl Eyes */}
          <circle cx="84" cy="93" r="14" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" />
          <circle cx="116" cy="93" r="14" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3" />

          {/* Pupils */}
          {isUnburdened ? (
            <g>
              <circle cx="84" cy="93" r="6" fill="#3d2a1c" />
              <circle cx="116" cy="93" r="6" fill="#3d2a1c" />
              <circle cx="82" cy="91" r="2" fill="#ffffff" />
              <circle cx="114" cy="91" r="2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              <circle cx="86" cy="91" r="6" fill="#3d2a1c" />
              <circle cx="114" cy="91" r="6" fill="#3d2a1c" />
              <circle cx="84.5" cy="89" r="2" fill="#ffffff" />
              <circle cx="112.5" cy="89" r="2" fill="#ffffff" />
            </g>
          )}

          {/* Beak */}
          <polygon points="100,96 96,91 104,91" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" strokeLinejoin="round" />

          {/* Sweet blush */}
          <ellipse cx="72" cy="104" rx="5" ry="2.5" fill="#fbcfe8" />
          <ellipse cx="128" cy="104" rx="5" ry="2.5" fill="#fbcfe8" />

          {/* Nightcap */}
          <path d="M 80,70 C 75,56 60,48 48,54 C 40,60 42,72 50,76 Q 65,80 75,73" fill="#a78bfa" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="45" cy="53" r="6" fill="#fffdec" stroke="#3d2a1c" strokeWidth="2" />

          {/* Wings */}
          <path d="M 69,93 C 60,98 60,113 70,118" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 131,93 C 140,98 140,113 130,118" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Little Feet */}
          <path d="M 90,128 C 90,132 94,132 94,128" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />
          <path d="M 110,128 C 110,132 106,132 106,128" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />

          {/* Floating question mark or lightbulb */}
          {isUnburdened ? (
            <g transform="translate(142, 35)">
              <circle cx="0" cy="0" r="8" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2.2" />
              <path d="M -3,5 L 3,5 M -2,8 L 2,8" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 0,-8 L 0,-11 M 8,0 L 11,0 M -8,0 L -11,0 M 6,-6 L 9,-9 M -6,-6 L -9,-9" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="translate(142, 45)">
              <path d="M -8,-8 C -8,-15 4,-15 4,-8 C 4,-4 -2,-2 -2,3" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="-2" cy="10" r="2" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1.2" />
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
      primary: '#fed7aa', // premium pastel orange
      secondary: '#ffedd5',
      accent: '#ea580c',
      bg: 'from-orange-50/40 via-amber-100/20 to-orange-100/30',
      border: 'border-orange-300/40',
      glow: 'rgba(234, 88, 12, 0.3)'
    },
    chatResponses: {
      greeting: "*does a little spin* HEY! Look, a butterfly! Wait, no, I'm playing a game! Do you want a piece of candy? I have 10 types of candy! Let's do something fun, let's play a game, let's watch 40 funny animal videos right now! What do you want to do?! Anything but sit still!",
      onThankYou: "Awww, thanks! *winks and throws confetti* You're super cool! No one ever thanks me, they just call me a 'bad habit' or 'wasted time.' But I'm just trying to make sure we don't cry!",
      onAskBurden: "Oh, the sad stuff? No, no, no! We don't talk about that! It's super scary and dark down there. If we go there, we'll sink like a stone! That's why I have to keep the music loud, the screens bright, and the sugar flowing. It's a lot of work!",
      onAskGift: "If we were totally safe? I'd love to just play for the pure fun of it! I'd love to make silly art, dance in the living room, and make you laugh without feeling like I'm running away from a monster.",
      onRelax: "*lowers headphones* You... you promise you've got this? You won't let the sad monster hurt us? Okay. I can turn the volume down. Let's just cuddle and draw a little picture together. No rush."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-3 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-distractor" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-distractor" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-distractor)">
          <path 
            d="M 100,50 
               C 112,50 118,42 128,45 
               C 138,48 145,55 150,65 
               C 158,80 148,100 152,115 
               C 156,130 145,145 130,148 
               C 115,152 100,145 100,145 
               C 100,145 85,152 70,148 
               C 55,145 44,130 48,115 
               C 52,100 42,80 50,65 
               C 55,55 62,48 72,45 
               C 82,42 88,50 100,50 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-distractor)">
          {/* Cat Ears */}
          <path d="M 65,72 L 52,40 L 78,56 Z" fill="#fed7aa" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 62,67 L 57,48 L 71,57 Z" fill="#fbcfe8" />
          
          <path d="M 135,72 L 148,40 L 122,56 Z" fill="#fed7aa" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 138,67 L 143,48 L 129,57 Z" fill="#fbcfe8" />

          {/* Main Body */}
          <path 
            d="M 100,70 
               C 124,70 134,85 134,105 
               C 134,125 122,135 100,135 
               C 78,135 66,125 66,105 
               C 66,85 76,70 100,70 Z" 
            fill="#fed7aa" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" 
          />

          {/* Eyes (Winking & Big) */}
          <g>
            <path d="M 76,96 Q 84,102 86,94" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="116" cy="95" r="7.5" fill="#3d2a1c" />
            <circle cx="114" cy="93" r="2.8" fill="#ffffff" />
          </g>

          {/* Whiskers */}
          <path d="M 60,105 L 50,104 M 60,109 L 48,110" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 140,105 L 150,104 M 140,109 L 152,110" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />

          {/* Cute Mouth */}
          <polygon points="100,100 98,98 102,98" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="1" />
          <path d="M 94,104 Q 97,107 100,104 Q 103,107 106,104" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />

          {/* Lollipop (if not unburdened) */}
          {!isUnburdened && (
            <g transform="translate(104, 104) rotate(15)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="0" cy="0" r="5.5" fill="#db2777" stroke="#3d2a1c" strokeWidth="1.8" />
            </g>
          )}

          {/* Blushing cheeks */}
          <ellipse cx="72" cy="104" rx="6" ry="3" fill="#db2777" opacity="0.5" />
          <ellipse cx="128" cy="104" rx="6" ry="3" fill="#db2777" opacity="0.5" />

          {/* Mint-Green Headphones */}
          <path d="M 68,85 A 36,36 0 0,1 132,85" fill="none" stroke="#3d2a1c" strokeWidth="7" />
          <path d="M 68,85 A 36,36 0 0,1 132,85" fill="none" stroke="#99f6e4" strokeWidth="4" />
          <rect x="58" y="85" width="10" height="20" rx="4" fill="#2dd4bf" stroke="#3d2a1c" strokeWidth="3.5" />
          <rect x="132" y="85" width="10" height="20" rx="4" fill="#2dd4bf" stroke="#3d2a1c" strokeWidth="3.5" />

          {/* Game Controller */}
          <g transform="translate(75, 120)">
            <rect x="0" y="0" width="50" height="26" rx="8" fill="#f472b6" stroke="#3d2a1c" strokeWidth="3" />
            <path d="M 8,13 L 14,13 M 11,10 L 11,16" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="36" cy="11" r="2.5" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1" />
            <circle cx="42" cy="15" r="2.5" fill="#3b82f6" stroke="#3d2a1c" strokeWidth="1" />
          </g>

          {/* Paws */}
          <path d="M 70,122 C 74,122 78,126 76,132" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M 130,122 C 126,122 122,126 124,132" fill="none" stroke="#3d2a1c" strokeWidth="3.8" strokeLinecap="round" />

          {/* Star Sparkles */}
          <path d="M 42,76 L 44,79 L 47,79 L 45,81 L 46,84 L 42,82 L 38,84 L 39,81 L 37,79 L 40,79 Z" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="1" />
          <path d="M 154,78 L 156,81 L 159,81 L 157,83 L 158,86 L 154,84 L 150,86 L 151,83 L 149,81 L 152,81 Z" fill="#f472b6" stroke="#3d2a1c" strokeWidth="1" />
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
      primary: '#ccfbf1', // premium pastel teal
      secondary: '#f0fdfa',
      accent: '#0f766e',
      bg: 'from-teal-50/40 via-emerald-100/20 to-teal-100/30',
      border: 'border-teal-300/40',
      glow: 'rgba(15, 118, 110, 0.3)'
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:-rotate-3 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-binger" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-binger" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-binger)">
          <path 
            d="M 100,50 
               C 112,50 120,45 132,52 
               C 145,60 152,75 155,90 
               C 158,110 152,130 148,145 
               C 142,158 120,165 100,165 
               C 80,165 58,158 52,145 
               C 48,130 42,110 45,90 
               C 48,75 55,60 68,52 
               C 80,45 88,50 100,50 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-binger)">
          {/* Fluffy Blanket Burrito (Teal) */}
          <circle cx="100" cy="108" r="52" fill="#99f6e4" stroke="#3d2a1c" strokeWidth="4" />
          
          {/* Blanket opening */}
          <path d="M 70,88 C 70,63 130,63 130,88 C 130,108 70,108 70,88 Z" fill="#ffffff" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />

          {/* Hamster face inside */}
          <circle cx="78" cy="67" r="8" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="2.5" />
          <circle cx="122" cy="67" r="8" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="2.5" />

          {/* Big Sparkly Eyes */}
          <circle cx="88" cy="83" r="6" fill="#3d2a1c" />
          <circle cx="112" cy="83" r="6" fill="#3d2a1c" />
          <circle cx="86" cy="81" r="1.8" fill="#ffffff" />
          <circle cx="110" cy="81" r="1.8" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <ellipse cx="78" cy="91" rx="7" ry="4" fill="#db2777" opacity="0.45" />
          <ellipse cx="122" cy="91" rx="7" ry="4" fill="#db2777" opacity="0.45" />

          {/* Tiny Mouth */}
          <polygon points="100,87 98,85 102,85" fill="#3d2a1c" />
          <path d="M 97,90 Q 100,92 103,90" fill="none" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />

          {/* Giant Cupcake */}
          <g transform="translate(0, 10)">
            {/* Wrapper */}
            <path d="M 80,120 L 120,120 L 114,143 L 86,143 Z" fill="#ffedd5" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
            {/* Frosting */}
            <path d="M 74,118 C 72,108 88,103 100,103 C 112,103 128,108 126,118 C 122,122 78,122 74,118 Z" fill="#fbcfe8" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
            {/* Cherry */}
            <circle cx="100" cy="96" r="6.5" fill="#ef4444" stroke="#3d2a1c" strokeWidth="2" />
            <path d="M 102,91 Q 108,83 106,80" fill="none" stroke="#3d2a1c" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Tiny paws */}
          <path d="M 78,121 C 82,121 85,123 84,127" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 122,121 C 118,121 115,123 116,127" fill="none" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
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
      primary: '#fee2e2', // premium pastel red
      secondary: '#fef2f2',
      accent: '#dc2626',
      bg: 'from-red-50/40 via-rose-100/20 to-red-100/30',
      border: 'border-red-300/40',
      glow: 'rgba(220, 38, 38, 0.3)'
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-3 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-angry" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-angry" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-angry)">
          <path 
            d="M 100,40 
               C 112,40 125,35 132,45 
               C 140,55 145,65 152,75 
               C 160,85 170,110 162,130 
               C 154,150 135,155 120,155 
               C 105,155 95,155 80,155 
               C 65,155 46,150 38,130 
               C 30,110 40,85 48,75 
               C 55,65 60,55 68,45 
               C 75,35 88,40 100,40 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-angry)">
          {/* Red Panda Tail */}
          <path d="M 125,120 C 145,115 160,137 145,145 C 135,149 125,135 125,120 Z" fill="#f87171" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 133,123 Q 138,130 133,137" fill="none" stroke="#b91c1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Main Body */}
          <path 
            d="M 100,75 
               C 124,75 132,90 132,110 
               C 132,127 120,137 100,137 
               C 80,137 68,127 68,110 
               C 68,90 76,75 100,75 Z" 
            fill="#f87171" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" />

          {/* White face markings */}
          <path d="M 72,105 C 76,95 90,93 92,103 C 94,109 76,115 72,105 Z" fill="#ffffff" opacity="0.85" />
          <path d="M 128,105 C 124,95 110,93 108,103 C 106,109 124,115 128,105 Z" fill="#ffffff" opacity="0.85" />

          {/* Eyes (Angry or Relieved) */}
          {isUnburdened ? (
            <g>
              <circle cx="86" cy="100" r="5.5" fill="#3d2a1c" />
              <circle cx="114" cy="100" r="5.5" fill="#3d2a1c" />
              <circle cx="84" cy="98" r="1.5" fill="#ffffff" />
              <circle cx="112" cy="98" r="1.5" fill="#ffffff" />
            </g>
          ) : (
            <g>
              <circle cx="86" cy="100" r="5.5" fill="#3d2a1c" />
              <circle cx="114" cy="100" r="5.5" fill="#3d2a1c" />
              <circle cx="87.5" cy="98.5" r="1.5" fill="#ffffff" />
              <circle cx="112.5" cy="98.5" r="1.5" fill="#ffffff" />
              <path d="M 76,90 L 92,96" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 124,90 L 108,96" stroke="#3d2a1c" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* Puffy red cheeks */}
          <ellipse cx="74" cy="110" rx="7" ry="4" fill="#ef4444" opacity="0.65" />
          <ellipse cx="126" cy="110" rx="7" ry="4" fill="#ef4444" opacity="0.65" />

          {/* Mouth */}
          {isUnburdened ? (
            <path d="M 96,109 Q 100,113 104,109" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <g>
              <path d="M 95,107 Q 100,115 105,107 Z" fill="#b91c1c" stroke="#3d2a1c" strokeWidth="2.5" strokeLinejoin="round" />
              <polygon points="97,107 99,110 100,107" fill="#ffffff" />
              <polygon points="103,107 101,110 100,107" fill="#ffffff" />
            </g>
          )}

          {/* Cardboard Box Helmet */}
          <g>
            <rect x="66" y="53" width="68" height="36" rx="3" fill="#d97706" stroke="#3d2a1c" strokeWidth="3" />
            <path d="M 90,71 L 93,65 L 97,68 L 100,65 L 103,68 L 107,65 L 110,71 Z" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
            <rect x="74" y="77" width="52" height="6" rx="2" fill="#78350f" stroke="#3d2a1c" strokeWidth="1.5" />
          </g>

          {/* Sword */}
          <g transform="translate(45, 110) rotate(-35)">
            <rect x="-4" y="-22" width="8" height="22" rx="2" fill="#e2e8f0" stroke="#3d2a1c" strokeWidth="2.5" />
            <rect x="-8" y="0" width="16" height="4" rx="1" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" />
          </g>
          <circle cx="58" cy="119" r="5" fill="#f87171" stroke="#3d2a1c" strokeWidth="2.5" />

          {/* Shield */}
          <g transform="translate(142, 120)">
            <circle cx="0" cy="0" r="14" fill="#d97706" stroke="#3d2a1c" strokeWidth="3" />
            <circle cx="0" cy="0" r="8" fill="#fbbf24" stroke="#3d2a1c" strokeWidth="2" />
          </g>
          <circle cx="126" cy="119" r="5" fill="#f87171" stroke="#3d2a1c" strokeWidth="2.5" />
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
      primary: '#bae6fd', // premium pastel blue-sky
      secondary: '#f0f9ff',
      accent: '#0284c7',
      bg: 'from-sky-50/40 via-blue-100/20 to-sky-100/30',
      border: 'border-sky-300/40',
      glow: 'rgba(2, 132, 199, 0.3)'
    },
    chatResponses: {
      greeting: "*looks up with huge, watery eyes, clutching his teddy bear tighter* H-hello... Are you... are you going to lock the door again? It's really cold and dark in here, and I've been waiting for a very long time. Can you... can you sit with me? Just for a little bit?",
      onThankYou: "*a tiny sparkle appears in his eyes* You... you want to stay? You're not ashamed of my tears? No one usually wants to look at me because I make them feel sad. Thank you for being nice to me.",
      onAskBurden: "I hold all the times we were left out on the playground, and the times we cried in the closet and no one came. It feels like a giant, heavy block of ice in my chest. I feel like I'm completely unlovable, and that's why I was locked away.",
      onAskGift: "If I didn't have to carry this ice? I love to look at clouds, and paint with bright fingers, and hug people tightly! I have so much love to give, and I can help you feel deep wonder and joy at the tiniest things, like a baby ladybug on a leaf.",
      onRelax: "*slowly lets go of the tight grip on the teddy bear* The ice is... starting to melt. It feels warm. I don't feel so alone anymore. Can we hold hands and walk out into the sunshine?"
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:-rotate-3 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-lonely" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-lonely" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-lonely)">
          <path 
            d="M 100,45 
               C 70,80 65,130 90,140 
               C 100,145 122,145 130,135 
               C 138,125 140,110 135,90 
               C 130,70 115,45 100,45 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="12" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-lonely)">
          {/* Ghost Body (Teardrop shape) */}
          <path 
            d="M 100,50 
               C 68,85 68,130 100,135 
               C 132,130 132,85 100,50 Z" 
            fill="#bae6fd" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" />

          {/* Striped PJ Pants (Oversized) */}
          <g>
            <path d="M 75,120 C 75,120 80,139 100,139 C 120,139 125,120 125,120 Z" fill="#fef08a" stroke="#3d2a1c" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 83,120 L 87,137" stroke="#38bdf8" strokeWidth="3" />
            <path d="M 92,120 L 95,139" stroke="#38bdf8" strokeWidth="3" />
            <path d="M 101,120 L 102,139" stroke="#38bdf8" strokeWidth="3" />
            <path d="M 110,120 L 108,138" stroke="#38bdf8" strokeWidth="3" />
          </g>

          {/* Big Watery Sad Eyes */}
          <g>
            <circle cx="86" cy="90" r="9.5" fill="#3d2a1c" />
            <circle cx="114" cy="90" r="9.5" fill="#3d2a1c" />
            <circle cx="83.5" cy="87.5" r="3.2" fill="#ffffff" />
            <circle cx="111.5" cy="87.5" r="3.2" fill="#ffffff" />
            {!isUnburdened && (
              <path d="M 116,95 C 116,95 118,103 115,106 Q 112,105 113,101 Z" fill="#38bdf8" stroke="#3d2a1c" strokeWidth="1.2" />
            )}
          </g>

          {/* Sad Blue-Blush */}
          <ellipse cx="76" cy="100" rx="6" ry="3" fill="#38bdf8" opacity="0.4" />
          <ellipse cx="124" cy="100" rx="6" ry="3" fill="#38bdf8" opacity="0.4" />

          {/* Mouth */}
          {isUnburdened ? (
            <path d="M 97,100 Q 100,103 103,100" fill="none" stroke="#3d2a1c" strokeWidth="2.2" strokeLinecap="round" />
          ) : (
            <path d="M 97,101 Q 100,97 103,101" fill="none" stroke="#3d2a1c" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Teddy Bear */}
          <g transform="translate(112, 100)">
            <circle cx="12" cy="12" r="11" fill="#b45309" stroke="#3d2a1c" strokeWidth="2.5" />
            <circle cx="3" cy="3" r="4" fill="#b45309" stroke="#3d2a1c" strokeWidth="2" />
            <circle cx="21" cy="3" r="4" fill="#b45309" stroke="#3d2a1c" strokeWidth="2" />
            <ellipse cx="12" cy="15" rx="4" ry="2.5" fill="#fef3c7" stroke="#3d2a1c" strokeWidth="1.5" />
            <polygon points="12,14.5 11,13 13,13" fill="#3d2a1c" />
            <circle cx="17" cy="11" r="1.2" fill="#3d2a1c" />
          </g>

          {/* Hands holding bear */}
          <path d="M 85,107 C 90,107 95,110 94,115" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />
          <path d="M 115,107 C 112,107 108,111 110,116" fill="none" stroke="#3d2a1c" strokeWidth="3" strokeLinecap="round" />
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
      primary: '#a7f3d0', // premium pastel green
      secondary: '#f0fdf4',
      accent: '#047857',
      bg: 'from-emerald-50/40 via-teal-100/20 to-emerald-100/30',
      border: 'border-emerald-300/40',
      glow: 'rgba(4, 120, 87, 0.3)'
    },
    chatResponses: {
      greeting: "*pulls head slightly back into the shell, then peeks out slowly, raising a tiny glowing lantern* Oh... h-hello. You... you aren't shouting. It's very quiet where you are. Is it... is it safe out there? I brought my little light so I wouldn't get lost in the dark.",
      onThankYou: "*smiles a tiny, shy turtle smile* Thank you. I like my lantern. It keeps me warm. It's nice that you like it too. Usually, everyone is running so fast, they don't see my light.",
      onAskBurden: "There was a very big storm. The lightning was so loud, and everyone was screaming. It felt like my shell was going to crack. I got so scared that I locked myself in here forever. I'm always waiting for the next big noise.",
      onAskGift: "My gift? I hold the quiet light. When the storm is over, I can show you the quiet, beautiful path through the woods. I can help you be very gentle, and help you see the soft beauty in quiet, hidden places.",
      onRelax: "*slowly extends his neck, peeking fully out of the shell* It feels very warm and safe here. The storm has stopped. I can set my lantern down and let you hold my paw. Let's look at the stars."
    },
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:-rotate-2 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="premium-shadow-scared" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1e1e1a" floodOpacity="0.25" />
          </filter>
          <filter id="heavy-grain-scared" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.06 0" result="coloredNoise" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="multiply" in="SourceGraphic" in2="coloredNoise" />
          </filter>
          <radialGradient id="premium-lantern-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="50%" stopColor="#fde047" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fffdec" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= LAYER 1: DIE-CUT STICKER BACKING ================= */}
        <g filter="url(#premium-shadow-scared)">
          <path 
            d="M 100,65 
               C 125,65 145,80 145,110 
               C 145,132 120,140 100,140 
               C 80,140 70,132 70,110 
               C 70,80 80,65 100,65 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="16" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          <circle cx="68" cy="85" r="22" fill="#ffffff" stroke="#ffffff" strokeWidth="16" />
          <rect x="30" y="110" width="28" height="34" rx="6" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        </g>

        {/* ================= LAYER 2: CHARACTER ARTWORK ================= */}
        <g filter="url(#heavy-grain-scared)">
          {/* Lantern Light Cone */}
          <polygon points="42,125 5,160 65,185" fill="url(#premium-lantern-glow)" opacity="0.5" />

          {/* Turtle Shell (Pastel Pink with Yellow Stars) */}
          <path 
            d="M 100,70 
               C 125,70 145,85 145,110 
               C 145,132 120,140 100,140 
               C 82,140 74,132 74,110 
               C 74,85 82,70 100,70 Z" 
            fill="#fbcfe8" 
            stroke="#3d2a1c" 
            strokeWidth="3.8" 
            strokeLinejoin="round" />
          
          {/* Star decorations */}
          <path d="M 105,85 L 107,88 L 110,88 L 108,90 L 109,93 L 105,91 L 101,93 L 102,90 L 100,88 L 103,88 Z" fill="#fef08a" />
          <path d="M 125,102 L 126,104 L 129,104 L 127,106 L 128,109 L 125,107 L 122,109 L 123,106 L 121,104 L 124,104 Z" fill="#fef08a" />

          {/* Head */}
          {isUnburdened ? (
            <path d="M 82,103 C 82,103 62,97 60,83 C 58,67 76,63 85,75 C 90,81 92,93 92,103 Z" 
                  fill="#a7f3d0" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          ) : (
            <path d="M 80,103 C 80,103 62,100 62,87 C 62,73 76,69 82,81 C 85,87 86,95 86,103 Z" 
                  fill="#a7f3d0" stroke="#3d2a1c" strokeWidth="3.5" strokeLinejoin="round" />
          )}

          {/* Eyes */}
          <circle cx="68" cy="83" r="7.5" fill="#3d2a1c" />
          <circle cx="66" cy="81" r="2.2" fill="#ffffff" />

          {/* Blush */}
          <ellipse cx="73" cy="90" rx="4" ry="2" fill="#fbcfe8" />

          {/* Mouth */}
          {isUnburdened ? (
            <path d="M 64,91 Q 67,94 70,91" fill="none" stroke="#3d2a1c" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <line x1="64" y1="91" x2="68" y2="91" stroke="#3d2a1c" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Lantern */}
          <g transform="translate(32, 117)">
            <path d="M 4,8 L 16,8 L 10,2 Z" fill="#94a3b8" stroke="#3d2a1c" strokeWidth="2" strokeLinejoin="round" />
            <rect x="5" y="8" width="10" height="14" rx="1" fill="#fde047" stroke="#3d2a1c" strokeWidth="2" />
            <line x1="8" y1="8" x2="8" y2="22" stroke="#3d2a1c" strokeWidth="1" />
            <line x1="12" y1="8" x2="12" y2="22" stroke="#3d2a1c" strokeWidth="1" />
          </g>
        </g>
      </svg>
    )
  }
];
