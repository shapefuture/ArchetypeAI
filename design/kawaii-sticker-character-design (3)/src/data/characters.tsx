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
    description: 'Sol is a peaceful, glowing celestial star-bunny mascot. With a giant, huggable round head, cute floppy ears, and a soft yellow star glowing on their forehead, Sol sits in a relaxed meditative pose. They radiate warmth and curiosity, acting as the compassionate leader of your internal world.',
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
          <filter id="sticker-shadow-sol" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1a1c1e" floodOpacity="0.15" />
          </filter>
          <radialGradient id="grad-sol-face" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#fffdec" />
            <stop offset="100%" stopColor="#fef3c7" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Die-Cut Backing */}
        <g filter="url(#sticker-shadow-sol)">
          <path 
            d="M 100,15 
               C 120,15 130,22 142,32 
               C 155,42 162,55 168,72 
               C 175,90 178,110 172,128 
               C 165,145 152,158 138,168 
               C 120,178 100,182 80,178 
               C 62,175 48,165 38,152 
               C 28,138 25,120 28,100 
               C 32,80 38,62 48,48 
               C 62,32 80,15 100,15 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Character Artwork */}
        {/* Floppy Ears */}
        <path d="M 62,65 C 40,20 82,8 86,52 C 88,68 80,82 76,86" fill="#fffdec" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 62,60 C 46,28 76,18 78,48 C 80,58 76,68 72,72" fill="#fbcfe8" />

        <path d="M 138,65 C 160,20 118,8 114,52 C 112,68 120,82 124,86" fill="#fffdec" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 138,60 C 154,28 124,18 122,48 C 120,58 124,68 128,72" fill="#fbcfe8" />

        {/* Giant Rounded Head (Indie Mascot Style - 60% of character) */}
        <circle cx="100" cy="104" r="54" fill="url(#grad-sol-face)" stroke="#1e1e1a" strokeWidth="5" />

        {/* Small Meditating Body & Limbs */}
        <path d="M 82,148 C 82,148 70,165 100,165 C 130,165 118,148 118,148 Z" fill="#fffdec" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        {/* Left hand */}
        <circle cx="72" cy="144" r="7.5" fill="#fffdec" stroke="#1e1e1a" strokeWidth="4" />
        <circle cx="72" cy="144" r="3.5" fill="#fbbf24" />
        {/* Right hand */}
        <circle cx="128" cy="144" r="7.5" fill="#fffdec" stroke="#1e1e1a" strokeWidth="4" />
        <circle cx="128" cy="144" r="3.5" fill="#fbbf24" />

        {/* Large, Whimsical Expressive Eyes */}
        <g>
          {/* Left Eye */}
          <circle cx="78" cy="106" r="9.5" fill="#1e1e1a" />
          <circle cx="76" cy="103" r="3.2" fill="#ffffff" />
          {/* Right Eye */}
          <circle cx="122" cy="106" r="9.5" fill="#1e1e1a" />
          <circle cx="120" cy="103" r="3.2" fill="#ffffff" />
        </g>

        {/* Glowing Forehead Star */}
        <path d="M 100,74 L 103,80 L 110,80 L 105,84 L 107,91 L 100,87 L 93,91 L 95,84 L 90,80 L 97,80 Z" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Soft Pink Cheek Blush */}
        <ellipse cx="68" cy="118" rx="8.5" ry="4.5" fill="#fbcfe8" opacity="0.9" />
        <ellipse cx="132" cy="118" rx="8.5" ry="4.5" fill="#fbcfe8" opacity="0.9" />

        {/* Tiny, Whimsical Smile */}
        <path d="M 96,114 Q 100,118 104,114" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />

        {/* Floating Indie Doodle Elements (Stars & Clouds) */}
        <g fill="#fbbf24" stroke="#1e1e1a" strokeWidth="1.8">
          <path d="M 38,55 L 40,58 L 43,58 L 41,60 L 42,63 L 38,61 L 34,63 L 35,60 L 33,58 L 36,58 Z" />
          <path d="M 162,55 L 164,58 L 167,58 L 165,60 L 166,63 L 162,61 L 158,63 L 159,60 L 157,58 L 160,58 Z" />
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
        className={`w-full h-full select-none ${className} ${interactive ? 'hover:scale-105 hover:rotate-3 transition-all duration-500 ease-out cursor-grab active:cursor-grabbing' : ''}`}
      >
        <defs>
          <filter id="sticker-shadow-critic" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grad-critic-face" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#60a5fa" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-critic)">
          <path 
            d="M 100,35 
               C 120,35 125,28 135,32 
               C 145,35 152,48 158,62 
               C 165,78 158,98 162,112 
               C 166,126 158,148 145,158 
               C 130,168 112,162 100,162 
               C 88,162 70,168 55,158 
               C 42,148 34,126 38,112 
               C 42,98 35,78 42,62 
               C 48,48 55,35 65,32 
               C 75,28 80,35 100,35 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Round Hamster Ears */}
        <circle cx="60" cy="52" r="16" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="4.5" />
        <circle cx="60" cy="52" r="9" fill="#fbcfe8" />
        
        <circle cx="140" cy="52" r="16" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="4.5" />
        <circle cx="140" cy="52" r="9" fill="#fbcfe8" />

        {/* Main Hamster Head-Body (Bean Shape) */}
        <rect x="52" y="62" width="96" height="90" rx="48" fill="url(#grad-critic-face)" stroke="#1e1e1a" strokeWidth="5" />

        {/* Giant Yellow Circular Glasses */}
        {/* Left Rim */}
        <circle cx="76" cy="94" r="22" fill="none" stroke="#fbbf24" strokeWidth="5" />
        <circle cx="76" cy="94" r="22" fill="#e0f2fe" opacity="0.25" />
        {/* Right Rim */}
        <circle cx="124" cy="94" r="22" fill="none" stroke="#fbbf24" strokeWidth="5" />
        <circle cx="124" cy="94" r="22" fill="#e0f2fe" opacity="0.25" />
        {/* Glasses Bridge */}
        <line x1="98" y1="94" x2="102" y2="94" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />

        {/* Whimsical Dot Eyes behind Glasses */}
        <circle cx="76" cy="94" r="6.5" fill="#1e1e1a" />
        <circle cx="124" cy="94" r="6.5" fill="#1e1e1a" />
        <circle cx="74" cy="92" r="2" fill="#ffffff" />
        <circle cx="122" cy="92" r="2" fill="#ffffff" />

        {/* Furrowed Serious Brows */}
        {!isUnburdened ? (
          <g stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" fill="none">
            <path d="M 65,68 Q 76,74 84,68" />
            <path d="M 135,68 Q 124,74 116,68" />
          </g>
        ) : (
          <g stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 65,70 Q 76,66 84,70" />
            <path d="M 135,70 Q 124,66 116,70" />
          </g>
        )}

        {/* Cheeks */}
        <ellipse cx="60" cy="108" rx="7.5" ry="4" fill="#fbcfe8" opacity="0.9" />
        <ellipse cx="140" cy="108" rx="7.5" ry="4" fill="#fbcfe8" opacity="0.9" />

        {/* Nose & Frown/Smile */}
        <polygon points="100,101 97,98 103,98" fill="#1e1e1a" />
        {!isUnburdened ? (
          <path d="M 95,106 Q 100,103 105,106" fill="none" stroke="#1e1e1a" strokeWidth="3.8" strokeLinecap="round" />
        ) : (
          <path d="M 95,104 Q 100,108 105,104" fill="none" stroke="#1e1e1a" strokeWidth="3.8" strokeLinecap="round" />
        )}

        {/* Oversized Clipboard */}
        <g transform="translate(10, 2) rotate(-6, 120, 120)">
          <rect x="112" y="94" width="42" height="54" rx="4" fill="#d97706" stroke="#1e1e1a" strokeWidth="4" />
          <rect x="116" y="100" width="34" height="44" fill="#fffdec" stroke="#1e1e1a" strokeWidth="2" />
          <rect x="126" y="90" width="14" height="7" rx="1.5" fill="#94a3b8" stroke="#1e1e1a" strokeWidth="2" />
          {isUnburdened ? (
            <path d="M 122,110 L 125,113 L 132,105" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : (
            <g stroke="#1e1e1a" strokeWidth="2" strokeLinecap="round" fill="none">
              <line x1="122" y1="108" x2="140" y2="108" />
              <line x1="122" y1="116" x2="136" y2="116" />
            </g>
          )}
        </g>

        {/* Small Hands holding clipboard */}
        <circle cx="106" cy="122" r="7.5" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="4" />
        <circle cx="78" cy="122" r="7.5" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="4" />

        {/* Tiny feet */}
        <ellipse cx="82" cy="154" rx="8" ry="4.5" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="4" />
        <ellipse cx="118" cy="154" rx="8" ry="4.5" fill="#60a5fa" stroke="#1e1e1a" strokeWidth="4" />
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
          <filter id="sticker-shadow-pleaser" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grad-pleaser-face" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#f472b6" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-pleaser)">
          <path 
            d="M 100,45 
               C 115,45 120,38 128,25 
               C 135,12 152,12 155,28 
               C 158,45 138,75 142,90 
               C 146,105 148,130 135,142 
               C 120,154 100,148 100,148 
               C 100,148 80,154 65,142 
               C 52,130 54,105 58,90 
               C 62,75 42,45 45,28 
               C 48,12 65,12 72,25 
               C 80,38 85,45 100,45 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Long Floppy Ears */}
        <path d="M 72,75 L 52,32 C 48,18 62,15 72,28 L 85,75 Z" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M 67,70 L 57,38 C 54,28 64,25 69,34 L 78,70 Z" fill="#fff1f2" />
        
        <path d="M 128,75 L 148,32 C 152,18 138,15 128,28 L 115,75 Z" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M 133,70 L 143,38 C 146,28 136,25 131,34 L 122,70 Z" fill="#fff1f2" />

        {/* Giant Bunny Head-Body (Rounded Bean) */}
        <path 
          d="M 100,70 
             C 126,70 136,88 136,108 
             C 136,126 122,142 100,142 
             C 78,142 64,126 64,108 
             C 64,88 74,70 100,70 Z" 
          fill="url(#grad-pleaser-face)" 
          stroke="#1e1e1a" 
          strokeWidth="5" 
          strokeLinejoin="round" 
        />

        {/* White Apron */}
        <path d="M 82,100 L 118,100 L 122,130 L 78,130 Z" fill="#fffdec" stroke="#1e1e1a" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M 100,108 C 100,108 97,104 95,106 C 93,108 95,112 100,116 C 105,112 107,108 105,106 C 103,104 100,108 100,108 Z" fill="#db2777" />

        {/* Whimsical Pleading Sparkly Eyes */}
        <g>
          <circle cx="80" cy="94" r="9.5" fill="#1e1e1a" />
          <circle cx="120" cy="94" r="9.5" fill="#1e1e1a" />
          <circle cx="78" cy="91" r="3.2" fill="#ffffff" />
          <circle cx="82.5" cy="96.5" r="1.5" fill="#ffffff" />
          <circle cx="118" cy="91" r="3.2" fill="#ffffff" />
          <circle cx="122.5" cy="96.5" r="1.5" fill="#ffffff" />
        </g>

        {/* Cheeks */}
        <ellipse cx="70" cy="103" rx="7.5" ry="4" fill="#db2777" opacity="0.45" />
        <ellipse cx="130" cy="103" rx="7.5" ry="4" fill="#db2777" opacity="0.45" />

        {/* Nose & Smile */}
        <polygon points="100,99 98,97 102,97" fill="#1e1e1a" />
        <path d="M 97,102 Q 100,105 103,102" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />

        {/* Cookie Plate */}
        <g transform="translate(0, 10)">
          <ellipse cx="100" cy="120" rx="30" ry="12" fill="#e2e8f0" stroke="#1e1e1a" strokeWidth="3.5" />
          <ellipse cx="100" cy="118" rx="30" ry="12" fill="#ffffff" stroke="#1e1e1a" strokeWidth="3.5" />
          <path d="M 86,115 C 86,115 83,111 81,113 C 79,115 81,119 86,122 C 91,119 93,115 91,113 C 89,111 86,115 86,115 Z" fill="#d97706" />
          <path d="M 114,115 C 114,115 111,111 109,113 C 107,115 109,119 114,122 C 119,119 121,115 119,113 C 117,111 114,115 114,115 Z" fill="#d97706" />
        </g>

        {/* Hands */}
        <circle cx="68" cy="124" r="6.5" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="3.5" />
        <circle cx="132" cy="124" r="6.5" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="3.5" />

        {/* Tiny feet */}
        <ellipse cx="84" cy="143" rx="8" ry="4.5" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="4" />
        <ellipse cx="116" cy="143" rx="8" ry="4.5" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="4" />
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
          <filter id="sticker-shadow-planner" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grad-planner-face" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ddd6fe" />
            <stop offset="100%" stopColor="#b794f4" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-planner)">
          <path 
            d="M 100,35 
               C 115,35 122,25 132,32 
               C 145,40 152,55 155,72 
               C 158,90 150,110 145,122 
               C 140,132 152,145 142,158 
               C 132,170 108,168 100,168 
               C 92,168 68,170 58,158 
               C 48,145 60,132 55,122 
               C 50,110 42,90 45,72 
               C 48,55 55,40 68,32 
               C 80,25 85,35 100,35 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Stack of Books */}
        <rect x="58" y="142" width="84" height="12" rx="2" fill="#99f6e4" stroke="#1e1e1a" strokeWidth="3.5" />
        <rect x="64" y="132" width="72" height="11" rx="2" fill="#ffedd5" stroke="#1e1e1a" strokeWidth="3.5" />
        <rect x="70" y="122" width="60" height="11" rx="2" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="3.5" />

        {/* Giant Round Owl Body */}
        <circle cx="100" cy="94" r="42" fill="url(#grad-planner-face)" stroke="#1e1e1a" strokeWidth="5" />
        
        {/* Owl Chest Patch */}
        <ellipse cx="100" cy="114" rx="20" ry="15" fill="#f5f3ff" />

        {/* Huge Whimsical Goggle Eyes */}
        <circle cx="82" cy="88" r="15" fill="#ffffff" stroke="#1e1e1a" strokeWidth="4" />
        <circle cx="118" cy="88" r="15" fill="#ffffff" stroke="#1e1e1a" strokeWidth="4" />

        {/* Pupils */}
        {isUnburdened ? (
          <g>
            <circle cx="82" cy="88" r="6.5" fill="#1e1e1a" />
            <circle cx="118" cy="88" r="6.5" fill="#1e1e1a" />
            <circle cx="80" cy="86" r="2" fill="#ffffff" />
            <circle cx="116" cy="86" r="2" fill="#ffffff" />
          </g>
        ) : (
          <g>
            <circle cx="84" cy="86" r="6.5" fill="#1e1e1a" />
            <circle cx="116" cy="86" r="6.5" fill="#1e1e1a" />
            <circle cx="82" cy="84" r="2" fill="#ffffff" />
            <circle cx="114" cy="84" r="2" fill="#ffffff" />
          </g>
        )}

        {/* Beak */}
        <polygon points="100,94 96,89 104,89" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="2" strokeLinejoin="round" />

        {/* Blush */}
        <ellipse cx="70" cy="100" rx="5" ry="2.5" fill="#fbcfe8" />
        <ellipse cx="130" cy="100" rx="5" ry="2.5" fill="#fbcfe8" />

        {/* Nightcap */}
        <path d="M 80,64 C 75,50 60,42 48,48 C 40,54 42,66 50,70 Q 65,74 75,67" fill="#a78bfa" stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="45" cy="47" r="6" fill="#fffdec" stroke="#1e1e1a" strokeWidth="2.5" />

        {/* Wings */}
        <path d="M 66,90 Q 56,100 66,110" fill="none" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
        <path d="M 134,90 Q 144,100 134,110" fill="none" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />

        {/* Little Feet */}
        <path d="M 90,122 C 90,126 94,126 94,122" fill="none" stroke="#1e1e1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M 110,122 C 110,126 106,126 106,122" fill="none" stroke="#1e1e1a" strokeWidth="3" strokeLinecap="round" />

        {/* Floating Lightbulb or Question mark */}
        {isUnburdened ? (
          <g transform="translate(142, 35)">
            <circle cx="0" cy="0" r="8" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="2.5" />
            <path d="M -3,5 L 3,5 M -2,8 L 2,8" stroke="#1e1e1a" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 0,-8 L 0,-11 M 8,0 L 11,0 M -8,0 L -11,0" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          <g transform="translate(142, 45)">
            <path d="M -8,-8 C -8,-15 4,-15 4,-8 C 4,-4 -2,-2 -2,3" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            <circle cx="-2" cy="10" r="2.5" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="1.5" />
          </g>
        )}
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
          <filter id="sticker-shadow-distractor" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grad-distractor-face" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fdba74" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-distractor)">
          <path 
            d="M 100,45 
               C 115,45 122,35 132,40 
               C 142,45 148,55 152,65 
               C 160,80 150,100 152,115 
               C 156,130 145,145 130,148 
               C 115,152 100,145 100,145 
               C 100,145 85,152 70,148 
               C 55,145 44,130 48,115 
               C 52,100 42,80 50,65 
               C 55,55 62,45 72,40 
               C 82,35 88,45 100,45 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Cat Ears */}
        <path d="M 65,65 L 50,32 L 78,50 Z" fill="#fdba74" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M 62,60 L 57,40 L 71,51 Z" fill="#fbcfe8" />
        
        <path d="M 135,65 L 150,32 L 122,50 Z" fill="#fdba74" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M 138,60 L 143,40 L 129,51 Z" fill="#fbcfe8" />

        {/* Giant Head-Body (Bean) */}
        <path 
          d="M 100,65 
             C 124,65 134,80 134,100 
             C 134,120 122,132 100,132 
             C 78,132 66,120 66,100 
             C 66,85 76,65 100,65 Z" 
          fill="url(#grad-distractor-face)" 
          stroke="#1e1e1a" 
          strokeWidth="5" 
          strokeLinejoin="round" 
        />

        {/* Eyes (Winking & Big Sparkly) */}
        <g>
          <path d="M 76,92 Q 84,98 86,90" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="116" cy="90" r="9" fill="#1e1e1a" />
          <circle cx="114" cy="88" r="3" fill="#ffffff" />
        </g>

        {/* Cat Whiskers */}
        <path d="M 60,100 L 50,99 M 60,104 L 48,105" stroke="#1e1e1a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 140,100 L 150,99 M 140,104 L 152,105" stroke="#1e1e1a" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nose & Cute Cat Mouth */}
        <polygon points="100,95 98,93 102,93" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="1" />
        <path d="M 94,99 Q 97,102 100,99 Q 103,102 106,99" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />

        {!isUnburdened && (
          <g transform="translate(104, 100) rotate(15)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#1e1e1a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="6" fill="#db2777" stroke="#1e1e1a" strokeWidth="2" />
          </g>
        )}

        {/* Blush */}
        <ellipse cx="72" cy="100" rx="6.5" ry="3.5" fill="#db2777" opacity="0.5" />
        <ellipse cx="128" cy="100" rx="6.5" ry="3.5" fill="#db2777" opacity="0.5" />

        {/* Mint Headphones */}
        <path d="M 68,80 A 36,36 0 0,1 132,80" fill="none" stroke="#1e1e1a" strokeWidth="7" />
        <path d="M 68,80 A 36,36 0 0,1 132,80" fill="none" stroke="#99f6e4" strokeWidth="4" />
        <rect x="58" y="80" width="10" height="20" rx="4" fill="#2dd4bf" stroke="#1e1e1a" strokeWidth="3.5" />
        <rect x="132" y="80" width="10" height="20" rx="4" fill="#2dd4bf" stroke="#1e1e1a" strokeWidth="3.5" />

        {/* Game Controller */}
        <g transform="translate(75, 115)">
          <rect x="0" y="0" width="50" height="24" rx="8" fill="#f472b6" stroke="#1e1e1a" strokeWidth="3.5" />
          <circle cx="38" cy="10" r="2.5" fill="#fbbf24" />
          <circle cx="43" cy="14" r="2.5" fill="#3b82f6" />
        </g>

        {/* Hands */}
        <circle cx="72" cy="120" r="6" fill="#fed7aa" stroke="#1e1e1a" strokeWidth="3" />
        <circle cx="128" cy="120" r="6" fill="#fed7aa" stroke="#1e1e1a" strokeWidth="3" />
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
          <filter id="sticker-shadow-binger" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-binger)">
          <path 
            d="M 100,40 
               C 115,40 125,35 135,42 
               C 145,50 152,65 155,80 
               C 158,100 152,120 148,135 
               C 142,148 120,155 100,155 
               C 80,155 58,148 52,135 
               C 48,120 42,100 45,80 
               C 48,65 55,50 68,42 
               C 80,35 88,40 100,40 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Fluffy Blanket Burrito (Mint/Teal) */}
        <circle cx="100" cy="98" r="50" fill="#99f6e4" stroke="#1e1e1a" strokeWidth="5" />
        
        {/* Blanket Opening revealing Hamster Face */}
        <path d="M 70,80 C 70,55 130,55 130,80 C 130,100 70,100 70,80 Z" fill="#ffffff" stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />

        {/* Hamster Ears */}
        <circle cx="78" cy="58" r="8" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="3" />
        <circle cx="122" cy="58" r="8" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="3" />

        {/* Big Sparkly Eyes */}
        <circle cx="86" cy="74" r="6.5" fill="#1e1e1a" />
        <circle cx="114" cy="74" r="6.5" fill="#1e1e1a" />
        <circle cx="84" cy="72" r="2.2" fill="#ffffff" />
        <circle cx="112" cy="72" r="2.2" fill="#ffffff" />

        {/* Chubby cheeks */}
        <ellipse cx="78" cy="83" rx="7" ry="4" fill="#db2777" opacity="0.45" />
        <ellipse cx="122" cy="83" rx="7" ry="4" fill="#db2777" opacity="0.45" />

        {/* Tiny nose & happy mouth */}
        <polygon points="100,78 98,76 102,76" fill="#1e1e1a" />
        <path d="M 97,81 Q 100,83 103,81" fill="none" stroke="#1e1e1a" strokeWidth="2.5" strokeLinecap="round" />

        {/* Giant Cupcake */}
        <g transform="translate(0, 10)">
          <path d="M 80,112 L 120,112 L 114,135 L 86,135 Z" fill="#ffedd5" stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 74,110 C 72,100 88,95 100,95 C 112,95 128,100 126,110 C 122,114 78,114 74,110 Z" fill="#fbcfe8" stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="100" cy="88" r="6.5" fill="#ef4444" stroke="#1e1e1a" strokeWidth="2.5" />
        </g>

        {/* Paws */}
        <path d="M 78,113 C 82,113 85,115 84,119" fill="none" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
        <path d="M 122,113 C 118,113 115,115 116,119" fill="none" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
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
          <filter id="sticker-shadow-angry" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-angry)">
          <path 
            d="M 100,35 
               C 115,35 125,30 135,42 
               C 145,50 152,65 158,75 
               C 165,85 172,110 162,130 
               C 154,148 135,152 120,152 
               C 105,152 95,152 80,152 
               C 65,152 46,148 38,130 
               C 30,110 40,85 48,75 
               C 55,65 60,50 68,42 
               C 75,30 88,35 100,35 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Red Panda Tail */}
        <path d="M 125,115 C 145,110 160,132 145,140 C 135,144 125,130 125,115 Z" fill="#f87171" stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 133,118 Q 138,125 133,132" fill="none" stroke="#b91c1c" strokeWidth="3.5" strokeLinecap="round" />

        {/* Main Head-Body */}
        <path 
          d="M 100,70 
             C 124,70 132,85 132,105 
             C 132,122 120,132 100,132 
             C 80,132 68,122 68,105 
             C 68,90 76,70 100,70 Z" 
          fill="#f87171" 
          stroke="#1e1e1a" 
          strokeWidth="5" 
          strokeLinejoin="round" />

        {/* White face markings */}
        <path d="M 72,100 C 76,90 90,88 92,98 C 94,104 76,110 72,100 Z" fill="#ffffff" opacity="0.85" />
        <path d="M 128,100 C 124,90 110,88 108,98 C 106,104 124,110 128,100 Z" fill="#ffffff" opacity="0.85" />

        {/* Eyes */}
        {isUnburdened ? (
          <g>
            <circle cx="86" cy="95" r="5.5" fill="#1e1e1a" />
            <circle cx="114" cy="95" r="5.5" fill="#1e1e1a" />
            <circle cx="84" cy="93" r="1.5" fill="#ffffff" />
            <circle cx="112" cy="93" r="1.5" fill="#ffffff" />
          </g>
        ) : (
          <g>
            <circle cx="86" cy="95" r="5.5" fill="#1e1e1a" />
            <circle cx="114" cy="95" r="5.5" fill="#1e1e1a" />
            <circle cx="87.5" cy="93.5" r="1.5" fill="#ffffff" />
            <circle cx="112.5" cy="93.5" r="1.5" fill="#ffffff" />
            <path d="M 76,85 L 92,91" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
            <path d="M 124,85 L 108,91" stroke="#1e1e1a" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {/* Cheeks */}
        <ellipse cx="74" cy="105" rx="7" ry="4" fill="#ef4444" opacity="0.65" />
        <ellipse cx="126" cy="105" rx="7" ry="4" fill="#ef4444" opacity="0.65" />

        {/* Mouth */}
        {isUnburdened ? (
          <path d="M 96,104 Q 100,108 104,104" fill="none" stroke="#1e1e1a" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <g>
            <path d="M 95,102 Q 100,110 105,102 Z" fill="#b91c1c" stroke="#1e1e1a" strokeWidth="3.5" strokeLinejoin="round" />
            <polygon points="97,102 99,105 100,102" fill="#ffffff" />
            <polygon points="103,102 101,105 100,102" fill="#ffffff" />
          </g>
        )}

        {/* Cardboard Box Helmet */}
        <g>
          <rect x="66" y="48" width="68" height="36" rx="3" fill="#d97706" stroke="#1e1e1a" strokeWidth="4" />
          <path d="M 90,66 L 93,60 L 97,63 L 100,60 L 103,63 L 107,60 L 110,66 Z" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="74" y="72" width="52" height="6" rx="2" fill="#78350f" stroke="#1e1e1a" strokeWidth="2" />
        </g>

        {/* Sword */}
        <g transform="translate(45, 105) rotate(-35)">
          <rect x="-4" y="-22" width="8" height="22" rx="2" fill="#e2e8f0" stroke="#1e1e1a" strokeWidth="3.5" />
          <rect x="-8" y="0" width="16" height="4" rx="1" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="2.5" />
        </g>
        <circle cx="58" cy="114" r="5" fill="#f87171" stroke="#1e1e1a" strokeWidth="3" />

        {/* Shield */}
        <g transform="translate(142, 115)">
          <circle cx="0" cy="0" r="14" fill="#d97706" stroke="#1e1e1a" strokeWidth="4" />
          <circle cx="0" cy="0" r="8" fill="#fbbf24" stroke="#1e1e1a" strokeWidth="2.5" />
        </g>
        <circle cx="126" cy="114" r="5" fill="#f87171" stroke="#1e1e1a" strokeWidth="3" />
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
          <filter id="sticker-shadow-lonely" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-lonely)">
          <path 
            d="M 100,40 
               C 70,75 65,125 90,135 
               C 100,140 122,140 130,130 
               C 138,120 140,105 135,85 
               C 130,65 115,40 100,40 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="14" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        </g>

        {/* Ghost Teardrop Body */}
        <path 
          d="M 100,45 
             C 68,80 68,125 100,130 
             C 132,125 132,80 100,45 Z" 
          fill="#bae6fd" 
          stroke="#1e1e1a" 
          strokeWidth="5" 
          strokeLinejoin="round" />

        {/* Striped PJ Pants */}
        <g>
          <path d="M 75,115 C 75,115 80,134 100,134 C 120,134 125,115 125,115 Z" fill="#fef08a" stroke="#1e1e1a" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 83,115 L 87,132" stroke="#38bdf8" strokeWidth="3.5" />
          <path d="M 92,115 L 95,134" stroke="#38bdf8" strokeWidth="3.5" />
          <path d="M 101,115 L 102,134" stroke="#38bdf8" strokeWidth="3.5" />
          <path d="M 110,115 L 108,133" stroke="#38bdf8" strokeWidth="3.5" />
        </g>

        {/* Big Watery Sad Eyes */}
        <g>
          <circle cx="86" cy="85" r="9.5" fill="#1e1e1a" />
          <circle cx="114" cy="85" r="9.5" fill="#1e1e1a" />
          <circle cx="83.5" cy="82.5" r="3.2" fill="#ffffff" />
          <circle cx="111.5" cy="82.5" r="3.2" fill="#ffffff" />
          {!isUnburdened && (
            <path d="M 116,90 C 116,90 118,98 115,101 Q 112,100 113,96 Z" fill="#38bdf8" stroke="#1e1e1a" strokeWidth="1.2" />
          )}
        </g>

        {/* Sad Blue-Blush */}
        <ellipse cx="76" cy="95" rx="6.5" ry="3" fill="#38bdf8" opacity="0.45" />
        <ellipse cx="124" cy="95" rx="6.5" ry="3" fill="#38bdf8" opacity="0.45" />

        {/* Mouth */}
        {isUnburdened ? (
          <path d="M 97,95 Q 100,98 103,95" fill="none" stroke="#1e1e1a" strokeWidth="3.2" strokeLinecap="round" />
        ) : (
          <path d="M 97,96 Q 100,92 103,96" fill="none" stroke="#1e1e1a" strokeWidth="3.5" strokeLinecap="round" />
        )}

        {/* Teddy Bear */}
        <g transform="translate(112, 95)">
          <circle cx="12" cy="12" r="11" fill="#b45309" stroke="#1e1e1a" strokeWidth="3" />
          <circle cx="3" cy="3" r="4" fill="#b45309" stroke="#1e1e1a" strokeWidth="2.5" />
          <circle cx="21" cy="3" r="4" fill="#b45309" stroke="#1e1e1a" strokeWidth="2.5" />
          <ellipse cx="12" cy="15" rx="4" ry="2.5" fill="#fef3c7" stroke="#1e1e1a" strokeWidth="1.5" />
          <polygon points="12,14.5 11,13 13,13" fill="#1e1e1a" />
          <circle cx="17" cy="11" r="1.5" fill="#1e1e1a" />
        </g>

        {/* Hands holding bear */}
        <path d="M 85,102 C 90,102 95,105 94,110" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 115,102 C 112,102 108,106 110,111" fill="none" stroke="#1e1e1a" strokeWidth="4.5" strokeLinecap="round" />
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
          <filter id="sticker-shadow-scared" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grad-lantern-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="50%" stopColor="#fde047" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fffdec" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Backing */}
        <g filter="url(#sticker-shadow-scared)">
          <path 
            d="M 100,55 
               C 125,55 145,70 145,100 
               C 145,122 120,130 100,130 
               C 80,130 70,122 70,100 
               C 70,80 80,55 100,55 Z" 
            fill="#ffffff" 
            stroke="#ffffff" 
            strokeWidth="16" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          <circle cx="68" cy="75" r="22" fill="#ffffff" stroke="#ffffff" strokeWidth="16" />
          <rect x="30" y="100" width="28" height="34" rx="6" fill="#ffffff" stroke="#ffffff" strokeWidth="16" strokeLinejoin="round" />
        </g>

        {/* Lantern Light Cone */}
        <polygon points="42,115 5,150 65,175" fill="url(#grad-lantern-glow)" opacity="0.5" />

        {/* Turtle Shell (Pink) */}
        <path 
          d="M 100,60 
             C 125,60 145,75 145,100 
             C 145,122 120,130 100,130 
             C 82,130 74,122 74,100 
             C 74,75 82,60 100,60 Z" 
          fill="#fbcfe8" 
          stroke="#1e1e1a" 
          strokeWidth="5" 
          strokeLinejoin="round" />
        
        {/* Star decorations */}
        <path d="M 105,75 L 107,78 L 110,78 L 108,80 L 109,83 L 105,81 L 101,83 L 102,80 L 100,78 L 103,78 Z" fill="#fef08a" />
        <path d="M 125,92 L 126,94 L 129,94 L 127,96 L 128,99 L 125,97 L 122,99 L 123,96 L 121,94 L 124,94 Z" fill="#fef08a" />

        {/* Head */}
        {isUnburdened ? (
          <path d="M 82,93 C 82,93 62,87 60,73 C 58,57 76,53 85,65 C 90,71 92,83 92,93 Z" 
                fill="#a7f3d0" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        ) : (
          <path d="M 80,93 C 80,93 62,90 62,77 C 62,63 76,59 82,71 C 85,77 86,85 86,93 Z" 
                fill="#a7f3d0" stroke="#1e1e1a" strokeWidth="4.5" strokeLinejoin="round" />
        )}

        {/* Big Watery Eyes */}
        <circle cx="68" cy="73" r="7.5" fill="#1e1e1a" />
        <circle cx="66" cy="71" r="2.2" fill="#ffffff" />

        {/* Blush */}
        <ellipse cx="73" cy="80" rx="4" ry="2" fill="#fbcfe8" />

        {/* Mouth */}
        {isUnburdened ? (
          <path d="M 64,81 Q 67,84 70,81" fill="none" stroke="#1e1e1a" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <line x1="64" y1="81" x2="68" y2="81" stroke="#1e1e1a" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Lantern */}
        <g transform="translate(32, 107)">
          <path d="M 4,8 L 16,8 L 10,2 Z" fill="#94a3b8" stroke="#1e1e1a" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="5" y="8" width="10" height="14" rx="1" fill="#fde047" stroke="#1e1e1a" strokeWidth="3.5" />
          <line x1="8" y1="8" x2="8" y2="22" stroke="#1e1e1a" strokeWidth="1.5" />
          <line x1="12" y1="8" x2="12" y2="22" stroke="#1e1e1a" strokeWidth="1.5" />
        </g>
      </svg>
    )
  }
];
