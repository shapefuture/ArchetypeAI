import { useState, useEffect, useRef, useMemo } from 'react';
import { characters as initialCharacters, IFSCharacter } from './data/characters';
import { CustomSticker, CustomSpecies, CustomExpression, CustomAccessory } from './components/CustomSticker';
import { 
  Heart, Sparkles, BookOpen, Compass, Trash2, Plus, RotateCcw, 
  MessageCircle, Check, HelpCircle, Activity, Flame, 
  ArrowRight, Info, Bookmark, Star
} from 'lucide-react';

export default function App() {
  // --- STATE ---
  const [customCharacters, setCustomCharacters] = useState<IFSCharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('sol-self');
  const [activeTab, setActiveTab] = useState<'album' | 'garden' | 'ceremony' | 'quiz' | 'customizer'>('album');
  const [unburdenedParts, setUnburdenedParts] = useState<string[]>([]);
  const [chatHistories, setChatHistories] = useState<Record<string, { sender: 'user' | 'part'; text: string }[]>>({});
  const [chatInput, setChatInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [breathingSeconds, setBreathingSeconds] = useState<number>(0);
  const [selfEnergyCount, setSelfEnergyCount] = useState<number>(0);

  // Combine initial and custom characters
  const allCharacters = useMemo(() => {
    return [...customCharacters, ...initialCharacters];
  }, [customCharacters]);

  const selectedCharacter = useMemo(() => {
    return allCharacters.find(c => c.id === selectedCharacterId) || allCharacters[0];
  }, [allCharacters, selectedCharacterId]);

  // --- 1. INNER WORLD GARDEN STATE & LOGIC ---
  interface PlacedSticker {
    id: string;
    characterId: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    scale: number; // 0.6 to 1.5
    isCustom: boolean;
  }
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([
    { id: 'placed-sol', characterId: 'sol-self', x: 50, y: 50, scale: 1.1, isCustom: false }
  ]);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [gardenMessage, setGardenMessage] = useState<string>('Drag your parts onto the canvas! Place them near Sol (the Self) in the center to soothe them.');
  const gardenRef = useRef<HTMLDivElement>(null);

  // --- 2. DAILY QUIZ STATE & LOGIC ---
  const quizQuestions = [
    {
      question: "Take a gentle pause. Bring your awareness inside your body. What physical sensation stands out most right now?",
      options: [
        { text: "Tightness in the shoulders, a furrowed brow, or a feeling of carrying a heavy load.", score: { manager: 3, firefighter: 0, exile: 0 } },
        { text: "Restlessness, an urge to move, or a foggy, numb sensation.", score: { manager: 0, firefighter: 3, exile: 0 } },
        { text: "A heavy chest, a hollow stomach, or a feeling of being very small and fragile.", score: { manager: 0, firefighter: 0, exile: 3 } },
        { text: "A spacious warmth, a steady heartbeat, and a sense of calm ground.", score: { self: 3 } }
      ]
    },
    {
      question: "Listen to your quiet internal dialogue. What is the tone of your mind's voice currently?",
      options: [
        { text: "Critical, planning, checking off lists, or telling you what you 'should' do.", score: { manager: 3, firefighter: 0, exile: 0 } },
        { text: "Frantic, angry, searching for an immediate escape, or telling you to ignore everything.", score: { manager: 0, firefighter: 3, exile: 0 } },
        { text: "Quietly sad, whispering 'no one understands,' or feeling deeply worried and alone.", score: { manager: 0, firefighter: 0, exile: 3 } },
        { text: "Curious, open-minded, listening gently, and speaking with quiet compassion.", score: { self: 3 } }
      ]
    },
    {
      question: "If you look at your current impulses, what do you want to do most right now?",
      options: [
        { text: "Work harder, fix a problem, organize something, or make sure others are happy with you.", score: { manager: 3, firefighter: 0, exile: 0 } },
        { text: "Grab a snack, scroll social media, play a game, or just walk away from it all.", score: { manager: 0, firefighter: 3, exile: 0 } },
        { text: "Hide away under a blanket, cry, or search for someone to reassure you.", score: { manager: 0, firefighter: 0, exile: 3 } },
        { text: "Take a deep breath, stretch, and meet whatever comes with gentle presence.", score: { self: 3 } }
      ]
    },
    {
      question: "What emotional flavor is most prominent in your internal space today?",
      options: [
        { text: "Anxiety, responsibility, frustration, or a need for control.", score: { manager: 3, firefighter: 0, exile: 0 } },
        { text: "Impulsiveness, irritation, numbness, or a sudden spike of protective anger.", score: { manager: 0, firefighter: 3, exile: 0 } },
        { text: "Loneliness, sadness, fear, or a sense of being easily hurt.", score: { manager: 0, firefighter: 0, exile: 3 } },
        { text: "Peace, connectedness, steady confidence, and lightheartedness.", score: { self: 3 } }
      ]
    },
    {
      question: "IFS asks a vital question: 'How do you feel toward this state of mind right now?' Choose the closest answer:",
      options: [
        { text: "I feel frustrated with it; I wish it would change or stop interfering.", score: { manager: 2, firefighter: 1 } },
        { text: "I feel afraid of it; I want to escape it or numb it immediately.", score: { firefighter: 2, exile: 1 } },
        { text: "I feel overwhelmed by it; I feel completely blended and lost in it.", score: { exile: 3 } },
        { text: "I feel curious about it, compassionate towards it, and willing to listen.", score: { self: 3 } }
      ]
    }
  ];

  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScores, setQuizScores] = useState({ manager: 0, firefighter: 0, exile: 0, self: 0 });
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  // --- 3. UNBURDENING CEREMONY STATE & LOGIC ---
  const [ceremonyPartId, setCeremonyPartId] = useState<string>('');
  const [ceremonyStep, setCeremonyStep] = useState<'select' | 'burden' | 'release' | 'complete'>('select');
  const [customBurden, setCustomBurden] = useState<string>('');
  const [releaseMethod, setReleaseMethod] = useState<'light' | 'water' | 'wind' | 'earth'>('light');
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; color: string; speedY: number; delay: number }[]>([]);

  // --- 4. CUSTOMIZER STATE & LOGIC ---
  const [customName, setCustomName] = useState<string>('');
  const [customRole, setCustomRole] = useState<'Self' | 'Manager' | 'Firefighter' | 'Exile'>('Manager');
  const [customSpecies, setCustomSpecies] = useState<CustomSpecies>('bunny');
  const [customExpression, setCustomExpression] = useState<CustomExpression>('worried');
  const [customAccessory, setCustomAccessory] = useState<CustomAccessory>('clipboard');
  const [customMotto, setCustomMotto] = useState<string>('');
  const [customBurdenText, setCustomBurdenText] = useState<string>('');
  const [customGiftText, setCustomGiftText] = useState<string>('');
  const [customColorTheme, setCustomColorTheme] = useState<string>('purple');

  const colorThemes = {
    pink: { primary: '#fbcfe8', secondary: '#fdf2f8', accent: '#ec4899', dark: '#9d174d', bg: 'from-pink-50 to-rose-100', border: 'border-pink-200' },
    purple: { primary: '#ddd6fe', secondary: '#ede9fe', accent: '#8b5cf6', dark: '#5b21b6', bg: 'from-violet-50 to-purple-100', border: 'border-purple-200' },
    blue: { primary: '#bae6fd', secondary: '#f0f9ff', accent: '#0284c7', dark: '#075985', bg: 'from-sky-50 to-blue-100', border: 'border-sky-200' },
    green: { primary: '#a7f3d0', secondary: '#f0fdf4', accent: '#059669', dark: '#064e3b', bg: 'from-emerald-50 to-teal-100', border: 'border-emerald-200' },
    orange: { primary: '#fed7aa', secondary: '#ffedd5', accent: '#f97316', dark: '#7c2d12', bg: 'from-orange-50 to-amber-100', border: 'border-orange-200' }
  };

  // --- BREATHING EXERCISE CYCLE TIMER ---
  useEffect(() => {
    let timer: any;
    if (breathingPhase !== 'idle') {
      timer = setInterval(() => {
        setBreathingSeconds(prev => {
          if (breathingPhase === 'inhale' && prev >= 4) {
            setBreathingPhase('hold');
            return 0;
          } else if (breathingPhase === 'hold' && prev >= 4) {
            setBreathingPhase('exhale');
            return 0;
          } else if (breathingPhase === 'exhale' && prev >= 4) {
            setBreathingPhase('inhale');
            setSelfEnergyCount(c => c + 1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [breathingPhase]);

  const startBreathing = () => {
    setBreathingPhase('inhale');
    setBreathingSeconds(0);
  };

  const stopBreathing = () => {
    setBreathingPhase('idle');
    setBreathingSeconds(0);
  };

  // --- INITIAL CHAT LOAD ---
  useEffect(() => {
    const initialHistories: Record<string, { sender: 'user' | 'part'; text: string }[] > = {};
    allCharacters.forEach(c => {
      initialHistories[c.id] = [
        { sender: 'part', text: c.chatResponses.greeting }
      ];
    });
    setChatHistories(initialHistories);
  }, []);

  // Sync custom characters to chat histories when added
  useEffect(() => {
    if (customCharacters.length > 0) {
      const latest = customCharacters[0];
      setChatHistories(prev => ({
        ...prev,
        [latest.id]: [{ sender: 'part', text: latest.chatResponses.greeting }]
      }));
    }
  }, [customCharacters]);

  // --- CHAT LOGIC ---
  const handleSendMessage = (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim()) return;

    const userMessage = { sender: 'user' as const, text: messageText };
    setChatHistories(prev => ({
      ...prev,
      [selectedCharacterId]: [...(prev[selectedCharacterId] || []), userMessage]
    }));

    if (!textToSend) setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let partReply = '';
      const lowercaseMsg = messageText.toLowerCase();

      if (lowercaseMsg.includes('thank') || lowercaseMsg.includes('grate') || lowercaseMsg.includes('appreciat')) {
        partReply = selectedCharacter.chatResponses.onThankYou;
      } else if (lowercaseMsg.includes('burden') || lowercaseMsg.includes('heavy') || lowercaseMsg.includes('carry') || lowercaseMsg.includes('tired') || lowercaseMsg.includes('pain')) {
        partReply = selectedCharacter.chatResponses.onAskBurden;
      } else if (lowercaseMsg.includes('gift') || lowercaseMsg.includes('power') || lowercaseMsg.includes('talent') || lowercaseMsg.includes('healed') || lowercaseMsg.includes('instead')) {
        partReply = selectedCharacter.chatResponses.onAskGift;
      } else if (lowercaseMsg.includes('relax') || lowercaseMsg.includes('rest') || lowercaseMsg.includes('calm') || lowercaseMsg.includes('stop') || lowercaseMsg.includes('break')) {
        partReply = selectedCharacter.chatResponses.onRelax;
      } else {
        if (selectedCharacter.role === 'Self') {
          partReply = "I am right here, holding a spacious, compassionate presence for you. What is coming up in your system right now?";
        } else if (selectedCharacter.role === 'Manager') {
          partReply = "I hear you. I'm just trying so hard to keep everything under control. If I don't do this, something terrible will happen. But I appreciate that you are talking to me gently...";
        } else if (selectedCharacter.role === 'Firefighter') {
          partReply = "Whoa! You're actually talking to me? Usually people just hate me or try to make me go away. I'm just trying to put out the fire before we burn. It's nice to be seen...";
        } else {
          partReply = "It's so nice that you are here. I've been holding this scary feeling for so long. Please don't go away. I just want to feel safe with you...";
        }
      }

      setChatHistories(prev => ({
        ...prev,
        [selectedCharacterId]: [...(prev[selectedCharacterId] || []), { sender: 'part' as const, text: partReply }]
      }));
      setIsTyping(false);
    }, 1000);
  };

  // --- GARDEN DRAG-AND-DROP LOGIC ---
  const handleGardenMouseDown = (e: React.MouseEvent, id: string) => {
    if (!gardenRef.current) return;
    const rect = gardenRef.current.getBoundingClientRect();
    const sticker = placedStickers.find(s => s.id === id);
    if (!sticker) return;

    const stickerX = (sticker.x / 100) * rect.width;
    const stickerY = (sticker.y / 100) * rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDraggingStickerId(id);
    setDragOffset({
      x: mouseX - stickerX,
      y: mouseY - stickerY
    });
    e.preventDefault();
  };

  const handleGardenMouseMove = (e: React.MouseEvent) => {
    if (!draggingStickerId || !gardenRef.current) return;
    const rect = gardenRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const targetX = mouseX - dragOffset.x;
    const targetY = mouseY - dragOffset.y;

    const xPct = Math.max(5, Math.min(95, (targetX / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, (targetY / rect.height) * 100));

    setPlacedStickers(prev => 
      prev.map(s => s.id === draggingStickerId ? { ...s, x: xPct, y: yPct } : s)
    );

    if (draggingStickerId !== 'placed-sol') {
      const selfSticker = placedStickers.find(s => s.id === 'placed-sol') || { x: 50, y: 50 };
      const dx = xPct - selfSticker.x;
      const dy = yPct - selfSticker.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const draggedSticker = placedStickers.find(s => s.id === draggingStickerId);
      const character = allCharacters.find(c => c.id === draggedSticker?.characterId);

      if (character && character.role !== 'Self') {
        if (distance < 25) {
          setGardenMessage(`✨ ${character.name} feels the deep, healing warmth of your Core Self! Their protective armor is relaxing.`);
        } else if (distance < 45) {
          setGardenMessage(`🌻 ${character.name} is noticing your presence. They are starting to breathe a bit easier.`);
        } else {
          setGardenMessage(`🌿 ${character.name} is keeping watch at the edge of your system. Drag them closer to Sol when they are ready to talk.`);
        }
      }
    }
  };

  const handleGardenMouseUp = () => {
    setDraggingStickerId(null);
  };

  const addStickerToGarden = (charId: string, isCustom: boolean) => {
    const newId = `placed-${charId}-${Date.now()}`;
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 15;
    const x = 50 + Math.cos(angle) * distance;
    const y = 50 + Math.sin(angle) * distance;

    setPlacedStickers(prev => [
      ...prev,
      { id: newId, characterId: charId, x, y, scale: 0.9, isCustom }
    ]);

    const character = allCharacters.find(c => c.id === charId);
    if (character) {
      setGardenMessage(`Placed ${character.name} sticker in the garden! Drag them around to map your inner world.`);
    }
  };

  const removeStickerFromGarden = (id: string) => {
    if (id === 'placed-sol') return;
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
  };

  const changeStickerScale = (id: string, factor: number) => {
    setPlacedStickers(prev =>
      prev.map(s => {
        if (s.id === id) {
          const newScale = Math.max(0.6, Math.min(1.5, s.scale + factor));
          return { ...s, scale: newScale };
        }
        return s;
      })
    );
  };

  const isStickerNearSelf = (x: number, y: number, id: string) => {
    if (id === 'placed-sol') return true;
    const selfSticker = placedStickers.find(s => s.id === 'placed-sol') || { x: 50, y: 50 };
    const dx = x - selfSticker.x;
    const dy = y - selfSticker.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 25;
  };

  // --- QUIZ LOGIC ---
  const handleQuizAnswer = (scoreObj: any) => {
    const nextScores = {
      manager: quizScores.manager + (scoreObj.manager || 0),
      firefighter: quizScores.firefighter + (scoreObj.firefighter || 0),
      exile: quizScores.exile + (scoreObj.exile || 0),
      self: quizScores.self + (scoreObj.self || 0),
    };

    setQuizScores(nextScores);

    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      const { manager, firefighter, exile, self } = nextScores;
      const maxVal = Math.max(manager, firefighter, exile, self);
      
      let resultCharId = 'sol-self';
      let feedback = '';

      if (maxVal === self) {
        resultCharId = 'sol-self';
        feedback = "Wow! You are currently operating with a beautiful level of Self-presence. You feel calm, connected, and compassionate. Spend today offering this wonderful Self-energy to any of your protective parts that might feel tired.";
      } else if (maxVal === manager) {
        const managers = ['critic-manager', 'pleaser-manager', 'planner-manager'];
        resultCharId = managers[Math.floor(Math.random() * managers.length)];
        feedback = "It looks like your Managers are working very hard to keep you organized, safe, and liked today. You might feel a bit anxious, critical, or busy planning. Let's take a moment to gently thank these protectors and connect with them.";
      } else if (maxVal === firefighter) {
        const firefighters = ['distractor-firefighter', 'binger-firefighter', 'angry-firefighter'];
        resultCharId = firefighters[Math.floor(Math.random() * firefighters.length)];
        feedback = "A Firefighter part is currently active or on standby. You might feel an urge to distract yourself, seek comfort in food/screen time, or feel a sudden spark of protective irritation. They are reacting to some underlying pain. Let's offer them gentle curiosity rather than judgment.";
      } else {
        const exiles = ['lonely-exile', 'scared-exile'];
        resultCharId = exiles[Math.floor(Math.random() * exiles.length)];
        feedback = "A tender, vulnerable Exile part is close to the surface. You might be feeling a bit lonely, small, sad, or afraid today. This is a beautiful opportunity to wrap them in compassion and let them know they are safe with your adult Self.";
      }

      setQuizResult(resultCharId);
      setQuizFeedback(feedback);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScores({ manager: 0, firefighter: 0, exile: 0, self: 0 });
    setQuizResult(null);
  };

  // --- UNBURDENING CEREMONY LOGIC ---
  const startCeremonyRelease = () => {
    if (!ceremonyPartId) return;
    setIsReleasing(true);

    const newParticles = Array.from({ length: 50 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 20;
      return {
        x: 50 + Math.cos(angle) * dist,
        y: 55 + Math.sin(angle) * dist,
        size: 2 + Math.random() * 4,
        color: releaseMethod === 'light' ? '#fef08a' : releaseMethod === 'water' ? '#60a5fa' : releaseMethod === 'wind' ? '#a7f3d0' : '#d97706',
        speedY: -0.5 - Math.random() * 1.5,
        delay: Math.random() * 2
      };
    });
    setParticles(newParticles);

    setTimeout(() => {
      setIsReleasing(false);
      setUnburdenedParts(prev => [...prev, ceremonyPartId]);
      setCeremonyStep('complete');
    }, 3500);
  };

  const selectedCeremonyPart = allCharacters.find(c => c.id === ceremonyPartId);

  // --- CUSTOMIZER LOGIC ---
  const handlePrintSticker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const theme = colorThemes[customColorTheme as keyof typeof colorThemes] || colorThemes.purple;
    const newId = `custom-${Date.now()}`;
    
    const newCustom: IFSCharacter = {
      id: newId,
      name: `${customName} (Custom ${customRole})`,
      role: customRole,
      roleTitle: `Custom ${customRole}`,
      roleDescription: `A personal ${customRole} part created in your sticker workshop.`,
      motto: customMotto || "I am doing my best to support you.",
      description: `A custom-designed ${customRole} part named ${customName}. Modeled in a cute vector sticker style as a ${customSpecies} holding a ${customAccessory}.`,
      burden: customBurdenText || "The heavy weight of representing this personal role.",
      gift: customGiftText || "A unique protective strength, wisdom, or playfulness.",
      prompts: [
        `What are you trying to protect me from, ${customName}?`,
        `How does it feel to be welcomed into my sticker journal?`,
        `What is your favorite way to rest when you aren't working?`
      ],
      color: theme,
      chatResponses: {
        greeting: `Hello! I am ${customName}, your custom ${customRole}. *wiggles ears* I was created to help you look at this part of your life. Thank you for welcoming me into your album! What would you like to talk about?`,
        onThankYou: `Oh, wow! *blushes* It feels so nice to be appreciated for my role as a ${customRole}. Usually, people try to ignore parts like me. Thank you for your warmth!`,
        onAskBurden: `My burden is: "${customBurdenText || "carrying this heavy responsibility alone"}". It's a lot of weight to carry, but I do it because I want us to be safe.`,
        onAskGift: `When I feel safe, my gift to you is: "${customGiftText || "my unique wisdom and presence"}". I would love to share this with you all the time!`,
        onRelax: `Ah... a chance to rest! *sets down accessory* I would love to just sit with your Self and take a long, quiet breath. We are safe now.`
      },
      renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
        <CustomSticker
          species={customSpecies}
          expression={customExpression}
          accessory={customAccessory}
          primaryColor={theme.primary}
          secondaryColor={theme.secondary}
          accentColor={theme.accent}
          name={customName}
          className={className}
          interactive={interactive}
          isUnburdened={isUnburdened}
        />
      )
    };

    setCustomCharacters(prev => [newCustom, ...prev]);
    setSelectedCharacterId(newId);
    
    setCustomName('');
    setCustomMotto('');
    setCustomBurdenText('');
    setCustomGiftText('');

    setActiveTab('album');
  };

  return (
    <div className="min-h-screen bg-[#18130f] py-8 px-4 sm:px-12 flex flex-col font-sans text-[#3d2a1c] selection:bg-amber-100 relative overflow-hidden">
      {/* Dynamic atmospheric desk lights */}
      <div className="absolute top-[-10%] left-[20%] w-[50%] h-[60%] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[50%] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* --- DESK ACCESSORIES (Skeuomorphic touches) --- */}
      {/* Ceramic Coffee/Tea Cup with animated steam */}
      <div className="hidden xl:flex absolute bottom-12 left-10 items-center gap-2 z-10 select-none">
        <div className="relative">
          {/* Steam loops */}
          <div className="absolute -top-10 left-6 flex flex-col gap-1 opacity-20">
            <div className="w-1 h-6 bg-white rounded-full animate-pulse"></div>
            <div className="w-1.5 h-8 bg-white rounded-full animate-pulse [animation-delay:0.4s] -mt-2"></div>
          </div>
          <div className="w-16 h-16 bg-[#eae4d5] border-4 border-white rounded-full shadow-lg flex items-center justify-center relative">
            <div className="w-12 h-12 bg-[#3d2a1c] rounded-full border-2 border-[#5c4a3c] flex items-center justify-center">
              {/* Latte Art Star */}
              <Star className="w-4 h-4 text-amber-200 fill-amber-200" />
            </div>
            {/* Cup Handle */}
            <div className="absolute top-4 -right-3 w-5 h-8 border-4 border-white rounded-r-xl bg-transparent shadow-md"></div>
          </div>
        </div>
        <div className="text-left">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#8a725e]">Self-Presence Brew</span>
          <p className="text-xs text-[#b09681] italic">Warm & centering</p>
        </div>
      </div>

      {/* Tactile Brass Fountain Pen */}
      <div className="hidden xl:block absolute top-16 right-16 z-10 select-none transform rotate-12 drop-shadow-md">
        <div className="w-2.5 h-36 bg-gradient-to-r from-[#d97706] to-[#b45309] rounded-full relative border border-[#3d2a1c]/20">
          <div className="absolute top-0 left-0 right-0 h-4 bg-yellow-200 rounded-t-full border-b border-[#3d2a1c]/40"></div>
          {/* Nib */}
          <div className="absolute bottom-[-8px] left-[1px] w-2 h-3 bg-neutral-200 border-l border-r border-b border-[#3d2a1c]/60 clip-path-nib"></div>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="max-w-6xl w-full mx-auto mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6 z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-800/30 rounded-full text-xs font-semibold text-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Siggraph-Tier Redesign v2.5
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-serif text-white drop-shadow-md flex items-center justify-center sm:justify-start gap-4">
            My Internal Family
            <span className="text-xl sm:text-2xl transform rotate-2 inline-block bg-[#fef08a] text-[#451a03] px-3.5 py-1.5 border-3 border-[#3d2a1c] rounded-xl shadow-lg font-sans font-extrabold">
              Sticker Journal 🧸
            </span>
          </h1>
          <p className="text-sm text-[#c8b29e] mt-2 max-w-2xl">
            A premium, physical ring-bound scrapbook dedicated to map, understand, and lovingly unburden your internal parts. 
          </p>
        </div>

        {/* Global Self-Presence Indicator */}
        <div className="bg-[#1c1611]/80 border-2 border-amber-800/40 rounded-2xl p-4 shadow-xl flex items-center gap-4 backdrop-blur-md">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Heart className="w-6 h-6 fill-amber-500/40" />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#a88d75]">Self Energy</div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>{selfEnergyCount} Centering Breath Cycles</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Centered</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN SCRAPBOOK NOTEBOOK --- */}
      <main className="max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 z-10 relative">
        
        {/* VERTICAL BRASS BINDER TABS */}
        <nav className="lg:col-span-1 flex lg:flex-col justify-start gap-2 mb-3 lg:mb-0 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 z-20">
          {[
            { id: 'album', icon: BookOpen, label: 'Sticker Book', color: 'bg-amber-100 text-amber-900 border-amber-300' },
            { id: 'garden', icon: Compass, label: 'Inner Map', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
            { id: 'ceremony', icon: Flame, label: 'Unburden', color: 'bg-rose-100 text-rose-900 border-rose-300' },
            { id: 'quiz', icon: HelpCircle, label: 'Parts Quiz', color: 'bg-blue-100 text-blue-900 border-blue-300' },
            { id: 'customizer', icon: Plus, label: 'Workshop', color: 'bg-purple-100 text-purple-900 border-purple-300' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 lg:flex-none flex flex-col items-center justify-center py-4 px-3 rounded-2xl border-3 border-[#3d2a1c] transition-all whitespace-nowrap shadow-md ${
                  isActive
                    ? `${tab.color} font-black translate-x-0 lg:translate-x-3 scale-105 z-30`
                    : 'bg-[#28211b] text-[#c8b29e] border-[#4a3a2f] hover:bg-[#322a22] hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* PHYSICAL 3D LEATHER NOTEBOOK FRAME */}
        <div className="lg:col-span-11 bg-[#faf6ed] border-[10px] border-[#fffdfb] rounded-[36px] shadow-2xl flex flex-col relative overflow-hidden min-h-[660px] border-[#3d2a1c] ring-4 ring-[#18130f]">
          
          {/* Left Page Edge Margin */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#1c1611]/10 to-transparent pointer-events-none opacity-50 z-10"></div>
          
          {/* Realistic Ring-Bound Binder Spine Visual */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#ece4d5] via-[#d6cbb6] to-transparent border-r border-[#3d2a1c]/10 pointer-events-none z-10"></div>

          {/* SKEUOMORPHIC 3D BRASS BINDER RINGS */}
          <div className="absolute left-[-6px] top-12 bottom-12 w-3 flex flex-col justify-between items-center py-8 pointer-events-none z-20">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="w-5 h-12 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 rounded-full border-2 border-[#3d2a1c] shadow-md transform -rotate-12"></div>
            ))}
          </div>
          
          <div className="flex-1 p-6 sm:p-8 flex flex-col z-0 pl-10">
            
            {/* ================= 1. TAB: STICKER ALBUM ================= */}
            {activeTab === 'album' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
                
                {/* Left Side: Sticker Sheet Grid */}
                <div className="md:col-span-7 flex flex-col">
                  <div className="mb-5 flex justify-between items-center border-b-2 border-[#e6dcce] pb-3">
                    <div>
                      <h2 className="text-2xl font-bold font-serif text-[#4a3728] flex items-center gap-2.5">
                        <span>📖</span> Collector's Sticker Album
                      </h2>
                      <p className="text-xs text-[#786c5f] mt-0.5">Select a premium die-cut sticker to examine its core burden, gift, and speak to it.</p>
                    </div>
                    
                    <span className="bg-amber-100 text-amber-900 border-2 border-[#3d2a1c] text-xs px-3 py-1 rounded-xl font-extrabold shadow-sm">
                      {allCharacters.length} Collectibles
                    </span>
                  </div>

                  {/* Sticker Sheet Grid */}
                  <div className="bg-[#f5ece0] border-3 border-[#3d2a1c] rounded-2xl p-5 flex-1 overflow-y-auto max-h-[480px] grid grid-cols-3 gap-5 custom-scrollbar shadow-inner">
                    {allCharacters.map(char => {
                      const isUnburdened = unburdenedParts.includes(char.id);
                      const isSelected = char.id === selectedCharacterId;
                      
                      return (
                        <div
                          key={char.id}
                          onClick={() => {
                            setSelectedCharacterId(char.id);
                            if (!chatHistories[char.id]) {
                              setChatHistories(prev => ({
                                ...prev,
                                [char.id]: [{ sender: 'part', text: char.chatResponses.greeting }]
                              }));
                            }
                          }}
                          className={`relative group cursor-pointer aspect-square bg-[#fffdfa] border-3 rounded-2xl p-3 flex flex-col items-center justify-between transition-all hover-wobble ${
                            isSelected 
                              ? 'border-[#3d2a1c] bg-amber-50/60 scale-98 shadow-md ring-3 ring-amber-300' 
                              : 'border-[#d2c2ad] hover:border-[#3d2a1c] hover:shadow-md'
                          }`}
                        >
                          {/* Role Badge */}
                          <span className={`absolute top-2 left-2 text-[8px] font-black px-2 py-0.5 rounded-full border-2 ${
                            char.role === 'Self' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            char.role === 'Manager' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            char.role === 'Firefighter' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                            'bg-sky-100 text-sky-800 border-sky-300'
                          }`}>
                            {char.role}
                          </span>

                          {/* Unburdened Sparkle Glow */}
                          {isUnburdened && (
                            <span className="absolute top-2 right-2 text-sm text-amber-500 font-black animate-pulse" title="Unburdened / Healed">
                              ✨
                            </span>
                          )}

                          {/* Render Sticker SVG */}
                          <div className="w-24 h-24 my-auto flex items-center justify-center">
                            {char.renderSticker({ className: 'w-full h-full', interactive: true, isUnburdened })}
                          </div>

                          {/* Character Name */}
                          <span className="text-xs font-black text-center line-clamp-1 w-full text-[#4a3728] mt-1">
                            {char.id.startsWith('custom-') ? char.name.split(' (')[0] : char.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Detailed Diary Entry & Dialogue */}
                <div className="md:col-span-5 flex flex-col bg-[#fffef9] border-3 border-[#3d2a1c] rounded-2xl p-5 shadow-lg relative">
                  
                  {/* Decorative notebook tape */}
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-28 h-6 bg-yellow-200/50 border-x border-[#3d2a1c]/20 transform -rotate-1 select-none pointer-events-none"></div>
                  
                  {/* Header / Sticker Preview */}
                  <div className="flex items-start gap-4 border-b-2 border-[#f5ece0] pb-4 mb-4 mt-2">
                    <div className="w-24 h-24 bg-white border-3 border-[#3d2a1c] rounded-2xl p-1.5 shrink-0 flex items-center justify-center relative shadow-sm">
                      {selectedCharacter.renderSticker({ 
                        className: 'w-full h-full', 
                        isUnburdened: unburdenedParts.includes(selectedCharacter.id) 
                      })}
                      {unburdenedParts.includes(selectedCharacter.id) && (
                        <div className="absolute -bottom-2.5 -right-2 bg-emerald-100 text-emerald-800 border-2 border-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                          HEALED
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 ${
                          selectedCharacter.role === 'Self' ? 'bg-yellow-100 text-yellow-900 border-yellow-300' :
                          selectedCharacter.role === 'Manager' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          selectedCharacter.role === 'Firefighter' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                          'bg-sky-100 text-sky-900 border-sky-300'
                        }`}>
                          {selectedCharacter.roleTitle}
                        </span>
                        
                        <button
                          onClick={() => addStickerToGarden(selectedCharacter.id, selectedCharacter.id.startsWith('custom-'))}
                          className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-[#3d2a1c] px-3 py-0.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Place in Map
                        </button>
                      </div>
                      
                      <h3 className="text-lg font-black text-[#4a3728] mt-1.5 font-serif line-clamp-1">{selectedCharacter.name}</h3>
                      <p className="text-xs text-[#8c7e70] italic line-clamp-2 mt-0.5">"{selectedCharacter.motto}"</p>
                    </div>
                  </div>

                  {/* Scrollable details and Chat tabs */}
                  <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar space-y-5 pr-1">
                    
                    {/* Description Block */}
                    <div className="text-xs space-y-3">
                      <p className="leading-relaxed text-[#5c4e40] font-medium">{selectedCharacter.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-xl">
                          <span className="font-extrabold text-[10px] text-rose-800 uppercase block mb-1">Underlying Burden</span>
                          <p className="text-xs text-rose-950 leading-normal font-medium">
                            {unburdenedParts.includes(selectedCharacter.id) 
                              ? "✨ Released! This part has let go of its burden." 
                              : selectedCharacter.burden}
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                          <span className="font-extrabold text-[10px] text-emerald-800 uppercase block mb-1">Core Gift / Essence</span>
                          <p className="text-xs text-emerald-950 leading-normal font-medium">{selectedCharacter.gift}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dialog / Speak to Part */}
                    <div className="border-t-2 border-[#f5ece0] pt-4">
                      <h4 className="text-xs font-black text-[#4a3728] flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4.5 h-4.5 text-amber-600" /> Dialectical Conversation
                      </h4>
                      
                      {/* Chat Messages */}
                      <div className="bg-[#fdfbf7] border-2 border-[#3d2a1c] rounded-2xl p-4 h-48 overflow-y-auto text-xs flex flex-col gap-3 custom-scrollbar shadow-inner">
                        {(chatHistories[selectedCharacterId] || []).map((msg, idx) => (
                          <div
                            key={idx}
                            className={`max-w-[85%] p-3 rounded-2xl leading-relaxed font-medium ${
                              msg.sender === 'user'
                                ? 'bg-amber-100 text-amber-950 self-end rounded-tr-none border-2 border-amber-300 shadow-sm'
                                : 'bg-white text-[#4a3728] self-start rounded-tl-none border-2 border-neutral-200 shadow-sm'
                            }`}
                          >
                            <span className="font-black text-[9px] block text-[#8c7e70] mb-1 uppercase tracking-wider">
                              {msg.sender === 'user' ? 'My Self' : selectedCharacter.name.split(' (')[0]}
                            </span>
                            {msg.text}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="bg-white border-2 border-neutral-200 max-w-[50px] p-2 rounded-2xl rounded-tl-none self-start flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        )}
                      </div>

                      {/* Sparked reflection prompts */}
                      <div className="mt-3 space-y-2">
                        <span className="text-[9px] font-black text-[#9d8975] uppercase tracking-wider block">Recommended Self-Inquiries:</span>
                        <div className="flex flex-col gap-1.5">
                          {selectedCharacter.prompts.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(p)}
                              disabled={isTyping}
                              className="text-[11px] text-left bg-white hover:bg-amber-50/50 text-[#6e5d4f] hover:text-[#4a3728] border-2 border-[#d9ccb9] hover:border-[#3d2a1c] px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 font-semibold shadow-sm active:scale-99"
                            >
                              💬 "{p}"
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chat Input */}
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          disabled={isTyping}
                          placeholder={`Speak gently to ${selectedCharacter.name.split(' (')[0]}...`}
                          className="flex-1 text-xs border-2 border-[#3d2a1c] bg-white rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-3 focus:ring-amber-200 font-semibold"
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={isTyping || !chatInput.trim()}
                          className="bg-[#3d2a1c] hover:bg-[#5c4a3c] text-white text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          Send
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ================= 2. TAB: INNER WORLD GARDEN ================= */}
            {activeTab === 'garden' && (
              <div className="flex flex-col md:flex-row gap-6 flex-1">
                
                {/* Left Side: Placed Stickers Sidebar */}
                <div className="md:col-span-3 flex flex-col bg-white border-3 border-[#3d2a1c] rounded-2xl p-4 shadow-md">
                  <div className="border-b-2 border-[#f5ece0] pb-3 mb-3">
                    <h3 className="text-sm font-black text-[#4a3728] flex items-center gap-1.5">
                      <Bookmark className="w-4.5 h-4.5 text-emerald-600" /> Sticker Drawer
                    </h3>
                    <p className="text-[10px] text-[#8c7e70] mt-0.5 leading-normal">Place multiple parts on the map to visualize and soothe their relationships.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-2 custom-scrollbar">
                    {allCharacters.map(char => (
                      <div
                        key={char.id}
                        className="flex items-center justify-between p-2.5 bg-[#fcf8f0] rounded-xl border-2 border-[#e6dcce] hover:border-[#3d2a1c] transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 shrink-0">
                            {char.renderSticker({ className: 'w-full h-full', isUnburdened: unburdenedParts.includes(char.id) })}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-[#4a3728] block truncate leading-none mb-1">
                              {char.id.startsWith('custom-') ? char.name.split(' (')[0] : char.name}
                            </span>
                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border uppercase ${
                              char.role === 'Self' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                              char.role === 'Manager' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              char.role === 'Firefighter' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                              'bg-sky-50 text-sky-800 border-sky-200'
                            }`}>
                              {char.role}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => addStickerToGarden(char.id, char.id.startsWith('custom-'))}
                          className="p-1.5 bg-white hover:bg-emerald-50 border-2 border-[#d9ccb9] hover:border-[#3d2a1c] rounded-xl text-[#5c4e40] hover:text-emerald-800 transition-colors cursor-pointer"
                          title="Place in Garden"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-[#f5ece0] pt-3 mt-3">
                    <h4 className="text-xs font-black text-[#4a3728]">Active Map Stickers:</h4>
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                      {placedStickers.map(s => {
                        const char = allCharacters.find(c => c.id === s.characterId);
                        if (!char) return null;
                        return (
                          <div 
                            key={s.id} 
                            className="text-[10px] bg-neutral-100 border-2 border-neutral-300 rounded-xl px-2.5 py-0.5 flex items-center gap-1.5 font-bold"
                          >
                            <span className="truncate max-w-[80px]">{char.name.split(' (')[0]}</span>
                            {s.id !== 'placed-sol' && (
                              <button 
                                onClick={() => removeStickerFromGarden(s.id)}
                                className="text-neutral-400 hover:text-red-600 font-black ml-1.5 text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive Garden Canvas */}
                <div className="md:col-span-9 flex flex-col">
                  {/* Breathing Mirror / Centering Altar */}
                  <div className="mb-4 bg-gradient-to-br from-[#1c1611] to-[#2d221a] border-3 border-amber-500/30 rounded-2xl p-4 shadow-lg text-white flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-3.5 z-10">
                      {/* Breathing Lotus Animation */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className={`absolute w-full h-full bg-amber-500/20 rounded-full blur-md transition-all duration-[4000ms] ${
                          breathingPhase === 'inhale' ? 'scale-150 opacity-100' : breathingPhase === 'exhale' ? 'scale-75 opacity-20' : 'scale-100 opacity-50'
                        }`}></div>
                        <Heart className={`w-6 h-6 text-amber-400 fill-amber-400 transition-all duration-[4000ms] ${
                          breathingPhase === 'inhale' ? 'scale-125' : breathingPhase === 'exhale' ? 'scale-90' : 'scale-100'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-200">The Breathing Mirror</h4>
                        <p className="text-[11px] text-[#c8b29e] max-w-sm mt-0.5">
                          {breathingPhase === 'idle' ? "Center into Self-presence before engaging with parts." : 
                           breathingPhase === 'inhale' ? `✨ Inhale calm & compassion (4s) ... ${breathingSeconds}s` :
                           breathingPhase === 'hold' ? `💫 Hold, feel the space (4s) ... ${breathingSeconds}s` : 
                           `🌬️ Exhale fear & judgment (4s) ... ${breathingSeconds}s`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 z-10 shrink-0">
                      {breathingPhase === 'idle' ? (
                        <button
                          onClick={startBreathing}
                          className="bg-amber-400 hover:bg-amber-300 text-[#451a03] text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Start Breath Cycle
                        </button>
                      ) : (
                        <button
                          onClick={stopBreathing}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Stop
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Canvas Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 bg-[#effaf3] border-2 border-[#bbf7d0] rounded-xl p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-950 leading-snug">{gardenMessage}</span>
                    </div>
                    <button
                      onClick={() => {
                        setPlacedStickers([{ id: 'placed-sol', characterId: 'sol-self', x: 50, y: 50, scale: 1.1, isCustom: false }]);
                        setGardenMessage('Garden reset! Sol is at the center.');
                      }}
                      className="text-[10px] font-black bg-white hover:bg-neutral-50 text-[#786c5f] border-2 border-neutral-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 self-end active:scale-95 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Map
                    </button>
                  </div>

                  {/* Interactive Drag-and-Drop Area */}
                  <div 
                    ref={gardenRef}
                    onMouseMove={handleGardenMouseMove}
                    onMouseUp={handleGardenMouseUp}
                    onMouseLeave={handleGardenMouseUp}
                    className="flex-1 bg-[#fffdfc] border-4 border-dashed border-[#e6dcce] rounded-3xl relative overflow-hidden min-h-[420px] shadow-inner"
                  >
                    {/* Concentric rings showing distance from center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-square border-2 border-dashed border-yellow-300/30 rounded-full opacity-60 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square border-3 border-dashed border-yellow-300/50 rounded-full opacity-40 pointer-events-none animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-[#a88d75]/40 font-black uppercase tracking-widest text-center select-none pointer-events-none mt-20">
                      Center of Self-Presence
                    </div>

                    {/* Placed stickers */}
                    {placedStickers.map(sticker => {
                      const char = allCharacters.find(c => c.id === sticker.characterId);
                      if (!char) return null;

                      const nearSelf = isStickerNearSelf(sticker.x, sticker.y, sticker.id);
                      const isPartUnburdened = unburdenedParts.includes(char.id) || (char.role !== 'Self' && nearSelf);
                      const isDragging = draggingStickerId === sticker.id;

                      return (
                        <div
                          key={sticker.id}
                          onMouseDown={(e) => handleGardenMouseDown(e, sticker.id)}
                          className={`absolute group select-none cursor-move transition-shadow ${
                            isDragging ? 'z-50 cursor-grabbing scale-105' : 'z-20'
                          }`}
                          style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                          }}
                        >
                          {/* Inner Healing Halo glow */}
                          {nearSelf && char.role !== 'Self' && (
                            <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none"></div>
                          )}

                          {/* Sticker Rendering */}
                          <div className={`w-28 h-28 relative ${
                            nearSelf && char.role !== 'Self' 
                              ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]' 
                              : ''
                          }`}>
                            {char.renderSticker({ 
                              className: 'w-full h-full', 
                              isUnburdened: isPartUnburdened 
                            })}

                            {/* Label */}
                            <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded border-2 shadow-md whitespace-nowrap opacity-85 group-hover:opacity-100 transition-opacity ${
                              char.role === 'Self' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              nearSelf ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-bounce' :
                              'bg-neutral-100 text-neutral-800 border-neutral-300'
                            }`}>
                              {char.id.startsWith('custom-') ? char.name.split(' (')[0] : char.name.split(' (')[0]}
                              {nearSelf && char.role !== 'Self' && ' (Soothed)'}
                            </span>
                          </div>

                          {/* Resize/Delete Controls */}
                          {!isDragging && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-white border-2 border-[#3d2a1c] rounded-xl p-1 shadow-md z-40">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeStickerScale(sticker.id, 0.1);
                                }}
                                className="w-5 h-5 text-xs font-black bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded flex items-center justify-center cursor-pointer"
                                title="Enlarge"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeStickerScale(sticker.id, -0.1);
                                }}
                                className="w-5 h-5 text-xs font-black bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded flex items-center justify-center cursor-pointer"
                                title="Shrink"
                              >
                                -
                              </button>
                              {sticker.id !== 'placed-sol' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStickerFromGarden(sticker.id);
                                  }}
                                  className="w-5 h-5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded flex items-center justify-center cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ================= 3. TAB: UNBURDENING CEREMONY ================= */}
            {activeTab === 'ceremony' && (
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-rose-100 text-rose-800 rounded-full border-2 border-rose-300 mb-3 animate-pulse">
                    <Flame className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-[#4a3728]">The Healing Altar</h2>
                  <p className="text-xs text-[#8c7e70] max-w-md mt-1">
                    An IFS-informed unburdening ceremony. Protect and release the heavy loads your parts have carried, transforming them into their natural strengths.
                  </p>
                </div>

                <div className="bg-[#fffefb] border-4 border-[#3d2a1c] rounded-[32px] p-6 shadow-xl w-full relative overflow-hidden min-h-[360px] flex flex-col justify-between">
                  
                  {/* Step 1: Select Part */}
                  {ceremonyStep === 'select' && (
                    <div className="flex-1 flex flex-col justify-center">
                      <label className="text-xs font-black text-[#9d8975] uppercase tracking-widest block mb-3 text-center">
                        Which part is ready to release its burden?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar p-1">
                        {allCharacters.filter(c => c.role !== 'Self').map(char => {
                          const isAlreadyHealed = unburdenedParts.includes(char.id);
                          return (
                            <button
                              key={char.id}
                              disabled={isAlreadyHealed}
                              onClick={() => {
                                setCeremonyPartId(char.id);
                                setCustomBurden(char.burden);
                                setCeremonyStep('burden');
                              }}
                              className={`p-4 rounded-2xl border-3 flex flex-col items-center gap-1 bg-white transition-all cursor-pointer hover-wobble ${
                                isAlreadyHealed 
                                  ? 'opacity-40 border-neutral-100 bg-neutral-50/30 cursor-not-allowed' 
                                  : 'border-[#d9ccb9] hover:border-rose-400 hover:bg-rose-50/20 shadow-sm'
                              }`}
                            >
                              <div className="w-14 h-14">
                                {char.renderSticker({ className: 'w-full h-full', isUnburdened: isAlreadyHealed })}
                              </div>
                              <span className="text-xs font-black text-center line-clamp-1 w-full mt-1">{char.name.split(' (')[0]}</span>
                              <span className="text-[8px] font-black uppercase text-neutral-500">{isAlreadyHealed ? 'HEALED' : char.role}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {allCharacters.filter(c => c.role !== 'Self').every(c => unburdenedParts.includes(c.id)) && (
                        <div className="text-center text-emerald-800 font-bold text-sm mt-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl">
                          🎉 Beautiful work! All of your protective parts have been unburdened and are sharing their gifts!
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Choose Burden to Release */}
                  {ceremonyStep === 'burden' && selectedCeremonyPart && (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-center gap-4 border-b-2 border-[#f5ece0] pb-4 mb-4">
                        <div className="w-20 h-20 bg-white border-2 border-[#3d2a1c] rounded-xl p-1 shadow-sm">
                          {selectedCeremonyPart.renderSticker({ className: 'w-full h-full' })}
                        </div>
                        <div>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-900 border-2 border-[#3d2a1c] px-2.5 py-0.5 rounded-full uppercase">
                            Part selected
                          </span>
                          <h4 className="text-base font-black text-[#4a3728] mt-1">{selectedCeremonyPart.name}</h4>
                        </div>
                      </div>

                      <div className="space-y-4 my-auto">
                        <div>
                          <label className="text-xs font-black text-[#9d8975] uppercase tracking-widest block mb-1">
                            Confirm the heavy burden they are holding:
                          </label>
                          <textarea
                            value={customBurden}
                            onChange={(e) => setCustomBurden(e.target.value)}
                            className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl p-3.5 focus:outline-none focus:ring-3 focus:ring-rose-200 font-semibold"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-black text-[#9d8975] uppercase tracking-widest block mb-2">
                            Choose an element to carry this burden away:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(
                              [
                                { id: 'light', label: '🌟 Light', desc: 'Dissolve into golden rays' },
                                { id: 'water', label: '🌊 Water', desc: 'Wash down a fresh river' },
                                { id: 'wind', label: '💨 Wind', desc: 'Blow away like pollen' },
                                { id: 'earth', label: '🌱 Earth', desc: 'Buried to compost and grow' }
                              ] as const
                            ).map(el => (
                              <button
                                key={el.id}
                                onClick={() => setReleaseMethod(el.id)}
                                className={`p-3 rounded-2xl border-3 text-left cursor-pointer transition-all ${
                                  releaseMethod === el.id 
                                    ? 'bg-rose-50 border-rose-500 font-bold shadow-md' 
                                    : 'bg-white border-[#d9ccb9] hover:bg-neutral-50'
                                }`}
                              >
                                <div className="text-xs font-black">{el.label}</div>
                                <div className="text-[9px] text-[#8c7e70] leading-tight mt-1 font-medium">{el.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t-2 border-[#f5ece0] pt-4 mt-4">
                        <button
                          onClick={() => setCeremonyStep('select')}
                          className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black py-3 px-4 rounded-2xl transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setCeremonyStep('release')}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-3 px-4 rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                        >
                          Prepare Release <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Perform Release Animation */}
                  {ceremonyStep === 'release' && selectedCeremonyPart && (
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                      {!isReleasing ? (
                        <div className="text-center space-y-6 max-w-md mx-auto">
                          <div className="text-xs font-black text-rose-500 uppercase tracking-widest animate-pulse">
                            Ready for the Unburdening
                          </div>
                          
                          <div className="w-36 h-36 mx-auto bg-white border-4 border-[#3d2a1c] rounded-full p-3 shadow-lg relative animate-bounce [animation-duration:3s]">
                            {selectedCeremonyPart.renderSticker({ className: 'w-full h-full' })}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-rose-100 text-rose-950 border-2 border-[#3d2a1c] text-[9px] font-extrabold px-3 py-1 rounded-xl whitespace-nowrap shadow-md">
                              "{customBurden}"
                            </div>
                          </div>

                          <p className="text-xs text-[#786c5f] leading-relaxed font-medium">
                            Take a slow, deep breath. Focus on your heart. Reassure the part that they do not need to carry this weight anymore. When you are ready, press release.
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setCeremonyStep('burden')}
                              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black py-3 px-4 rounded-2xl transition-colors cursor-pointer"
                            >
                              Edit Burden
                            </button>
                            <button
                              onClick={startCeremonyRelease}
                              className="flex-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-3 px-6 rounded-2xl transition-all hover:scale-102 shadow-lg cursor-pointer"
                            >
                              Release to the {releaseMethod.toUpperCase()} ✨
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Dimming Altar animation
                        <div className="absolute inset-[-24px] bg-[#140f0c] flex flex-col items-center justify-center p-8 text-white overflow-hidden z-50">
                          {/* Candle glows */}
                          <div className="absolute top-10 left-10 w-4 h-12 bg-amber-500 rounded-full blur-md animate-pulse"></div>
                          <div className="absolute top-12 left-10 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping"></div>
                          <div className="absolute bottom-10 right-10 w-4 h-12 bg-amber-500 rounded-full blur-md animate-pulse [animation-delay:1s]"></div>
                          <div className="absolute bottom-12 right-10 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping [animation-delay:1s]"></div>

                          {/* Floating particles */}
                          <div className="absolute inset-0 pointer-events-none">
                            {particles.map((p, idx) => (
                              <div
                                key={idx}
                                className="absolute rounded-full animate-floatUp"
                                style={{
                                  left: `${p.x}%`,
                                  top: `${p.y}%`,
                                  width: `${p.size}px`,
                                  height: `${p.size}px`,
                                  backgroundColor: p.color,
                                  boxShadow: `0 0 8px ${p.color}`,
                                  animationDuration: `${2.5 + Math.random()}s`,
                                  animationDelay: `${p.delay}s`,
                                  opacity: 0
                                }}
                              />
                            ))}
                          </div>

                          <div className="text-center space-y-6 max-w-sm relative z-10 animate-fade">
                            <div className="w-32 h-32 mx-auto animate-pulse">
                              {selectedCeremonyPart.renderSticker({ className: 'w-full h-full filter invert brightness-200' })}
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-sm font-black uppercase tracking-widest text-amber-300">Releasing Burden</h3>
                              <p className="text-xs text-neutral-300 italic">"I release the load of {customBurden}..."</p>
                            </div>

                            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-700">
                              <div className="bg-gradient-to-r from-amber-300 to-rose-500 h-full w-full animate-progressBar"></div>
                            </div>

                            <p className="text-[10px] text-neutral-400 animate-pulse">Letting go into the {releaseMethod}...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Ceremony Completed */}
                  {ceremonyStep === 'complete' && selectedCeremonyPart && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
                      <div className="inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-full border-2 border-emerald-300 animate-bounce">
                        <Check className="w-6 h-6" />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold font-serif text-[#4a3728]">{selectedCeremonyPart.name.split(' (')[0]} is Healed!</h3>
                        <p className="text-xs text-[#786c5f] mt-1">
                          The heavy burden has dissolved. Look! The part's expression has softened, and they can finally step into their true gift:
                        </p>
                      </div>

                      <div className="w-36 h-36 bg-white border-4 border-emerald-300 rounded-full p-2.5 shadow-lg relative group hover:scale-105 transition-transform duration-300">
                        {selectedCeremonyPart.renderSticker({ className: 'w-full h-full', isUnburdened: true })}
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-3.5 py-1 rounded-full whitespace-nowrap shadow-md border-2 border-white">
                          ✨ {selectedCeremonyPart.gift.split(',')[0]}
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-left text-xs leading-relaxed text-emerald-950 font-semibold shadow-sm">
                        <span className="font-extrabold text-emerald-800 block mb-0.5">Their Healed Gift in Your System:</span>
                        {selectedCeremonyPart.gift}
                      </div>

                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => {
                            setCeremonyStep('select');
                            setCeremonyPartId('');
                          }}
                          className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black py-3 px-4 rounded-2xl transition-colors cursor-pointer"
                        >
                          Heal Another Part
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCharacterId(selectedCeremonyPart.id);
                            setActiveTab('album');
                            setCeremonyStep('select');
                            setCeremonyPartId('');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 px-4 rounded-2xl transition-colors shadow-md cursor-pointer"
                        >
                          View in Sticker Book
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ================= 4. TAB: DAILY PARTS CHECK-IN QUIZ ================= */}
            {activeTab === 'quiz' && (
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-blue-100 text-blue-800 rounded-full border-2 border-blue-300 mb-3">
                    <Activity className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-[#4a3728]">Daily Parts Check-in</h2>
                  <p className="text-xs text-[#8c7e70] max-w-md mt-1">
                    A gentle diagnostic journey to find out which parts of you are most active right now, helping you offer them compassion.
                  </p>
                </div>

                <div className="bg-[#fffefb] border-4 border-[#3d2a1c] rounded-[32px] p-6 shadow-xl w-full min-h-[340px] flex flex-col justify-between">
                  {!quizResult ? (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Progress bar */}
                      <div className="flex justify-between items-center text-[10px] font-black text-[#9d8975] uppercase tracking-wider mb-2">
                        <span>Question {quizIndex + 1} of {quizQuestions.length}</span>
                        <span>{Math.round(((quizIndex) / quizQuestions.length) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-5 border border-neutral-200">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>

                      {/* Question */}
                      <h3 className="text-sm font-bold text-[#4a3728] font-serif leading-relaxed mb-4">
                        {quizQuestions[quizIndex].question}
                      </h3>

                      {/* Options */}
                      <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                        {quizQuestions[quizIndex].options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(opt.score)}
                            className="w-full text-left text-xs bg-white hover:bg-blue-50/20 border-2 border-[#d9ccb9] hover:border-blue-500 rounded-2xl p-4 transition-all cursor-pointer font-semibold hover:scale-99 shadow-sm"
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Recommendation Card
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="text-xs font-black text-blue-500 uppercase tracking-widest">
                        Your Check-in Recommendation
                      </div>

                      {(() => {
                        const recommendChar = allCharacters.find(c => c.id === quizResult);
                        if (!recommendChar) return null;
                        
                        return (
                          <div className="space-y-4 max-w-md mx-auto">
                            <div className="w-32 h-32 mx-auto bg-white border-4 border-blue-300 rounded-full p-2.5 shadow-lg relative group hover:scale-105 transition-transform duration-300">
                              {recommendChar.renderSticker({ className: 'w-full h-full', isUnburdened: unburdenedParts.includes(recommendChar.id) })}
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-black px-3.5 py-1 rounded-full whitespace-nowrap shadow-md">
                                {recommendChar.role.toUpperCase()} RECOMMENDED
                              </div>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-[#4a3728] font-serif">{recommendChar.name}</h3>
                              <p className="text-xs text-[#786c5f] italic mt-0.5">"{recommendChar.motto}"</p>
                            </div>

                            <p className="text-xs text-[#5c4e40] leading-relaxed p-4 bg-blue-50/50 border-2 border-blue-200 rounded-2xl font-semibold shadow-sm">
                              {quizFeedback}
                            </p>

                            <div className="flex gap-2 w-full">
                              <button
                                onClick={resetQuiz}
                                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black py-3 px-4 rounded-2xl transition-colors cursor-pointer"
                              >
                                Retake Check-in
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCharacterId(recommendChar.id);
                                  setActiveTab('album');
                                  resetQuiz();
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 px-4 rounded-2xl transition-colors shadow-md cursor-pointer"
                              >
                                Greet Part in Book
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ================= 5. TAB: STICKER CUSTOMIZER ================= */}
            {activeTab === 'customizer' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
                
                {/* Left Side: Real-time Sticker Preview */}
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#fffef9] border-3 border-[#3d2a1c] rounded-2xl p-6 shadow-md relative">
                  {/* Decorative tape */}
                  <div className="absolute top-[-10px] left-12 w-24 h-6 bg-pink-100/50 border-x border-[#3d2a1c]/20 transform -rotate-2 select-none pointer-events-none"></div>

                  <span className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest mb-3">Live Sticker Preview</span>
                  
                  <div className="w-56 h-56 bg-neutral-50/50 border-3 border-dashed border-neutral-300 rounded-[32px] p-4 flex items-center justify-center relative shadow-inner">
                    <CustomSticker
                      species={customSpecies}
                      expression={customExpression}
                      accessory={customAccessory}
                      primaryColor={colorThemes[customColorTheme as keyof typeof colorThemes].primary}
                      secondaryColor={colorThemes[customColorTheme as keyof typeof colorThemes].secondary}
                      accentColor={colorThemes[customColorTheme as keyof typeof colorThemes].accent}
                      name={customName || 'My Part'}
                      className="w-full h-full"
                    />
                    
                    <span className="absolute bottom-4 bg-[#fff] border-2 border-[#3d2a1c] text-[#3d2a1c] text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                      {customRole.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 text-center">
                    <h4 className="text-base font-black text-[#4a3728]">
                      {customName || 'Unnamed Part'}
                    </h4>
                    <p className="text-xs text-[#8c7e70] italic mt-1 max-w-[220px]">
                      {customMotto ? `"${customMotto}"` : '"Choose options on the right to build your part..."'}
                    </p>
                  </div>
                </div>

                {/* Right Side: Form Controls */}
                <form onSubmit={handlePrintSticker} className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-serif flex items-center gap-2 mb-1.5 text-[#4a3728]">
                      <span>🎨</span> Sticker Printing Workshop
                    </h2>
                    <p className="text-xs text-[#8c7e70] border-b-2 border-[#f5ece0] pb-3 mb-4">
                      Map a personal part from your own life. Give them a name, role, color theme, and custom attributes.
                    </p>

                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                      
                      {/* Name & Role */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            Part Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="e.g., Doubter, Little Artist, Driver"
                            className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-3 focus:ring-purple-200 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            IFS Role Type
                          </label>
                          <select
                            value={customRole}
                            onChange={(e) => setCustomRole(e.target.value as any)}
                            className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-3 focus:ring-purple-200 font-semibold"
                          >
                            <option value="Manager">Manager (Proactive Protector)</option>
                            <option value="Firefighter">Firefighter (Reactive Protector)</option>
                            <option value="Exile">Exile (Vulnerable Part)</option>
                            <option value="Self">Self (Core Compassionate Presence)</option>
                          </select>
                        </div>
                      </div>

                      {/* Species & Expression */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            Sticker Species
                          </label>
                          <div className="grid grid-cols-5 gap-1">
                            {(['bunny', 'hamster', 'fox', 'ghost', 'star'] as CustomSpecies[]).map(sp => (
                              <button
                                type="button"
                                key={sp}
                                onClick={() => setCustomSpecies(sp)}
                                className={`py-2 px-0.5 rounded-xl border-2 text-[10px] font-black cursor-pointer transition-all ${
                                  customSpecies === sp ? 'bg-purple-100 border-[#3d2a1c] font-black shadow-sm scale-102' : 'bg-white border-[#d9ccb9] hover:bg-neutral-50'
                                }`}
                              >
                                {sp.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            Face Expression
                          </label>
                          <div className="grid grid-cols-5 gap-1">
                            {(['happy', 'worried', 'grumpy', 'crying', 'excited'] as CustomExpression[]).map(exp => (
                              <button
                                type="button"
                                key={exp}
                                onClick={() => setCustomExpression(exp)}
                                className={`py-2 px-0.5 rounded-xl border-2 text-[10px] font-black cursor-pointer transition-all ${
                                  customExpression === exp ? 'bg-purple-100 border-[#3d2a1c] font-black shadow-sm scale-102' : 'bg-white border-[#d9ccb9] hover:bg-neutral-50'
                                }`}
                              >
                                {exp.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Accessory & Color */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            Item / Accessory
                          </label>
                          <select
                            value={customAccessory}
                            onChange={(e) => setCustomAccessory(e.target.value as any)}
                            className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-3 focus:ring-purple-200 font-semibold"
                          >
                            <option value="none">None (Empty Paws)</option>
                            <option value="clipboard">📋 Clipboard (Manager checklists)</option>
                            <option value="cookies">🍪 Plate of Cookies (Pleasing treats)</option>
                            <option value="shield">🛡️ Shield & Sword (Angry fighting)</option>
                            <option value="blanket">🧣 Cozy Blanket (Soothing burrito)</option>
                            <option value="teddy">🧸 Teddy Bear (Clutching exile)</option>
                            <option value="lantern">🏮 Lantern (Glowing explorer)</option>
                            <option value="heart">💖 Glowing Heart (Compassion/Self)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            Color Theme (Pastel)
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {Object.keys(colorThemes).map(colKey => (
                              <button
                                type="button"
                                key={colKey}
                                onClick={() => setCustomColorTheme(colKey)}
                                className={`h-9 rounded-xl border-3 cursor-pointer transition-all ${
                                  customColorTheme === colKey ? 'border-[#3d2a1c] scale-98 shadow-md' : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: colorThemes[colKey as keyof typeof colorThemes].primary }}
                                title={colKey}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Motto & Burden Details */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                            Part Motto (Quotes / Sentiments)
                          </label>
                          <input
                            type="text"
                            value={customMotto}
                            onChange={(e) => setCustomMotto(e.target.value)}
                            placeholder="e.g., I have to make sure we survive! or Will they leave us?"
                            className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-3 focus:ring-purple-200 font-semibold"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                              Their Burden (What weighs them down?)
                            </label>
                            <input
                              type="text"
                              value={customBurdenText}
                              onChange={(e) => setCustomBurdenText(e.target.value)}
                              placeholder="e.g., The pressure to keep working."
                              className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-3 focus:ring-purple-200 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-[#9d8975] uppercase tracking-widest block mb-1.5">
                              Their Healed Gift (Their true essence)
                            </label>
                            <input
                              type="text"
                              value={customGiftText}
                              onChange={(e) => setCustomGiftText(e.target.value)}
                              placeholder="e.g., Creative focus, deep care."
                              className="w-full text-xs border-2 border-[#3d2a1c] bg-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-3 focus:ring-purple-200 font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Form Footer Action */}
                  <div className="border-t-2 border-[#f5ece0] pt-4 mt-4 flex items-center justify-between">
                    <p className="text-[10px] text-[#8c7e70] max-w-[320px] leading-normal font-medium">
                      * Stickers are stored locally in application memory. They can be placed on the Map and unburdened in the Altar!
                    </p>
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black py-3 px-6 rounded-2xl transition-all hover:scale-102 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" /> Print Custom Sticker
                    </button>
                  </div>
                </form>

              </div>
            )}

          </div>

        </div>
      </main>

      {/* --- FOOTER INFO --- */}
      <footer className="max-w-6xl w-full mx-auto mt-8 text-center text-[10px] text-[#8a725e] border-t border-[#3d2a1c]/20 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 z-10">
        <p className="font-medium">
          © 2026 Internal Family Sticker Journal. Crafted with love, respect, and deep appreciation for the healing work of Richard C. Schwartz & the IFS Model.
        </p>
        <div className="flex items-center gap-4 font-extrabold">
          <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-amber-500" /> Educational & Reflective Tool</span>
          <span>•</span>
          <span className="text-[#c8b29e]">Not a substitute for professional therapy.</span>
        </div>
      </footer>
    </div>
  );
}
