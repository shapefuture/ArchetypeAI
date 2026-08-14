/**
 * §1.9 four-layer part copy — FAMILY-LEVEL PROVISIONAL TEXTS (en/ru).
 * Copy team replaces with per-subtype texts keyed
 * `parts.<family>.<subtype_slug>.{face,need,shadow,superpower}`;
 * resolution falls back to these family layers until then.
 * Never frame a part as an enemy — no bad parts.
 */
import type { ShadowPartId } from './parts';

export type LayerKey = 'face' | 'need' | 'shadow' | 'superpower';
export const LAYERS: LayerKey[] = ['face', 'need', 'shadow', 'superpower'];

export interface PartCopy { face: string; need: string; shadow: string; superpower: string; }
export type PartCopyTable = Record<ShadowPartId, PartCopy>;

export const PART_COPY: Record<'en' | 'ru', PartCopyTable> = {
  en: {
    taskmaster: {
      face: 'The one who is always visibly productive.',
      need: 'Needs to know worth exists without output.',
      shadow: 'Grinds past exhaustion to outrun a sense of worthlessness.',
      superpower: 'Disciplined drive that serves a chosen life.',
    },
    inner_critic: {
      face: 'The sharp evaluator of everything you do.',
      need: 'Needs to know being seen will not end in rejection.',
      shadow: 'Attacks you first so no one else can.',
      superpower: 'Discernment — precise, kind standards.',
    },
    pleaser: {
      face: 'The agreeable one who keeps every room smooth.',
      need: 'Needs to know closeness survives disagreement.',
      shadow: 'Erases its own preferences to buy belonging.',
      superpower: 'Real warmth and diplomatic care.',
    },
    controller: {
      face: 'The planner with a contingency for everything.',
      need: 'Needs to know the world holds without being held.',
      shadow: 'Clamps down on life to prevent collapse.',
      superpower: 'Stewardship — order that serves, not constricts.',
    },
    analyst: {
      face: 'The calm explainer of whatever happens.',
      need: 'Needs to know feelings will not drown it.',
      shadow: 'Lives in the explanation to avoid the experience.',
      superpower: 'Clarity that maps hard things truly.',
    },
    hermit: {
      face: 'The one who is gloriously hard to reach.',
      need: 'Needs to know company can be safe again.',
      shadow: 'Withdraws preemptively from a feared world.',
      superpower: 'Deep solitude that genuinely restores.',
    },
    bypasser: {
      face: 'The one who finds the silver lining instantly.',
      need: 'Needs to know pain can be survived, not skipped.',
      shadow: 'Transcends feelings it never actually felt.',
      superpower: 'Genuine perspective, after feeling.',
    },
    numb: {
      face: 'The one who is fine, always fine.',
      need: 'Needs to know what was overwhelming is over.',
      shadow: 'Fogs out feeling before it can arrive.',
      superpower: 'The capacity to pause — real stillness.',
    },
    rebel: {
      face: 'The one who will not be told.',
      need: 'Needs to know closeness does not mean capture.',
      shadow: 'Burns bridges to stay sovereign.',
      superpower: 'Boundary courage — a clean, loud no.',
    },
    charmer: {
      face: 'The unforgettable entrance, the perfect exit line.',
      need: 'Needs to know mattering does not require a stage.',
      shadow: 'Performs for love it fears it can\'t otherwise have.',
      superpower: 'Magnetism and aliveness, honestly offered.',
    },
    abandoned: {
      face: 'The one who texts first, always.',
      need: 'Needs to know being left is not destiny.',
      shadow: 'Clinging and testing to disprove the belief "I will be left."',
      superpower: 'Loyalty and a huge heart for connection.',
    },
    ashamed: {
      face: 'The one who hides the real work.',
      need: 'Needs to know being seen does not mean being condemned.',
      shadow: 'Carries "I am defective" like a fact.',
      superpower: 'Humility that is honest, not self-erasing.',
    },
    frightened: {
      face: 'The one who knows where the exits are.',
      need: 'Needs to know it is safe now.',
      shadow: 'Braces against a danger that already passed.',
      superpower: 'Alertness — a guardian\'s attention.',
    },
    unseen: {
      face: 'The quiet one at the edge of the photo.',
      need: 'Needs to know it matters, exactly as it is.',
      shadow: 'Fades out so others need not bother.',
      superpower: 'Witnessing — the art of truly seeing others.',
    },
  },
  ru: {
    taskmaster: {
      face: 'Тот, кто всегда на виду продуктивен.',
      need: 'Нужно знать: ценность есть и без результата.',
      shadow: 'Грызёт себя до изнеможения, убегая от чувства ничтожности.',
      superpower: 'Дисциплина, служащая выбранной жизни.',
    },
    inner_critic: {
      face: 'Строгий оценщик всего, что ты делаешь.',
      need: 'Нужно знать: быть увиденным не значит быть отвергнутым.',
      shadow: 'Нападает первым, чтобы не напали другие.',
      superpower: 'Проницательность — точные и добрые мерки.',
    },
    pleaser: {
      face: 'Уживчивый, сглаживающий любое напряжение.',
      need: 'Нужно знать: близость переживёт несогласие.',
      shadow: 'Стирает свои предпочтения ради принадлежности.',
      superpower: 'Настоящее тепло и дар дипломатии.',
    },
    controller: {
      face: 'Плановой с запасным вариантом на всё.',
      need: 'Нужно знать: мир держится и без вашей хватки.',
      shadow: 'Сжимает жизнь, предотвращая крах.',
      superpower: 'Попечительство — порядок, служащий, а не душащий.',
    },
    analyst: {
      face: 'Спокойный объясняющий всё происходящее.',
      need: 'Нужно знать: чувства не утопят.',
      shadow: 'Живёт в объяснении, избегая переживания.',
      superpower: 'Ясность, честно отображающая сложное.',
    },
    hermit: {
      face: 'Тот, кого славно трудно достать.',
      need: 'Нужно знать: общество снова может быть безопасным.',
      shadow: 'Уходит заранее от страшного мира.',
      superpower: 'Глубокое уединение, по-настоящему восстанавливающее.',
    },
    bypasser: {
      face: 'Мгновенно находящий светлую сторону.',
      need: 'Нужно знать: боль можно прожить, а не перепрыгнуть.',
      shadow: 'Возвышается над чувствами, которых не чувствовал.',
      superpower: 'Настоящий взгляд с высоты — после прожитого.',
    },
    numb: {
      face: 'Тот, у кого всё нормально, всегда нормально.',
      need: 'Нужно знать: невыносимое уже позади.',
      shadow: 'Затуманивает чувство раньше, чем оно придёт.',
      superpower: 'Способность к паузе — настоящая тишина.',
    },
    rebel: {
      face: 'Тот, кому не указывают.',
      need: 'Нужно знать: близость — не плен.',
      shadow: 'Сжигает мосты, чтобы остаться собой.',
      superpower: 'Мужество границ — чистое громкое «нет».',
    },
    charmer: {
      face: 'Незабываемый выход и идеальная последняя реплика.',
      need: 'Нужно знать: значимость не требует сцены.',
      shadow: 'Играет любовь, которой боится не заслужить.',
      superpower: 'Магнетизм и живость, честно предложенные.',
    },
    abandoned: {
      face: 'Тот, кто всегда пишет первым.',
      need: 'Нужно знать: «меня оставят» — не приговор.',
      shadow: 'Цепляется и проверяет, опровергая «меня бросят».',
      superpower: 'Верность и огромное сердце для связи.',
    },
    ashamed: {
      face: 'Тот, кто прячет настоящую работу.',
      need: 'Нужно знать: быть увиденным не значит быть осуждённым.',
      shadow: 'Носит «я дефектный» как факт.',
      superpower: 'Смирение честное, а не самоуничижительное.',
    },
    frightened: {
      face: 'Тот, кто знает, где выходы.',
      need: 'Нужно знать: сейчас безопасно.',
      shadow: 'Сжимается от опасности, которая уже прошла.',
      superpower: 'Бдительность — внимание стража.',
    },
    unseen: {
      face: 'Тихий на краю фотографии.',
      need: 'Нужно знать: он важен таким, каков есть.',
      shadow: 'Растворяется, чтобы не утруждать других.',
      superpower: 'Умение по-настоящему видеть других.',
    },
  },
};
