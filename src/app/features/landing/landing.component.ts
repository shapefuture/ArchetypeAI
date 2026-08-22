/**
 * INNERVERSE · app-stage landing — complete revamp per "inner verse.html".
 *
 * Not a marketing page: a phone-stage app (430px column, screens + dock)
 * built from the reference's architecture — welcome / sky / codex / you —
 * with the real 18-part taxonomy (7 managers + 3 firefighters + 4 exiles
 * + 4 resources), the sticker characters, the ring-sky canvas, and the
 * chemistry lab. All existing parent wiring (outputs) is preserved.
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslationService } from '../../../services/translation.service';
import { InstallService } from '../../../services/install.service';
import { PART_COPY } from '../../core/data/part-copy';
import {
  EYE_KINDS,
  IV_PARTS,
  LOOK_COLORS,
  MOUTH_KINDS,
  SHAPES,
  SHAPE_IDS,
  deleteCustomPart,
  loadCustomParts,
  loadLooks,
  novaSvg,
  resetLook,
  saveCustomPart,
  saveLook,
  sticker,
  type CustomPart,
  type EyeKind,
  type FamKind,
  type IvPart,
  type MouthKind,
  type PartLook,
} from './stickers';

// ---------------------------------------------------------------- data

const P = Object.fromEntries(IV_PARTS.map((p) => [p.id, p])) as Record<string, IvPart>;

/** Resource face-lines — shadow parts read PART_COPY (§1.9). */
const RESOURCE_FACE: Record<string, [string, string]> = {
  sage: ['The quiet knowing that sees the whole field.', 'Тихое знание, которое видит всю картину.'],
  warrior: ['The clear no that protects what matters.', 'Ясное «нет», которое защищает важное.'],
  caregiver: ['The warm tending that asks nothing back.', 'Тепло, которое заботится и ничего не ждёт взамен.'],
  explorer: ['The curious reach toward the new.', 'Любопытный шаг навстречу новому.'],
};

/** One tiny practice per part (bilingual) — the sheet's closing card. */
const PRACTICE: Record<string, [string, string]> = {
  taskmaster: ['Schedule one deliberately useless hour — and survive it.', 'Запланируйте один нарочно бесполезный час — и переживите его.'],
  inner_critic: ['Ask it: “what are you protecting?” — then thank it and continue.', 'Спросите его: «что ты защищаешь?» — поблагодарите и продолжайте.'],
  pleaser: ['Say one honest “not really” this week — small, safe, real.', 'Скажите одно честное «на самом деле нет» на этой неделе — маленькое, безопасное, настоящее.'],
  controller: ['Let someone else drive once — and watch the world not end.', 'Позвольте кому-то другому вести — и убедитесь, что мир не рухнул.'],
  analyst: ['Name one feeling out loud without the word “because”.', 'Назовите одно чувство вслух — без слова «потому что».'],
  hermit: ['Send one “thinking of you” text. No occasion needed.', 'Отправьте одно «думаю о тебе» — без повода.'],
  bypasser: ['Let one bad moment be fully bad for sixty seconds.', 'Позвольте одному плохому моменту быть целиком плохим шестьдесят секунд.'],
  numb: ['Once a day ask: “if I did feel something — what would it be?”', 'Раз в день спрашивайте: «если бы я что-то чувствовал — что бы это было?»'],
  rebel: ['Choose one rule to follow — on purpose, as an experiment.', 'Выберите одно правило, чтобы соблюсти, — нарочно, как эксперимент.'],
  charmer: ['Tell one person something unpolished and true.', 'Расскажите одному человеку что-то неотшлифованное и правдивое.'],
  abandoned: ['Sit with one unanswered message for an hour. Notice the sky stays up.', 'Побудьте час с одним неотвеченным сообщением. Заметьте: небо не упало.'],
  ashamed: ['Show one person something you made before it was perfect.', 'Покажите одному человеку то, что вы сделали, ещё до совершенства.'],
  frightened: ['Take one small step past the exit map. Then come back — by choice.', 'Сделайте шаг за карту выходов. Потом вернитесь — по своему выбору.'],
  unseen: ['Say one true sentence in a group this week. Let it land.', 'Скажите одно правдивое предложение в группе на этой неделе. Дайте ему прозвучать.'],
  sage: ['Before a hard talk, ask the Sage: “what actually matters here?”', 'Перед трудным разговором спросите Мудреца: «что здесь по-настоящему важно?»'],
  warrior: ['Practice one warm no: “Not this time — and I do like you.”', 'Потренируйте тёплое «нет»: «Не в этот раз — и ты мне правда нравишься».'],
  caregiver: ['Give yourself one hour of your own best care this week.', 'Подарите себе час собственной лучшей заботы на этой неделе.'],
  explorer: ['Finish one small boring thing — purely to feel the other muscle.', 'Доведите до конца одну маленькую скучную вещь — просто чтобы почувствовать другую мышцу.'],
};

/** Named pair dynamics (bilingual) — the chemistry lab's signature reactions. */
const DUOS: Record<string, { t: [string, string]; n: [string, string] }> = {
  'rebel|taskmaster': {
    t: ['The Deadline Heist', 'Ограбление дедлайна'],
    n: ['The Taskmaster writes the schedule; the Rebel sells the schedule’s furniture. Productive sabotage — unless the Rebel gets one owned block of beautiful anarchy per week.', 'Деятель составляет расписание; Бунтарь продаёт его мебель. Продуктивный саботаж — если только Бунтарь не получит один принадлежащий только ему блок прекрасной анархии в неделю.'],
  },
  'abandoned|hermit': {
    t: ['Asymmetric Orbit', 'Асимметричная орбита'],
    n: ['One invests intensely; the other holds loosely. The imbalance is structural, not personal. Named early, it becomes rhythm; unnamed, it becomes the Ghosting Loop.', 'Один вкладывается сильно; другой держится свободно. Дисбаланс структурный, а не личный. Названный рано, он становится ритмом; неназванный — петлёй исчезновений.'],
  },
  'charmer|unseen': {
    t: ['Stage Light, Backstage Shadow', 'Свет рампы, тень за кулисами'],
    n: ['The Charmer performs the person the Unseen One is sure no one wants. Encore after encore, the audience applauds someone who isn’t there.', 'Обаяшка играет человека, которым Незамеченный уверен, что никто не заинтересуется. Бис за бисом — зал аплодирует тому, кого здесь нет.'],
  },
  'inner_critic|sage': {
    t: ['The Auditor and the Oracle', 'Аудитор и оракул'],
    n: ['The Critic grades the exam; the Sage already knows it doesn’t count. When both are loud, address the Critic first — it’s the one who’s scared.', 'Критик проверяет экзамен; Мудрец уже знает, что его не засчитают. Когда громкие оба — сначала к Критику: именно ему страшно.'],
  },
  'pleaser|warrior': {
    t: ['The Velvet Fence', 'Бархатный забор'],
    n: ['Warmth with a spine. When these two align you get the rarest social physics: kindness that doesn’t invoice anyone — including you.', 'Тепло с хребтом. Когда эти двое в согласии, рождается редчайшая социальная физика: доброта, не выставляющая счёт никому — включая вас.'],
  },
  'controller|explorer': {
    t: ['The Map and the Wind', 'Карта и ветер'],
    n: ['One charts; one sails off the chart. As a team they go further than either dares alone — as rivals they produce itineraries for trips that never happen.', 'Один чертит карту; второй уплывает за её край. В команде они заходят дальше, чем каждый осмелился бы один; как соперники — рисуют маршруты путешествий, которые не случатся.'],
  },
  'abandoned|numb': {
    t: ['Signal in the Fog', 'Сигнал в тумане'],
    n: ['The Numb turns the volume down exactly where the Abandoned One broadcasts. The channel deserves one low-volume broadcast a day.', 'Онемение убавляет громкость ровно там, откуда вещает Брошенный. Этому каналу нужен один негромкий эфир в день.'],
  },
  'analyst|frightened': {
    t: ['The Threat Model', 'Модель угрозы'],
    n: ['The Analyst gives the Frightened One something unprecedented: threat data instead of threat. Panic slows when it becomes a spreadsheet.', 'Аналитик даёт Напуганному нечто беспрецедентное: данные об угрозе вместо самой угрозы. Паника замедляется, становясь таблицей.'],
  },
  'caregiver|numb': {
    t: ['The Lighthouse Effect', 'Эффект маяка'],
    n: ['Light for everyone else, fog for itself. The Caregiver refills others while the Numb mutes its own gauge. Wells need gauges.', 'Свет всем остальным, туман — себе. Заботник наполняет других, пока Онемение глушит его собственный датчик. Колодцам нужны датчики.'],
  },
  'inner_critic|warrior': {
    t: ['The Drill Sergeant', 'Сержант-инструктор'],
    n: ['Both cut clean — one inward, one outward. Pointed outward together they defend standards; pointed inward they defend nothing and charge rent.', 'Оба режут чисто — один внутрь, другой наружу. Вместе наружу они защищают стандарты; внутрь — не защищают ничего и берут плату за аренду.'],
  },
  'caregiver|taskmaster': {
    t: ['Compassion Logistics', 'Логистика сострадания'],
    n: ['The Taskmaster industrializes the Caregiver’s warmth: meals planned, crises calendared. Watch the tank — this duo volunteers for everything.', 'Деятель превращает тепло Заботника в производство: еда спланирована, кризисы в календаре. Следите за баком — эта пара записывается добровольцами на всё.'],
  },
  'ashamed|bypasser': {
    t: ['The Quick Paint Job', 'Косметический ремонт'],
    n: ['The Bypasser paints over what the Ashamed One is hiding — both convinced the inspection is coming. One uncovered corner, shown to one safe person, breaks the loop.', 'Обходчик закрашивает то, что прячет Стыдящийся, — оба уверены: скоро проверка. Один открытый угол, показанный одному безопасному человеку, разрывает петлю.'],
  },
  'controller|rebel': {
    t: ['Catalyst Collision', 'Столкновение катализаторов'],
    n: ['Two high-agency vectors, opposite headings. Brilliant for starting revolutions. Catastrophic for group projects. Assign separate theaters of war.', 'Два мощных вектора, противоположные курсы. Блестяще для начала революций. Катастрофично для групповых проектов. Разведите их по разным театрам военных действий.'],
  },
  'explorer|hermit': {
    t: ['The Weekend Cartographer', 'Картограф выходного дня'],
    n: ['Far horizons, deep caves — both authentic, mutually exclusive on Tuesdays. This pair thrives on explicit seasons: explore hard, then guard the cave without apology.', 'Далёкие горизонты, глубокие пещеры — оба подлинные, но несовместимые по вторникам. Эта пара живёт сезонами: исследовать на полную, потом охранять пещеру без извинений.'],
  },
};

const FAM: Record<FamKind, { em: string; hex: string; n: [string, string]; line: [string, string] }> = {
  manager: { em: '📋', hex: '#E1734B', n: ['Manager', 'Менеджер'], line: ['The ones who keep tomorrow safe.', 'Те, кто сохраняет завтрашний день безопасным.'] },
  firefighter: { em: '🧯', hex: '#E58FA0', n: ['Firefighter', 'Пожарный'], line: ['The ones who arrive when it burns.', 'Те, кто прибегает, когда горит.'] },
  exile: { em: '🫧', hex: '#8F63C0', n: ['Exile', 'Изгнанник'], line: ['The young ones who hold the hurt.', 'Молодые, которые несут боль.'] },
  resource: { em: '🌿', hex: '#46A29D', n: ['Resource', 'Ресурс'], line: ['The ones the Self can lean on.', 'Те, на кого может опереться Self.'] },
};

/** Manager→exile guard links drawn on the sky map. */
const GUARD_LINKS: [string, string][] = [
  ['pleaser', 'abandoned'],
  ['inner_critic', 'ashamed'],
  ['controller', 'frightened'],
  ['analyst', 'unseen'],
];

const RINGS: Record<FamKind, number> = { exile: 0.34, firefighter: 0.52, manager: 0.72, resource: 0.9 };
const SPEEDS: Record<FamKind, number> = { exile: 0.00016, firefighter: -0.00011, manager: 0.00007, resource: -0.00005 };
const BASE_ANGLE: Record<FamKind, number> = { exile: 0.6, firefighter: 2.2, manager: 0, resource: 1.1 };

interface SkyStar {
  p: IvPart;
  fam: FamKind;
  base: number;
  r: number;
  tw: number;
  sx: number;
  sy: number;
}

interface ChemOut {
  flow: number;
  spark: number;
  drag: number;
  verdict: [string, string];
  note: [string, string];
  lens: [string, string][];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnDestroy {
  readonly ts = inject(TranslationService);
  readonly installService = inject(InstallService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly user = input<User | null>(null);

  // Outputs — parent wiring preserved verbatim from the previous landing.
  readonly startTest = output<void>();
  readonly quickScanRequested = output<void>();
  readonly therapistRequested = output<void>();
  readonly reportRequested = output<void>();
  readonly checkinRequested = output<void>();
  readonly practiceRequested = output<void>();
  readonly synastryRequested = output<void>();
  readonly exploreUniverse = output<void>();
  readonly langToggle = output<void>();
  readonly backupUpload = output<Event>();
  readonly loginRequested = output<void>();
  readonly dashboardRequested = output<void>();
  readonly logoutRequested = output<void>();
  readonly coachRequested = output<void>();
  readonly subscribeRequested = output<void>();

  // --- app router ---
  readonly screen = signal<'welcome' | 'sky' | 'codex' | 'you'>('welcome');
  readonly codexTab = signal<'parts' | 'chem'>('parts');
  /** Codex family filter ('' = all) — driven by the crest chips. */
  readonly codexFam = signal<FamKind | ''>('');
  /** Codex grid rosters, filtered by the active crest. */
  readonly codexBuilt = computed(() => {
    const fam = this.codexFam();
    return fam ? this.parts.filter(p => p.fam === fam) : this.parts;
  });
  readonly codexCustom = computed(() => {
    const fam = this.codexFam();
    return fam ? this.customParts().filter(c => c.fam === fam) : this.customParts();
  });
  readonly sheetPart = signal<string | null>(null);
  readonly famFilter = signal<FamKind | ''>('');
  readonly dark = signal(false);
  readonly mxA = signal<string | null>(null);
  readonly mxB = signal<string | null>(null);
  readonly chemOut = signal<ChemOut | null>(null);

  // --- customization (look overrides + custom parts, persisted locally) ---
  readonly looks = signal<Record<string, PartLook>>(loadLooks());
  readonly customParts = signal<CustomPart[]>(loadCustomParts());
  readonly shapeIds = SHAPE_IDS;
  readonly eyeKinds = EYE_KINDS;
  readonly mouthKinds = MOUTH_KINDS;
  readonly lookColors = LOOK_COLORS;

  /** Draft state for the look/custom-part editor sheet (null = closed). */
  readonly editId = signal<string | null>(null); // part id or 'new'
  readonly draftShape = signal('');
  readonly draftColor = signal('');
  readonly draftEye = signal('');
  readonly draftMouth = signal('');
  readonly draftNameEn = signal('');
  readonly draftNameRu = signal('');
  readonly draftFam = signal<FamKind>('resource');

  // --- resume-in-progress (regression-guarded by landing.component.spec) ---
  readonly hasCompletedBackup = signal(false);
  readonly hasInProgressBackup = signal(false);
  readonly answeredCount = signal(0);
  readonly totalQuestions = 147;

  readonly parts = IV_PARTS;
  readonly guardLinks = GUARD_LINKS;
  readonly famKeys: FamKind[] = ['manager', 'firefighter', 'exile', 'resource'];
  readonly welcomeSatellites: { id: string; left: string; top: string; delay: string }[] = [
    { id: 'taskmaster', left: '8%', top: '26%', delay: '.9s' },
    { id: 'rebel', left: '74%', top: '20%', delay: '1.3s' },
    { id: 'abandoned', left: '12%', top: '68%', delay: '1.7s' },
    { id: 'sage', left: '76%', top: '64%', delay: '.5s' },
  ];

  readonly skyCanvas = viewChild<ElementRef<HTMLCanvasElement>>('skyCanvas');
  readonly backupFileInput = viewChild<ElementRef<HTMLInputElement>>('backupFileInput');

  readonly isLoggedIn = computed(() => {
    const u = this.user();
    return !!u && !u.isAnonymous;
  });
  readonly isEnglish = computed(() => this.ts.getLanguage() === 'en');
  readonly chemReady = computed(() => !!this.mxA() && !!this.mxB());

  private readonly svgCache = new Map<string, SafeHtml>();
  private readonly sky = {
    raf: 0,
    running: false,
    stars: [] as SkyStar[],
    w: 0,
    h: 0,
    cx: 0,
    cy: 0,
    R: 0,
    ctx: null as CanvasRenderingContext2D | null,
  };
  private readonly onResize = () => {
    if (this.sky.running) this.startSky();
  };

  constructor() {
    effect(() => {
      if (this.screen() === 'sky') this.startSky();
      else this.stopSky();
    });

    afterNextRender(() => {
      this.checkLocalBackup();
      this.checkInProgressBackup();
      window.addEventListener('resize', this.onResize);
    });
  }

  ngOnDestroy(): void {
    this.stopSky();
    window.removeEventListener('resize', this.onResize);
  }

  t(key: string): string {
    return this.ts.t(key, 'landing');
  }

  /** Bilingual tuple → current language. */
  L(x: [string, string]): string {
    return x[this.isEnglish() ? 0 : 1];
  }

  fam(id: string) {
    const c = this.customPart(id);
    if (c) return FAM[c.fam as FamKind] ?? FAM.resource;
    return FAM[P[id].fam];
  }

  /** Family meta by family key (not part id) — for the codex crest row. */
  famMeta(key: FamKind) {
    return FAM[key];
  }

  // --- svg (trusted, cached; cache key includes the current look override) ---
  /** Effective look for a built-in part: override ?? part defaults. */
  lookFor(id: string): PartLook {
    const p = P[id];
    const o = this.looks()[id];
    if (o) return o;
    return { shape: p.shape, color: p.color, eye: p.glyph.e, mouth: p.glyph.m };
  }

  stickerHtml(id: string): SafeHtml {
    const p = P[id];
    if (!p) return this.customStickerHtml(id);
    const look = this.lookFor(id);
    const key = `p:${id}:${look.shape}|${look.color}|${look.eye}|${look.mouth}`;
    let v = this.svgCache.get(key);
    if (!v) {
      v = this.sanitizer.bypassSecurityTrustHtml(
        sticker({
          name: this.L(p.name),
          shape: look.shape,
          color: look.color,
          glyph: { e: look.eye as EyeKind, m: look.mouth as MouthKind },
        }),
      );
      this.svgCache.set(key, v);
    }
    return v;
  }

  customPart(id: string): CustomPart | undefined {
    return this.customParts().find((c) => c.id === id);
  }

  isCustom(id: string): boolean {
    return !!this.customPart(id);
  }

  customStickerHtml(id: string): SafeHtml {
    const c = this.customPart(id);
    if (!c) return '';
    return this.miniSticker(c.look.shape, c.look.color, c.look.eye, c.look.mouth, this.L(c.name));
  }

  /** Small helper for preview/shape-carousel stickers (trusted, cached). */
  miniSticker(shape: string, color: string, eye: string, mouth: string, name: string): SafeHtml {
    const key = `m:${shape}|${color}|${eye}|${mouth}`;
    let v = this.svgCache.get(key);
    if (!v) {
      v = this.sanitizer.bypassSecurityTrustHtml(
        sticker({ name, shape, color, glyph: { e: eye as EyeKind, m: mouth as MouthKind } }),
      );
      this.svgCache.set(key, v);
    }
    return v;
  }

  customName(id: string): string {
    return this.L(this.customPart(id)?.name ?? ['', '']);
  }

  novaHtml(): SafeHtml {
    let v = this.svgCache.get('nova');
    if (!v) {
      v = this.sanitizer.bypassSecurityTrustHtml(novaSvg());
      this.svgCache.set('nova', v);
    }
    return v;
  }

  partName(id: string): string {
    return P[id] ? this.L(P[id].name) : this.customName(id);
  }

  /** PART_COPY layer for a shadow part (resources fall back to ''). */
  private partCopyLayer(id: string, layer: 'face' | 'need' | 'shadow' | 'superpower'): string {
    const table = PART_COPY[this.isEnglish() ? 'en' : 'ru'] as unknown as
      Record<string, Partial<Record<'face' | 'need' | 'shadow' | 'superpower', string>>>;
    return table[id]?.[layer] ?? '';
  }

  /** The sheet's poem line: shadow parts read PART_COPY face; resources have their own. */
  partFace(id: string): string {
    const face = this.partCopyLayer(id, 'face');
    return face || this.L(RESOURCE_FACE[id] ?? ['', '']);
  }

  partNeed(id: string): string {
    return this.partCopyLayer(id, 'need');
  }

  partShadow(id: string): string {
    return this.partCopyLayer(id, 'shadow');
  }

  partSuperpower(id: string): string {
    return this.partCopyLayer(id, 'superpower');
  }

  partPractice(id: string): string {
    return this.L(PRACTICE[id] ?? ['', '']);
  }

  axes(id: string): { key: string; label: string; v: number }[] {
    const ax = P[id]?.ax ?? { ag: 0, te: 0, fo: 0, at: 0 };
    const labels: Record<string, [string, string]> = {
      ag: ['Agency', 'Драйв'],
      te: ['Heat', 'Накал'],
      fo: ['Focus', 'Фокус'],
      at: ['Attachment', 'Привязанность'],
    };
    return (['ag', 'te', 'fo', 'at'] as const).map((k) => ({
      key: k,
      label: this.L(labels[k]),
      v: ax[k],
    }));
  }

  // --- navigation ---
  go(id: 'welcome' | 'sky' | 'codex' | 'you'): void {
    this.screen.set(id);
  }

  openPart(id: string): void {
    this.sheetPart.set(id);
  }

  // --- look / custom-part editor ---
  openEditor(id: string): void {
    if (id === 'new') {
      this.editId.set('new');
      this.draftShape.set(SHAPE_IDS[0]);
      this.draftColor.set(LOOK_COLORS[0]);
      this.draftEye.set('dot');
      this.draftMouth.set('smile');
      this.draftNameEn.set('');
      this.draftNameRu.set('');
      this.draftFam.set('resource');
      return;
    }
    this.editId.set(id);
    const custom = this.customPart(id);
    if (custom) {
      this.draftShape.set(custom.look.shape);
      this.draftColor.set(custom.look.color);
      this.draftEye.set(custom.look.eye);
      this.draftMouth.set(custom.look.mouth);
      this.draftNameEn.set(custom.name[0]);
      this.draftNameRu.set(custom.name[1]);
      this.draftFam.set(custom.fam as FamKind);
    } else {
      const look = this.lookFor(id);
      this.draftShape.set(look.shape);
      this.draftColor.set(look.color);
      this.draftEye.set(look.eye);
      this.draftMouth.set(look.mouth);
    }
  }

  closeEditor(): void {
    this.editId.set(null);
  }

  draftLook(): PartLook {
    return { shape: this.draftShape(), color: this.draftColor(), eye: this.draftEye(), mouth: this.draftMouth() };
  }

  saveEditor(): void {
    const id = this.editId();
    if (!id) return;
    if (id === 'new') {
      const en = this.draftNameEn().trim() || 'My part';
      const ru = this.draftNameRu().trim() || 'Моя часть';
      this.customParts.set(
        saveCustomPart({
          id: 'custom_' + Date.now().toString(36),
          name: [en, ru],
          look: this.draftLook(),
          fam: this.draftFam(),
        }),
      );
    } else if (this.isCustom(id)) {
      const c = this.customPart(id)!;
      this.customParts.set(
        saveCustomPart({ ...c, name: [this.draftNameEn().trim() || c.name[0], this.draftNameRu().trim() || c.name[1]], look: this.draftLook(), fam: this.draftFam() }),
      );
    } else {
      const p = P[id];
      const d = this.draftLook();
      const isDefault = d.shape === p.shape && d.color === p.color && d.eye === p.glyph.e && d.mouth === p.glyph.m;
      this.looks.set(isDefault ? resetLook(id) : saveLook(id, d));
    }
    this.closeEditor();
    if (this.sky.running) this.startSky(); // repaint stars with the new looks
  }

  resetEditor(): void {
    const id = this.editId();
    if (!id || id === 'new' || this.isCustom(id)) {
      this.openEditor(id ?? 'new');
      return;
    }
    const p = P[id];
    this.looks.set(resetLook(id));
    this.draftShape.set(p.shape);
    this.draftColor.set(p.color);
    this.draftEye.set(p.glyph.e);
    this.draftMouth.set(p.glyph.m);
    if (this.sky.running) this.startSky();
  }

  deleteEditorPart(): void {
    const id = this.editId();
    if (id && id !== 'new' && this.isCustom(id)) {
      this.customParts.set(deleteCustomPart(id));
      if (this.sheetPart() === id) this.closeSheet();
    } else if (id && id !== 'new') {
      this.looks.set(resetLook(id));
    }
    this.closeEditor();
    if (this.sky.running) this.startSky();
  }

  closeSheet(): void {
    this.sheetPart.set(null);
  }

  openChemFromSheet(id: string): void {
    this.closeSheet();
    this.codexTab.set('chem');
    if (this.mxA() !== id) {
      this.mxB.set(null);
      this.mxA.set(id);
    }
    this.go('codex');
  }

  // --- chemistry ---
  pickChem(id: string): void {
    this.chemOut.set(null);
    if (this.mxA() === id) this.mxA.set(null);
    else if (this.mxB() === id) this.mxB.set(null);
    else if (!this.mxA()) this.mxA.set(id);
    else if (!this.mxB()) this.mxB.set(id);
    else {
      this.mxA.set(this.mxB());
      this.mxB.set(id);
    }
  }

  runChem(): void {
    const a = this.mxA();
    const b = this.mxB();
    if (!a || !b) return;
    this.chemOut.set(this.chemCalc(a, b));
  }

  private chemCalc(aId: string, bId: string): ChemOut {
    const a = P[aId];
    const b = P[bId];
    const d = {
      ag: Math.abs(a.ax.ag - b.ax.ag),
      te: Math.abs(a.ax.te - b.ax.te),
      fo: Math.abs(a.ax.fo - b.ax.fo),
      at: Math.abs(a.ax.at - b.ax.at),
    };
    const dist = Math.sqrt(d.ag * d.ag + d.te * d.te + d.fo * d.fo + d.at * d.at) / 200;
    const flow = Math.round(Math.min(97, Math.max(8, 100 - dist * 58)));
    const spark = Math.round(Math.min(98, (a.ax.ag + b.ax.ag) / 2 * 0.5 + (a.ax.te + b.ax.te) / 2 * 0.5));
    const drag = Math.round(Math.min(95, d.at * 0.55 + d.ag * 0.45));
    const duo = DUOS[[aId, bId].sort().join('|')];

    let verdict: [string, string];
    let note: [string, string];
    if (duo) {
      verdict = duo.t;
      note = duo.n;
    } else if (flow >= 78) {
      verdict = ['Sweet Orbit', 'Сладкая орбита'];
      note = [
        'Low drag, matched tempo. These two run nearly the same physics — the risk isn’t friction, it’s an echo chamber: nobody aboard flags the icebergs.',
        'Малое трение, совпадающий темп. Эти двое работают почти на одной физике — риск не в трении, а в эхо-камере: никто на борту не замечает айсберги.',
      ];
    } else if (flow >= 60) {
      verdict = ['Working Gravity', 'Рабочая гравитация'];
      note = [
        'Different masses, stable dance. Occasional wobble is the system correcting, not failing. Give them clear lanes and they compound.',
        'Разные массы, стабильный танец. Лёгкое покачивание — это коррекция системы, а не сбой. Дайте им свои полосы — и они усилят друг друга.',
      ];
    } else if (flow >= 45) {
      verdict = ['Dynamic Friction', 'Динамическое трение'];
      note = [
        'Real tension, real torque. This pairing gets things moving that comfortable pairs never touch — but it burns fuel. Schedule recovery on purpose.',
        'Настоящее напряжение, настоящий момент силы. Эта пара сдвигает то, до чего уютным парам дело не доходит, — но она жжёт топливо. Планируйте восстановление заранее.',
      ];
    } else {
      verdict = ['Collision Course', 'Курс столкновения'];
      note = [
        'Opposite vectors at high stakes. Brilliant in short bursts; catastrophic unsupervised. Never let these two co-sign the same plan without a third part in the room.',
        'Противоположные вектора на высоких ставках. Блестяще короткими рывками; катастрофично без присмотра. Не позволяйте этим двоим подписывать один план без третьей части в комнате.',
      ];
    }

    const lensTpl: Record<string, [string, string]> = {
      ag: ['Agency gap {n} — one drives, one drifts', 'Разрыв драйва {n} — один ведёт, другой дрейфует'],
      te: ['Temperature gap {n} — different burn rates', 'Разрыв темпа {n} — разная скорость горения'],
      fo: ['Focus gap {n} — telescopes pointed elsewhere', 'Разрыв фокуса {n} — телескопы смотрят в стороны'],
      at: ['Attachment gap {n} — one anchors, one wanders', 'Разрыв привязанности {n} — один якорь, другой странник'],
    };
    const lens: [string, string][] = [];
    if (d.ag >= 30) lens.push(lensTpl.ag);
    if (d.te >= 30) lens.push(lensTpl.te);
    if (d.fo >= 30) lens.push(lensTpl.fo);
    if (d.at >= 30) lens.push(lensTpl.at);
    if (!lens.length) lens.push(['All four axes closely matched', 'Все четыре оси близко совпадают']);
    const withNums = lens.map(([en, ru]) => [en, ru] as [string, string]);

    return { flow, spark, drag, verdict, note, lens: withNums };
  }

  lensText(pair: [string, string], gapKind: 'ag' | 'te' | 'fo' | 'at' | ''): string {
    if (!gapKind) return this.L(pair);
    const a = P[this.mxA()!];
    const b = P[this.mxB()!];
    const d = Math.abs(a.ax[gapKind] - b.ax[gapKind]);
    return this.L(pair).replace('{n}', String(d));
  }

  // --- theme ---
  toggleTheme(): void {
    const next = !this.dark();
    this.dark.set(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next ? '#181432' : '#F3EAD4');
    if (this.sky.running) this.startSky(); // repaint with the new palette
  }

  // --- share ---
  async shareApp(): Promise<void> {
    const text = this.isEnglish()
      ? 'Innerverse ✦ meet everyone you are. 18 inner parts, one sky — measured, not guessed.'
      : 'Innerverse ✦ познакомьтесь со всеми, кто вы есть. 18 внутренних частей, одно небо — измерено, а не наугад.';
    const url = typeof location !== 'undefined' ? location.href.split('#')[0] : undefined;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Innerverse', text, url });
        return;
      }
      await navigator.clipboard.writeText(text + ' ' + (url ?? ''));
      alert(this.t('shareCopied'));
    } catch {
      /* user cancelled or unavailable */
    }
  }

  onBackupUpload(event: Event): void {
    this.backupUpload.emit(event);
    const input = this.backupFileInput();
    if (input) input.nativeElement.value = '';
  }

  // --- backups (resume-in-progress regression guards depend on these) ---
  private checkLocalBackup(): void {
    try {
      const backup = localStorage.getItem('ARCHETYPE_COMPLETED_BACKUP');
      if (backup) this.hasCompletedBackup.set(true);
    } catch {
      // storage unavailable
    }
  }

  /**
   * Detects an in-progress assessment: any non-zero answers in
   * ARCHETYPE_ASSESSMENT_RESPONSES. The assessment panel auto-saves every
   * answer to this key, so a half-finished battery is recoverable after a
   * reload — surfaced as the "Resume · X of 147" card on the welcome screen.
   */
  private checkInProgressBackup(): void {
    try {
      const raw = localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES');
      if (!raw) return;
      const responses = JSON.parse(raw);
      if (!Array.isArray(responses)) return;
      const answered = responses.filter((r: unknown) => typeof r === 'number' && r !== 0).length;
      if (answered > 0) {
        this.hasInProgressBackup.set(true);
        this.answeredCount.set(answered);
      }
    } catch {
      // storage unavailable
    }
  }

  // --- sky canvas (ported from the reference renderer) ---
  private startSky(): void {
    const el = this.skyCanvas()?.nativeElement;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.sky.w = rect.width;
    this.sky.h = rect.height;
    el.width = rect.width * dpr;
    el.height = rect.height * dpr;
    this.sky.ctx = el.getContext('2d');
    this.sky.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.sky.cx = rect.width / 2;
    this.sky.cy = rect.height / 2 + 10;
    this.sky.R = Math.min(rect.width, rect.height) / 2 - 26;

    this.sky.stars = [];
    for (const fam of Object.keys(RINGS) as FamKind[]) {
      const ps = IV_PARTS.filter((p) => p.fam === fam);
      ps.forEach((p, i) => {
        this.sky.stars.push({
          p,
          fam,
          base: (i / ps.length) * Math.PI * 2 + BASE_ANGLE[fam],
          r: RINGS[fam],
          tw: (i * 1.7) % 6.3,
          sx: 0,
          sy: 0,
        });
      });
    }

    this.sky.running = true;
    cancelAnimationFrame(this.sky.raf);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = (t: number) => {
      if (!this.sky.running) return;
      this.paintSky(t);
      if (!reduce) this.sky.raf = requestAnimationFrame(loop);
    };
    this.sky.raf = requestAnimationFrame(loop);
  }

  private stopSky(): void {
    this.sky.running = false;
    cancelAnimationFrame(this.sky.raf);
  }

  private starPos(s: SkyStar, t: number): { x: number; y: number } {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a = s.base + (reduce ? 0 : t * SPEEDS[s.fam]);
    return { x: this.sky.cx + Math.cos(a) * s.r * this.sky.R, y: this.sky.cy + Math.sin(a) * s.r * this.sky.R * 0.92 };
  }

  private paintSky(t: number): void {
    const c = this.sky.ctx;
    if (!c) return;
    const dark = this.dark();
    const filter = this.famFilter();
    const { w, h, cx, cy, R } = this.sky;
    c.clearRect(0, 0, w, h);

    const ink = dark ? 'rgba(247,238,218,.5)' : 'rgba(42,28,16,.55)';
    const faint = dark ? 'rgba(247,238,218,.16)' : 'rgba(42,28,16,.15)';

    if (dark) {
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % w;
        const y = (i * 173) % h;
        c.globalAlpha = 0.25 + 0.25 * Math.sin(t / 900 + i);
        c.fillStyle = '#F7EEDA';
        c.fillRect(x, y, 1.6, 1.6);
      }
      c.globalAlpha = 1;
    }

    // family rings
    c.setLineDash([2, 7]);
    c.lineWidth = 1.6;
    for (const k of Object.keys(RINGS) as FamKind[]) {
      c.strokeStyle = filter && filter !== k ? (dark ? 'rgba(247,238,218,.06)' : 'rgba(42,28,16,.06)') : faint;
      c.beginPath();
      c.ellipse(cx, cy, RINGS[k] * R, RINGS[k] * R * 0.92, 0, 0, 7);
      c.stroke();
    }
    c.setLineDash([]);

    // ring labels
    c.font = '600 8.5px system-ui';
    c.textAlign = 'center';
    for (const k of Object.keys(RINGS) as FamKind[]) {
      c.fillStyle = filter && filter !== k ? 'transparent' : dark ? 'rgba(247,238,218,.4)' : 'rgba(42,28,16,.4)';
      const plural: Record<FamKind, [string, string]> = {
        manager: ['MANAGERS', 'МЕНЕДЖЕРЫ'],
        firefighter: ['FIREFIGHTERS', 'ПОЖАРНЫЕ'],
        exile: ['EXILES', 'ИЗГНАННИКИ'],
        resource: ['RESOURCES', 'РЕСУРСЫ'],
      };
      c.fillText(this.L(plural[k]), cx, cy - RINGS[k] * R * 0.92 - 5);
    }

    // manager → exile guard links
    if (!filter) {
      c.setLineDash([4, 6]);
      c.strokeStyle = dark ? 'rgba(255,211,77,.4)' : 'rgba(232,67,74,.35)';
      c.lineWidth = 1.8;
      for (const [aId, bId] of GUARD_LINKS) {
        const A = this.sky.stars.find((s) => s.p.id === aId);
        const B = this.sky.stars.find((s) => s.p.id === bId);
        if (!A || !B) continue;
        const pa = this.starPos(A, t);
        const pb = this.starPos(B, t);
        c.beginPath();
        c.moveTo(pa.x, pa.y);
        c.lineTo(pb.x, pb.y);
        c.stroke();
      }
      c.setLineDash([]);
    }

    // the Self star (center)
    const pulse = 1 + Math.sin(t / 800) * 0.05;
    this.drawSelfStar(c, cx, cy, 20 * pulse, dark);

    // part stars
    for (const s of this.sky.stars) {
      const pos = this.starPos(s, t);
      s.sx = pos.x;
      s.sy = pos.y;
      const dimmed = filter && filter !== s.fam;
      c.globalAlpha = dimmed ? 0.15 : 1;

      const look = this.lookFor(s.p.id);
      const avg = s.p.ax.ag / 100 * 2.2;
      const rr = 9 + avg * 3 + Math.sin(t / 600 + s.tw) * 0.8;
      if (dark && !dimmed) {
        c.shadowColor = look.color;
        c.shadowBlur = 14;
      }
      // mini-sticker: the part's true shape, filled with its current look color
      const sc = (rr * 2) / 100;
      c.save();
      c.translate(pos.x - 50 * sc, pos.y - 50 * sc);
      c.scale(sc, sc);
      const path = this.shapePath2D(look.shape);
      c.fillStyle = look.color;
      c.fill(path);
      c.shadowBlur = 0;
      c.strokeStyle = dark ? '#0A0818' : '#1c1610';
      c.lineWidth = 2.2 / sc;
      c.lineJoin = 'round';
      c.stroke(path);
      c.restore();
      // face dots per look
      c.fillStyle = '#1c1610';
      c.beginPath();
      c.arc(pos.x - rr * 0.32, pos.y - rr * 0.15, 1.7, 0, 7);
      c.fill();
      c.beginPath();
      c.arc(pos.x + rr * 0.32, pos.y - rr * 0.15, 1.7, 0, 7);
      c.fill();
      c.strokeStyle = '#1c1610';
      c.lineWidth = 1.5;
      c.beginPath();
      if (look.mouth === 'ooh') {
        c.fillStyle = '#1c1610';
        c.ellipse(pos.x, pos.y + rr * 0.25, 2, 2.6, 0, 0, 7);
        c.fill();
      } else if (look.mouth === 'flat' || look.mouth === 'grit' || look.mouth === 'wavy') {
        c.moveTo(pos.x - rr * 0.22, pos.y + rr * 0.25);
        c.lineTo(pos.x + rr * 0.22, pos.y + rr * 0.25);
        c.stroke();
      } else {
        c.arc(pos.x, pos.y + rr * 0.18, rr * 0.32, 0.4, 2.7);
        c.stroke();
      }
      if (s.p.ax.ag >= 85) this.spark(c, pos.x + rr + 5, pos.y - rr - 3, 3.4, ink);
      c.fillStyle = dark ? 'rgba(247,238,218,.85)' : 'rgba(42,28,16,.85)';
      c.font = '600 9.5px system-ui';
      c.fillText(this.L(s.p.short), pos.x, pos.y + rr + 12);
      c.globalAlpha = 1;
    }
  }

  private drawSelfStar(c: CanvasRenderingContext2D, x: number, y: number, r: number, dark: boolean): void {
    c.save();
    c.translate(x, y);
    c.fillStyle = '#E9D23A';
    c.strokeStyle = dark ? '#0A0818' : '#1c1610';
    c.lineWidth = 2.4;
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566 - 1.5708;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      c.lineTo(Math.cos(a + 0.6283) * r * 0.48, Math.sin(a + 0.6283) * r * 0.48);
    }
    c.closePath();
    if (dark) {
      c.shadowColor = '#E9D23A';
      c.shadowBlur = 18;
    }
    c.fill();
    c.shadowBlur = 0;
    c.stroke();
    // face
    c.fillStyle = '#1c1610';
    c.beginPath();
    c.arc(-r * 0.25, -r * 0.15, r * 0.09, 0, 7);
    c.fill();
    c.beginPath();
    c.arc(r * 0.25, -r * 0.15, r * 0.09, 0, 7);
    c.fill();
    c.strokeStyle = '#1c1610';
    c.lineWidth = r * 0.09;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, r * 0.12, r * 0.22, 0.3, 2.8);
    c.stroke();
    c.restore();
    c.fillStyle = dark ? 'rgba(247,238,218,.7)' : 'rgba(42,28,16,.7)';
    c.font = '600 9px system-ui';
    c.textAlign = 'center';
    c.fillText(this.isEnglish() ? 'SELF ✦ YOU' : 'SELF ✦ ВЫ', x, y + r + 16);
  }

  private readonly pathCache = new Map<string, Path2D>();

  /** Canvas Path2D for a sticker shape (parsed from the SVG markup in SHAPES). */
  private shapePath2D(shape: string): Path2D {
    let p2 = this.pathCache.get(shape);
    if (!p2) {
      const raw = SHAPES[shape] ?? SHAPES.taskmaster;
      const d = raw.match(/d="([^"]+)"/);
      if (d) {
        p2 = new Path2D(d[1]);
      } else {
        const num = (attr: string) => parseFloat(raw.match(new RegExp(attr + '="([\\d.]+)"'))![1]);
        p2 = new Path2D();
        p2.roundRect(num('x'), num('y'), num('width'), num('height'), num('rx'));
      }
      this.pathCache.set(shape, p2);
    }
    return p2;
  }

  private spark(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string): void {
    c.strokeStyle = col;
    c.lineWidth = 1.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - r, y);
    c.lineTo(x + r, y);
    c.moveTo(x, y - r);
    c.lineTo(x, y + r);
    c.stroke();
  }

  onCanvasClick(event: MouseEvent): void {
    const el = this.skyCanvas()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best: SkyStar | null = null;
    let bd = Infinity;
    for (const s of this.sky.stars) {
      const d = (s.sx - x) ** 2 + (s.sy - y) ** 2;
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    if (best && bd < 32 * 32) this.openPart(best.p.id);
  }

  famCount(fam: FamKind): number {
    return IV_PARTS.filter((p) => p.fam === fam).length;
  }
}

/** Minimal structural user type (the full type lives at the app boundary). */
interface User {
  isAnonymous?: boolean;
}
