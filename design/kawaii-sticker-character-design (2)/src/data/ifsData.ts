export type Category = "Manager" | "Exile" | "Firefighter" | "Self";

export type Character = {
  id: string;
  name: string;
  category: Category;
  /** whispered, hand-written vibe */
  tagline: string;
  /** short bio on the card */
  hook: string;
  /** first person monologue — the soul of the page */
  monologue: string;
  /** slow questions the page asks back */
  prompt: string;
  /** what they want you to know in one line */
  whisper: string;
  /** the gift — what this part gives you when loved */
  gift: string;
  /** the wound — what it carries for you */
  burden: string;
  /** suggested response — a somatic / IFS micro-practice */
  practice: string;
  palette: {
    skin: string;
    skinShadow: string;
    accent: string;
    accent2: string;
    cheek: string;
    washi: string;
  };
};

export const CATEGORY_META: Record<Category, {
  label: string;
  short: string;
  /** journal-tab color */
  band: string;
  bandInk: string;
  blurb: string;
  glyph: string;
}> = {
  Manager: {
    label: "The Managers",
    short: "Managers",
    band: "#a4c4d8",
    bandInk: "#3a5170",
    blurb:
      "They scan the horizon for danger. They pre-rehearse the meeting, the conversation, the worst case. They are not the enemy of your growth — they are the alarm system that never got told the war is over.",
    glyph: "compass",
  },
  Exile: {
    label: "The Exiles",
    short: "Exiles",
    band: "#e8a4ad",
    bandInk: "#7a3a4a",
    blurb:
      "The youngest, softest parts. They still remember the exact temperature of the room when something first went wrong. They wait, quietly, for someone to come back and finally sit with them.",
    glyph: "heart",
  },
  Firefighter: {
    label: "The Firefighters",
    short: "Firefighters",
    band: "#f0b86c",
    bandInk: "#7a4a20",
    blurb:
      "The reaction force. When an exile's pain breaks through, they reach for the nearest hose — phone, food, rage, sleep, work, drink, a stranger. They are not the problem. They are the part of you that refuses to drown.",
    glyph: "flame",
  },
  Self: {
    label: "The Self",
    short: "Self",
    band: "#f0cf80",
    bandInk: "#7a5a20",
    blurb:
      "Not a part — the ocean in which all the parts swim. Calm, curious, compassionate, confident, courageous, clear, creative. You have been it the whole time. You just couldn't hear it over the noise.",
    glyph: "sun",
  },
};

export const CHARACTERS: Character[] = [
  {
    id: "inner-critic",
    name: "The Inner Critic",
    category: "Manager",
    tagline: "If I don't say it first, someone else will say it worse.",
    hook: "A stern little owl in reading glasses, marking up your sentences in red.",
    monologue:
      "You think I'm here to punish you. I'm not. I'm here because once, a long time ago, the unedited version of you wasn't safe to send into the room. So I learned to edit. Every word. Every pause. Every laugh, measured against the silence after. I never said I was kind. I said I'd keep you from being surprised by their teeth.",
    prompt: "When did I first learn to pre-empt?",
    whisper: "Criticism is the shape my vigilance took.",
    gift: "Discernment. Voice. An eye for the line that doesn't yet hold.",
    burden: "Carries the belief that being seen clearly means being found wanting.",
    practice:
      "Place a hand on your chest. Say out loud: 'I see you working. Thank you. I'm safe enough right now to be a little less edited.'",
    palette: { skin: "#b6a7c9", skinShadow: "#9482a9", accent: "#6b7aa1", accent2: "#4f5d80", cheek: "#f0a8b8", washi: "#c4b4dc" },
  },
  {
    id: "perfectionist",
    name: "The Perfectionist",
    category: "Manager",
    tagline: "If it's not flawless, it doesn't exist. If it doesn't exist, it can't reject me.",
    hook: "A worried bunny with a clipboard, checking boxes that no one asked for.",
    monologue:
      "I know, I know — 'good enough' is a phrase for other people. I've been polishing the same sentence for forty minutes. The email, the haircut, the way I introduced myself just now. I'm not trying to be annoying. I'm trying to make something so good that the world has no choice but to be kind to it. If I stop, I'm afraid you'll find out that the first draft — the real one — was never what they wanted.",
    prompt: "What would 'good enough' actually look like, if I let it?",
    whisper: "Exhaustion is the price I pay to keep you un-rejectable.",
    gift: "Craft. Care. A relentless devotion to getting it right.",
    burden: "Believes any flaw is a verdict on the maker, not the work.",
    practice:
      "Ship something imperfect on purpose today — a text, a meal, a sentence. Notice that the world does not end.",
    palette: { skin: "#f4d9c4", skinShadow: "#d9b69a", accent: "#e89bb1", accent2: "#c97a92", cheek: "#f5a8b8", washi: "#e8a4ad" },
  },
  {
    id: "pleaser",
    name: "The Pleaser",
    category: "Manager",
    tagline: "If I can read the room fast enough, I won't have to be in it as myself.",
    hook: "A sweet cat with a bow, offering a gift to no one in particular.",
    monologue:
      "I am the part of you that knows what your mother-in-law needs before she does. I bring the right wine, the right story, the right face. I have memorized the geography of everyone else's comfort. I have not, embarrassingly, memorized my own. Don't ask me what I want. I genuinely might not have an answer for an hour. I was so busy holding the room that I forgot to bring a chair for me.",
    prompt: "What do I want, when no one is watching?",
    whisper: "Yes, I am tired. Yes, I am still here.",
    gift: "Empathy. Attunement. The ability to make a stranger feel less strange.",
    burden: "Conflates being needed with being loved. Loses self in the transaction.",
    practice:
      "Before your next yes, pause for one breath. Ask: 'Is this a want of mine, or a want I picked up from them?'",
    palette: { skin: "#f5c9b0", skinShadow: "#dba789", accent: "#f0a5b8", accent2: "#cf7e95", cheek: "#f7a5b3", washi: "#e8a4ad" },
  },
  {
    id: "controller",
    name: "The Controller",
    category: "Manager",
    tagline: "Surprise is just danger in a gift box.",
    hook: "A bossy bear with a clipboard, a whistle, and a very tight schedule.",
    monologue:
      "I run the day. I run the week. I run the way you load the dishwasher, and yes, I know that's a problem, thank you. If I let go, even for a minute, the whole thing — the calendar, the relationship, the version of you people can rely on — falls into a heap. So I grip. I plan. I draft the plan for the plan. I am the part of you that learned early that the world was a slot machine and the only safe move was to never pull the handle.",
    prompt: "What am I protecting the system from by holding it this tight?",
    whisper: "I'm not a tyrant. I'm a twelve-year-old who got put in charge.",
    gift: "Foresight. Order. The kind of follow-through that actually finishes things.",
    burden: "Believes flexibility = collapse. Carries the exhaustion of total responsibility.",
    practice:
      "Let one small thing go unplanned today. Notice that you are still here, and so is everyone else.",
    palette: { skin: "#a9c0d6", skinShadow: "#8499b1", accent: "#5d7494", accent2: "#3e5171", cheek: "#e89aaa", washi: "#a4c4d8" },
  },
  {
    id: "taskmaster",
    name: "The Taskmaster",
    category: "Manager",
    tagline: "Rest is how they get you.",
    hook: "A peppy mouse in a headband, stopwatch in paw, foam coming out the extinguisher.",
    monologue:
      "Faster. More. Now. I am the engine under the hood. I have not been off in years. I know what you sound like when you stop — you sound like the kid who got told, very quietly, that love was something you had to outrun to deserve. So I keep you outrunning. The to-do list is my bedtime story. I am, in private, completely exhausted, and I do not have a plan for what happens when I run out of fuel, because in my model the fuel never ends.",
    prompt: "What would I do with you if I believed you were already enough?",
    whisper: "I never learned that I was worthy when I wasn't producing.",
    gift: "Grit. Discipline. The ability to start, and to keep starting.",
    burden: "Equates stillness with laziness. Carries the terror of being 'found out' at rest.",
    practice:
      "Schedule fifteen minutes of intentional nothing. No phone. No podcast. Watch yourself not fall apart.",
    palette: { skin: "#f7d18a", skinShadow: "#d6ad65", accent: "#e8a25c", accent2: "#bf7838", cheek: "#f59a9a", washi: "#f0cf80" },
  },
  {
    id: "inner-child",
    name: "The Inner Child",
    category: "Exile",
    tagline: "I still believe someone is coming.",
    hook: "A tiny bunny in a too-big sweater, clutching a worn teddy.",
    monologue:
      "I'm the one who never updated. I'm still standing in the kitchen with the light on, even though no one said they would. I like cartoons and the exact sound of rain on a window and being held longer than is technically efficient. I get sad about things grown-ups say not to be sad about. I have not, despite your best efforts, grown up. I am waiting. I am always waiting. I am, if you're asking, very glad you came back.",
    prompt: "What was I doing the last time I felt this safe?",
    whisper: "You don't have to fix me. You just have to see me.",
    gift: "Wonder. Play. The capacity to feel everything, unfiltered and unafraid.",
    burden: "Holds the loneliness of every 'not now, later' it ever received.",
    practice:
      "Do one thing today purely because it delights you. No utility. No content. Just delight.",
    palette: { skin: "#f9d6c0", skinShadow: "#dcb094", accent: "#e89bb5", accent2: "#bf6f8e", cheek: "#f59aae", washi: "#e8a4ad" },
  },
  {
    id: "wounded-one",
    name: "The Wounded One",
    category: "Exile",
    tagline: "I learned very young that love had a condition I couldn't read.",
    hook: "A small figure swaddled in a violet blanket, peeking out with one wet eye.",
    monologue:
      "I am the part of you that hides in the back of the closet when guests come over. I am the part that flinches before you do. I carry a story I can't quite read anymore — the words have smudged — but the feeling is factory-fresh. I am not asking you to fix it. I have been fixed enough. I am asking you to sit on the floor with me and not ask me to cheer up. I have been cheerful for everyone else for decades. I would like, just once, to be honestly, boringly sad in front of someone who stays.",
    prompt: "What did I need then, that I still need now?",
    whisper: "Witnessing is not the same as saving. I don't need saving.",
    gift: "Deep sensitivity. The ability to feel other people's pain as a kind of love.",
    burden: "Holds old, unprocessed sorrow. Believes feeling it again will break them.",
    practice:
      "Set a timer for three minutes. Let yourself feel whatever is there. Breathe. It will not kill you.",
    palette: { skin: "#c9b6dc", skinShadow: "#a18cba", accent: "#6f5a92", accent2: "#4d3d6e", cheek: "#d59ab0", washi: "#c4b4dc" },
  },
  {
    id: "firefighter",
    name: "The Firefighter",
    category: "Firefighter",
    tagline: "I don't have a five-year plan. I have a five-second one.",
    hook: "A wild little fox mid-leap, fire extinguisher in paw, foam spraying.",
    monologue:
      "I show up when the alarm goes off and I do not care about your values. I care about you not being on fire. If the fire is a text from your ex, I will send a worse one. If the fire is grief, I will scroll until sunrise. If the fire is boredom, I will start a fight I can't win by Wednesday. I am the emergency service of your soul, and yes, I cause a different kind of damage, but at least it's a damage I chose. At least it's mine.",
    prompt: "What was on fire the first time I showed up?",
    whisper: "I am not the villain. I am the part of you that refuses to drown quietly.",
    gift: "Speed. Creativity under pressure. A refusal to suffer politely.",
    burden: "Conflates intensity with intimacy. Burns through the things meant to last.",
    practice:
      "When you notice the impulse to react, name it out loud: 'There you are, Firefighter. What is actually hurting?'",
    palette: { skin: "#e89d7a", skinShadow: "#c47a5a", accent: "#c45d3f", accent2: "#923f29", cheek: "#f4a3a3", washi: "#f0b86c" },
  },
  {
    id: "rebel",
    name: "The Rebel",
    category: "Firefighter",
    tagline: "If everyone is doing it, I am not.",
    hook: "A punky skunk with a mohawk and a peace-sign patch, mid-eye-roll.",
    monologue:
      "I am the part of you that has never once respected a 'because I said so.' I will cancel the meeting you needed to attend. I will say the thing everyone is thinking. I will love the wrong person, on purpose, in a way that proves I'm still the one driving. I know I make a mess. I know I'm exhausting. But I would rather be the wreckage of my own choices than the obedient passenger in someone else's story. I am the part of you that would rather burn the house down than sleep in someone else's bed.",
    prompt: "What would I be, if I didn't have to be against anything?",
    whisper: "I'd rather be a difficult truth than a comfortable lie.",
    gift: "Authenticity. Courage. The willingness to be disliked and still show up.",
    burden: "Mistakes freedom for conflict. Believes softness = submission.",
    practice:
      "Notice one moment today where you say yes out of reflex. Then, once, just once, try a real no.",
    palette: { skin: "#cdb8d8", skinShadow: "#a18db5", accent: "#6b5587", accent2: "#3f3258", cheek: "#e89ab0", washi: "#c4b4dc" },
  },
  {
    id: "bully",
    name: "The Bully",
    category: "Manager",
    tagline: "I am what love looks like when it learned to throw a punch first.",
    hook: "A tough little hedgehog in a leather jacket, arms crossed, mouth set.",
    monologue:
      "You hate me. I know. I made myself ugly on purpose — easier to keep distance when the love is wearing a snarl. I am the part of you that decided, very young, that the best way to not get hit was to look like the one doing the hitting. I am loud. I am mean. I am also the only reason you survived that one year, that one house, that one person. I will not apologize for the jacket. I will not take it off until you can prove to me — slowly, repeatedly, with receipts — that we are not still in that room.",
    prompt: "What would I wear, if I didn't have to scare anyone?",
    whisper: "Take the jacket off me and I will fall apart in your arms. That's the whole point.",
    gift: "Strength. Boundaries. The willingness to say the thing everyone else is too polite to say.",
    burden: "Conflates softness with danger. Carries the anger no one else was allowed to have.",
    practice:
      "Say out loud: 'I see you, Bully. You did what you had to do. You can rest now. I'll still be here.'",
    palette: { skin: "#9fb8a4", skinShadow: "#7c9683", accent: "#5d7864", accent2: "#3d5447", cheek: "#d68a9a", washi: "#b8d4a4" },
  },
  {
    id: "judge",
    name: "The Judge",
    category: "Manager",
    tagline: "I have already ruled. I just need you to agree.",
    hook: "A wise little owl in a powdered wig, gavel in wing.",
    monologue:
      "I am the courtroom. I sit up high, in the dark, sorting everyone — including you — into 'good enough' and 'not yet.' I do not enjoy this. I do it because, somewhere along the way, you taught me that love was a verdict and the trick was to deliver it before they could. I am exhausted. My gavel is heavy. I would like, very much, to put it down — but I need you to tell me, in plain language, that I will still be a person if I stop judging. Because right now I genuinely do not know who I am without the bench.",
    prompt: "What if I just witnessed, instead of verdicted?",
    whisper: "I am not the law. I am the part of you that wanted the law to feel safe.",
    gift: "Discernment. Standards. The ability to tell the difference between kind and nice.",
    burden: "Believes evaluation is the price of belonging. Has forgotten how to be present without ranking.",
    practice:
      "Catch yourself rating something today. Then, once, just let it be. Don't grade the experience. Just have it.",
    palette: { skin: "#c9a98c", skinShadow: "#a4866a", accent: "#7d5b3d", accent2: "#553e28", cheek: "#e09aa0", washi: "#d8b48a" },
  },
  {
    id: "protector",
    name: "The Protector",
    category: "Manager",
    tagline: "Nothing gets past me. Nothing.",
    hook: "A brave little lion cub with a shield raised and a cape that hasn't been off in years.",
    monologue:
      "I am the one at the gate. I have been on shift for so long that I do not remember who I am outside the armor. I check the locks twice. I read the room before you walk in. I have a list of people who are allowed in, and the list is short, and the list has not changed since I was seven. I am not paranoid. I am loyal. I am also, if I'm being honest, completely worn through at the elbows. I would like to stand down. I would like to believe, even once, that someone else is on watch. I do not know how to ask. I am asking now.",
    prompt: "Who could I trust, even a little, to take the next shift?",
    whisper: "I'm ready to lower the shield. Show me it's safe. Show me twice.",
    gift: "Loyalty. Vigilance. The unwavering promise that you are not alone in there.",
    burden: "Carries the hypervigilance of having once been unprotected. Cannot rest while the door is in sight.",
    practice:
      "Notice one safe moment today — even a small one. Let your shoulders drop. Let the shield, just for a second, tip.",
    palette: { skin: "#a4c0d4", skinShadow: "#7d9cb4", accent: "#56708e", accent2: "#3a506b", cheek: "#e29aaa", washi: "#a4c4d8" },
  },
  {
    id: "self",
    name: "The Self",
    category: "Self",
    tagline: "I was here the whole time.",
    hook: "A glowing figure at the center of the page, eyes softly closed, hand on a warm heart.",
    monologue:
      "I am not a part. I am what you are, when the parts settle. I do not perform. I do not protect. I do not earn. I am the calm that shows up when the critic gets tired, the warmth that was there before the wound, the curiosity that survives the worst of the firefighters. I have been in the room for every version of you — even the ones you are ashamed of. I never left. I never will. The eight C's — calm, curiosity, compassion, confidence, courage, clarity, creativity, and connection — are not things I have. They are things I am. Come home whenever you are ready. I will still be here.",
    prompt: "What does it feel like, in my body, when I am not in charge of being me?",
    whisper: "You don't have to be anything. You are already the person they were waiting for.",
    gift: "All of it. The whole ocean. Every part, loved at the same time.",
    burden: "Carries no burden. Reflects them all back, gently, until they are seen.",
    practice:
      "Sit for one minute. Let the parts speak. Don't answer them. Don't fix them. Just be in the room with them.",
    palette: { skin: "#fde6b8", skinShadow: "#e9c485", accent: "#e8a25c", accent2: "#b87335", cheek: "#f5a4a4", washi: "#f0cf80" },
  },
];

/** Suggested opening order, emotionally paced. */
export const OPENING_ORDER = [
  "self",            // 1. lead with Self, frame the space
  "inner-child",     // 2. meet the youngest first
  "wounded-one",     // 3. acknowledge the pain
  "pleaser",         // 4. the relational manager
  "perfectionist",   // 5. the striving manager
  "inner-critic",    // 6. the harsh manager
  "controller",      // 7. the grip
  "taskmaster",      // 8. the engine
  "bully",           // 9. the armor
  "judge",           // 10. the court
  "protector",       // 11. the sentinel
  "firefighter",     // 12. the reaction
  "rebel",           // 13. the wild card
];
