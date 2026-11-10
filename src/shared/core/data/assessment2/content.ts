/**
 * Assessment 2.0 copy, English and Russian (plan §7). Russian follows the project rules: «вы», the terms
 * Менеджер / Пожарный / Изгнанник / Ресурс / Self-энергия, and gender-neutral first-person wording.
 * Records are exhaustive, so a missing id is a compile error. Copy describes what a reaction does, never
 * presents a costume (faith, humour, reason) as a defence in itself.
 */
import type { CapacityId, CostumeId, ExileId, FamilyId, GroundId, MemberId, NeedId, ProviderForm, ProviderRole, Timing } from './taxonomy';
import { BLENDING_OPTIONS, CAPACITIES, COSTUMES, EXILES, FAMILIES, GROUND_ITEMS, MEMBERS, NEEDS, PROVIDER_FORMS, PROVIDER_ROLES } from './taxonomy';
import { SCENES, SCENE_FAMILIES, type SceneId } from './scoring';
import type { BlendingOption } from './taxonomy';

export type Bi = { en: string; ru: string };

export const SCENE_COPY: Record<SceneId, { title: Bi; text: Bi }> = {
  criticised: { title: { en: 'Your work is criticised', ru: 'Вашу работу критикуют' }, text: { en: 'A colleague says, in front of others, that the report missed the point.', ru: 'Коллега при других говорит, что отчёт не попал в суть.' } },
  leftOut: { title: { en: 'You are left out', ru: 'Вас не позвали' }, text: { en: 'You find out that a plan was made without you.', ru: 'Вы узнаёте, что план составили без вас.' } },
  lineCrossed: { title: { en: 'A line is crossed', ru: 'Границу нарушили' }, text: { en: 'Someone goes through your things, or your time, without asking.', ru: 'Кто-то без спроса трогает ваши вещи или ваше время.' } },
  fellThrough: { title: { en: 'Something falls through', ru: 'Что-то сорвалось' }, text: { en: 'Something you were looking forward to is cancelled.', ru: 'То, чего вы ждали, отменили.' } },
  planChanged: { title: { en: 'The plan changes', ru: 'План меняется' }, text: { en: 'Your plans change at the last minute, with no warning.', ru: 'Планы меняются в последний момент, без предупреждения.' } },
  freeEvening: { title: { en: 'A free evening', ru: 'Свободный вечер' }, text: { en: 'You have an evening with nothing planned.', ru: 'У вас вечер, на который ничего не запланировано.' } },
};

/** One reaction per family per scene, written in the first person with no part names. */
/** Keys are `${scene}:${family}` for the 30 pairs in SCENE_FAMILIES; copyCoverage checks every pair exists. */
export const REACTION_COPY: Readonly<Record<string, Bi>> = {
  'criticised:overPerform': { en: 'I start rechecking every line and planning the fix before they finish.', ru: 'Я тут же пересматриваю каждую строку и планирую исправления, ещё не дослушав.' },
  'criticised:attack': { en: 'I want to hit back, and a sharp reply is already ready.', ru: 'Мне хочется ответить резко, и острая реплика уже готова.' },
  'criticised:appease': { en: 'I apologise at once, even before I know what went wrong.', ru: 'Я сразу извиняюсь, даже не разобравшись, в чём дело.' },
  'criticised:withdraw': { en: 'I go quiet and pull back, and I do not bring it up again.', ru: 'Я замыкаюсь и отстраняюсь, и больше к этому не возвращаюсь.' },
  'criticised:reframe': { en: 'I think it was not that important, or they were having a bad day.', ru: 'Я думаю, что это не так уж важно, или у них просто был плохой день.' },
  'leftOut:pursue': { en: 'I message them straight away to check that we are still close.', ru: 'Я сразу пишу, чтобы убедиться, что мы по-прежнему близки.' },
  'leftOut:appease': { en: 'I tell myself it is fine, and offer to help with whatever is next.', ru: 'Я говорю себе, что всё в порядке, и предлагаю помочь с тем, что будет дальше.' },
  'leftOut:withdraw': { en: 'I decide I did not want to be there anyway, and keep my distance.', ru: 'Я решаю, что мне там и не нужно было быть, и держу дистанцию.' },
  'leftOut:numbSoothe': { en: 'I feel a blank, and then reach for something to fill the evening.', ru: 'Внутри становится пусто, и я тянусь к чему-нибудь, чтобы заполнить вечер.' },
  'leftOut:attack': { en: 'A flash of anger comes, and I start listing what they did wrong.', ru: 'Вспыхивает злость, и я начинаю перечислять, что они сделали не так.' },
  'lineCrossed:attack': { en: 'I snap, and say it louder than the moment needs.', ru: 'Я вспыхиваю и говорю громче, чем того требует момент.' },
  'lineCrossed:appease': { en: 'I smile, say it is no problem, and let it go.', ru: 'Я улыбаюсь, говорю, что ничего страшного, и отпускаю.' },
  'lineCrossed:overControl': { en: 'I make a rule so it cannot happen again, and check that it has not.', ru: 'Я придумываю правило, чтобы это больше не повторилось, и проверяю, что так и есть.' },
  'lineCrossed:withdraw': { en: 'I close the door, in fact or in my head, and stop sharing.', ru: 'Я закрываюсь, на деле или в мыслях, и перестаю делиться.' },
  'lineCrossed:reframe': { en: 'I decide they probably meant nothing by it.', ru: 'Я решаю, что они, скорее всего, ничего такого не имели в виду.' },
  'fellThrough:numbSoothe': { en: 'I stop caring, and scroll or eat until it stops mattering.', ru: 'Мне становится всё равно, и я листаю ленту или ем, пока это не перестаёт иметь значение.' },
  'fellThrough:reframe': { en: 'I say there was probably a better reason, and move on.', ru: 'Я говорю себе, что, наверное, была причина получше, и иду дальше.' },
  'fellThrough:pursue': { en: 'I start looking for someone who will fix it or comfort me.', ru: 'Я начинаю искать того, кто поможет или утешит.' },
  'fellThrough:overPerform': { en: 'I throw myself into something useful, so the disappointment cannot reach me.', ru: 'Я бросаюсь в полезное дело, чтобы разочарование до меня не добралось.' },
  'fellThrough:overControl': { en: 'I plan the next steps in detail, so nothing else can fall through.', ru: 'Я расписываю следующие шаги в деталях, чтобы ничто другое не сорвалось.' },
  'planChanged:overControl': { en: 'My chest tightens, and I need to know exactly what happens next.', ru: 'В груди всё сжимается, и мне нужно точно знать, что будет дальше.' },
  'planChanged:overPerform': { en: 'I start working out how to make the new plan succeed.', ru: 'Я начинаю прикидывать, как сделать так, чтобы новый план сработал.' },
  'planChanged:pursue': { en: 'I ask people whether they still want to see me.', ru: 'Я спрашиваю людей, хотят ли они всё ещё меня видеть.' },
  'planChanged:numbSoothe': { en: 'I shrug and drift off into something easy.', ru: 'Я пожимаю плечами и ухожу во что-нибудь лёгкое.' },
  'planChanged:reframe': { en: 'I decide the change is secretly good for me.', ru: 'Я решаю, что эта перемена втайне мне на пользу.' },
  'freeEvening:overPerform': { en: 'I feel I should be using it, and start a list of things to do.', ru: 'Мне кажется, что вечер нужно использовать, и я начинаю список дел.' },
  'freeEvening:numbSoothe': { en: 'I drift to the phone, the fridge or a show, without deciding to.', ru: 'Я незаметно оказываюсь у телефона, холодильника или экрана, даже не решив этого.' },
  'freeEvening:overControl': { en: 'I try to plan the evening so it is productive, and feel uneasy when it is not.', ru: 'Я пытаюсь расписать вечер так, чтобы он был продуктивным, и мне неспокойно, когда не получается.' },
  'freeEvening:pursue': { en: 'I think about who I could call, and wonder whether they would want to hear from me.', ru: 'Я думаю, кому можно позвонить, и гадаю, будут ли рады мне.' },
  'freeEvening:withdraw': { en: 'I am glad of the quiet, and keep the evening to myself.', ru: 'Мне приятно побыть наедине с собой, и я оставляю вечер для себя.' },
};

export const MEMBER_COPY: Record<MemberId, { name: Bi; card: Bi }> = {
  taskmaster: { name: { en: 'The Taskmaster', ru: 'Деятель' }, card: { en: 'Keeps you busy and productive, so that you feel worth something. Pushes ahead and rarely rests.', ru: 'Держит вас в делах и продуктивности, чтобы вы чувствовали свою ценность. Толкает вперёд и редко даёт отдых.' } },
  perfectionist: { name: { en: 'The Perfectionist', ru: 'Перфекционист' }, card: { en: 'Demands flawless work, so that criticism has nothing to hold. Will not let anything finish until it is perfect.', ru: 'Требует безупречности, чтобы критике было не к чему придраться. Не даёт ничему завершиться, пока оно не станет идеальным.' } },
  controller: { name: { en: 'The Controller', ru: 'Контролёр' }, card: { en: 'Keeps situations and people in order, so that nothing can surprise you. Tightens when things drift.', ru: 'Держит ситуации и людей в порядке, чтобы ничто не застало врасплох. Сжимается, когда что-то выходит из-под контроля.' } },
  worrier: { name: { en: 'The Worrier', ru: 'Тревожащийся' }, card: { en: 'Scans the future for what could go wrong and keeps you on guard. Replays scenarios so that nothing is missed.', ru: 'Просматривает будущее в поисках того, что может пойти не так, и держит в напряжении. Прокручивает сценарии, чтобы ничего не упустить.' } },
  scanner: { name: { en: 'The Scanner', ru: 'Сканер' }, card: { en: 'Watches people\'s moods and motives for any sign of danger. Reads the room before you can speak.', ru: 'Следит за настроением и намерениями людей и ищет признаки опасности. Читает обстановку раньше, чем вы успеваете заговорить.' } },
  inner_critic: { name: { en: 'The Inner Critic', ru: 'Внутренний критик' }, card: { en: 'Judges you before anyone else can, so that the judgement feels like your own. Points out every flaw, sharply.', ru: 'Судит вас раньше других, чтобы суд хотя бы был под вашим контролем. Резко указывает на каждый недочёт.' } },
  rebel: { name: { en: 'The Rebel', ru: 'Бунтарь' }, card: { en: 'Pushes back the moment you feel pressed or controlled, so that you do not disappear. Acts on anger that is already there.', ru: 'Сопротивляется, как только вы чувствуете давление или контроль, чтобы не исчезнуть. Действует на уже накопившемся гневе.' } },
  superior: { name: { en: 'The Superior One', ru: 'Превосходящий' }, card: { en: 'Keeps you above the situation by seeing yourself as wiser or more aware than others. Looks down so that you do not have to feel small.', ru: 'Держит вас над ситуацией, видя себя мудрее или осознаннее других. Смотрит сверху, чтобы не чувствовать себя маленьким.' } },
  blamer: { name: { en: 'The Blamer', ru: 'Обвинитель' }, card: { en: 'Places the cause outside you, so that the hurt has somewhere to go. Finds fault in other people quickly.', ru: 'Переносит причину на других, чтобы боль нашла, куда уйти. Быстро находит вину в окружающих.' } },
  underminer: { name: { en: 'The Underminer', ru: 'Подрыватель' }, card: { en: 'Works against people quietly, through jokes, delays or withheld help. Hits in a way that does not show.', ru: 'Тихо действует против людей: через шутки, задержки или отказ помочь. Бьёт так, что удар не виден.' } },
  pleaser: { name: { en: 'The Pleaser', ru: 'Угодник' }, card: { en: 'Keeps the peace by making others happy first, so that they stay close. Anticipates needs and sets your own aside.', ru: 'Сохраняет мир, сначала радуя других, чтобы они оставались рядом. Угадывает чужие нужды и откладывает свои.' } },
  caretaker: { name: { en: 'The Caretaker', ru: 'Опекун' }, card: { en: 'Looks after others, so that you feel needed and therefore safe. Takes on other people\'s problems.', ru: 'Заботится о других, чтобы чувствовать себя нужным и, значит, в безопасности. Берёт на себя чужие проблемы.' } },
  chameleon: { name: { en: 'The Chameleon', ru: 'Хамелеон' }, card: { en: 'Becomes what the room seems to want, so that nobody has a reason to reject you. Adjusts opinions to fit.', ru: 'Становится таким, каким, кажется, хотят видеть в этой компании, чтобы у людей не было повода отвергнуть. Подстраивает мнения.' } },
  martyr: { name: { en: 'The Martyr', ru: 'Мученик' }, card: { en: 'Gives more than is asked, so that others owe you and you feel you belong. Keeps the bill for later.', ru: 'Отдаёт больше, чем просят, чтобы другие были в долгу и чтобы вы чувствовали свою принадлежность. Записывает счёт на потом.' } },
  charmer: { name: { en: 'The Charmer', ru: 'Обаяшка' }, card: { en: 'Draws attention and warmth with humour and charm, so that people stay engaged. Performs to keep the connection going.', ru: 'Привлекает внимание и тепло обаянием и юмором, чтобы люди оставались рядом. Выступает, чтобы поддерживать связь.' } },
  clinger: { name: { en: 'The Clinger', ru: 'Цепляющийся' }, card: { en: 'Holds on tightly when someone starts to pull away, so that the loss cannot happen. Asks for reassurance often.', ru: 'Крепко держится, когда кто-то начинает отдаляться, чтобы потеря не случилась. Часто просит подтверждения.' } },
  helpless: { name: { en: 'The Helpless One', ru: 'Беспомощный' }, card: { en: 'Keeps others responsible by showing you cannot manage, so that help and care come your way. Says "I cannot" before trying.', ru: 'Заставляет других брать ответственность, показывая, что вы не справитесь, и тогда помощь приходит. Говорит «я не смогу» раньше, чем попробует.' } },
  hermit: { name: { en: 'The Hermit', ru: 'Отшельник' }, card: { en: 'Retreats inward and keeps others at a distance, so that nothing reaches the tender place. Needs long stretches alone.', ru: 'Уходит внутрь и держит людей на расстоянии, чтобы ничто не задело уязвимое место. Нуждается в долгом одиночестве.' } },
  analyst: { name: { en: 'The Analyst', ru: 'Аналитик' }, card: { en: 'Thinks things through, so that feeling does not have to be faced. Turns emotion into a problem to solve.', ru: 'Всё обдумывает, чтобы не встречаться с чувствами. Превращает переживание в задачу для решения.' } },
  avoider: { name: { en: 'The Avoider', ru: 'Избегатель' }, card: { en: 'Steps around hard tasks and conversations, so that the discomfort never arrives. Puts things off until they fade.', ru: 'Обходит трудные дела и разговоры, чтобы неприятное не наступило. Откладывает, пока всё не сотрётся.' } },
  numb: { name: { en: 'The Numb One', ru: 'Онемение' }, card: { en: 'Switches feeling off when pain surfaces, so that the fire goes out fast. Dulls everything, including joy.', ru: 'Выключает чувства, когда поднимается боль, чтобы огонь погас быстро. Приглушает всё, включая радость.' } },
  soother: { name: { en: 'The Soother', ru: 'Успокоитель' }, card: { en: 'Reaches for food, screens, shopping or other comfort to settle a flare-up. Quick relief that asks for more.', ru: 'Тянется к еде, экрану, покупкам или другому утешению, чтобы успокоить вспышку. Быстрое облегчение, которое просит ещё.' } },
  thrill_seeker: { name: { en: 'The Thrill-seeker', ru: 'Искатель острых ощущений' }, card: { en: 'Chases intensity, risk or novelty when things feel flat or painful. Makes you feel alive for a moment.', ru: 'Ищет остроту, риск или новизну, когда всё кажется пресным или болезненным. Ненадолго делает живым.' } },
  bypasser: { name: { en: 'The Bypasser', ru: 'Обходчик' }, card: { en: 'Moves past the hard feeling with an explanation that it is for the best, or meant to be. Skips grief to keep spirits up. Faith can be its costume.', ru: 'Проходит мимо тяжёлого чувства, объясняя, что так лучше или так должно было быть. Пропускает горе, чтобы сохранить настрой. Вера может быть его костюмом.' } },
  rationaliser: { name: { en: 'The Rationaliser', ru: 'Рационализатор' }, card: { en: 'Builds a good reason for what happened, so that it hurts less. Explains until the feeling has gone.', ru: 'Находит хорошую причину случившемуся, чтобы больно было меньше. Объясняет, пока чувство не уйдёт.' } },
  minimiser: { name: { en: 'The Minimiser', ru: 'Минимизатор' }, card: { en: 'Shrinks the event so that its weight does not land. Says it was not a big deal.', ru: 'Уменьшает случившееся, чтобы его вес не давил. Говорит, что это не так уж и важно.' } },
  funster: { name: { en: 'The Funster', ru: 'Шутник' }, card: { en: 'Turns the moment into a joke before the feeling can land. Keeps the room light, including you.', ru: 'Превращает момент в шутку, прежде чем чувство до вас дойдёт. Держит атмосферу лёгкой, в том числе и для вас.' } },
  dreamer: { name: { en: 'The Dreamer', ru: 'Мечтатель' }, card: { en: 'Lives in an imagined future or past, so that the present feels bearable. Rescue fantasies and idealised memories.', ru: 'Живёт в воображаемом будущем или прошлом, чтобы настоящее было терпимым. Фантазии о спасении и идеализированные воспоминания.' } },
};

/** Three "how often in the last month" items per member. Answer scale: CONFIRM_SCALE. */
export const CONFIRM_COPY: Record<MemberId, readonly [Bi, Bi, Bi]> = {
  taskmaster: [
    { en: 'I keep working on tasks after I am tired, to avoid falling behind.', ru: 'Я продолжаю делать дела, даже когда уже нет сил, лишь бы не отстать.' },
    { en: 'I feel uneasy when I am not doing something useful.', ru: 'Мне не по себе, когда я не делаю ничего полезного.' },
    { en: 'When I finish one task, I look straight for the next.', ru: 'Закончив одно дело, я сразу ищу следующее.' }],
  perfectionist: [
    { en: 'I redo work that is already good enough, to make it better.', ru: 'Я переделываю работу, которая уже достаточно хороша, чтобы сделать её лучше.' },
    { en: 'I feel I cannot hand something over until it is flawless.', ru: 'Мне кажется, что нельзя отдать что-то, пока оно не безупречно.' },
    { en: 'A small mistake stays with me for days.', ru: 'Одна маленькая ошибка не отпускает меня днями.' }],
  controller: [
    { en: 'I check that plans are being kept, even when someone else has it covered.', ru: 'Я проверяю, выполняются ли планы, даже когда всё уже под присмотром других.' },
    { en: 'I step in and take charge when things start to drift.', ru: 'Я вмешиваюсь и беру управление, когда дела начинают идти не так.' },
    { en: 'I feel tense when I cannot predict what happens next.', ru: 'Мне напряжённо, когда я не могу предсказать, что будет дальше.' }],
  worrier: [
    { en: 'Before an event, I replay what could go wrong.', ru: 'Перед событием я заранее прокручиваю, что может пойти не так.' },
    { en: 'I struggle to switch off worry, even when nothing is happening.', ru: 'Мне трудно выключить тревогу, даже когда ничего не происходит.' },
    { en: 'I ask people to reassure me that things will be fine.', ru: 'Я прошу людей успокоить меня, что всё будет хорошо.' }],
  scanner: [
    { en: 'I watch people\'s faces or tone to see whether they are upset with me.', ru: 'Я слежу за лицами и тоном людей, чтобы понять, не злятся ли они на меня.' },
    { en: 'I notice a change in someone\'s mood before they say anything.', ru: 'Я замечаю перемену в настроении человека раньше, чем он что-то скажет.' },
    { en: 'In a group I stay on guard, even when I am safe.', ru: 'В компании я остаюсь настороже, даже когда мне ничто не угрожает.' }],
  inner_critic: [
    { en: 'After a mistake I call myself harsh names.', ru: 'После ошибки я ругаю себя жёсткими словами.' },
    { en: 'When I should be resting, I go over my flaws.', ru: 'Когда пора отдыхать, я перебираю свои недостатки.' },
    { en: 'I find it hard to accept praise without a "but".', ru: 'Мне трудно принять похвалу без «но».' }],
  rebel: [
    { en: 'I push back when someone tells me what to do, even over small things.', ru: 'Я сопротивляюсь, когда мне говорят, что делать, даже по мелочам.' },
    { en: 'I refuse sharply when I feel pressed.', ru: 'Я резко отказываю, когда чувствую давление.' },
    { en: 'Anger surges when I am told that something is required of me.', ru: 'Меня захлёстывает злость, когда мне говорят, что это нужно.' }],
  superior: [
    { en: 'I feel more aware or wiser than the people around me.', ru: 'Мне кажется, что я осознаннее или мудрее окружающих.' },
    { en: 'I quietly think less of people who see things differently.', ru: 'Я тихо считаю людей, которые видят иначе, менее развитыми.' },
    { en: 'In a discussion I need to be right, even when it does not matter.', ru: 'В споре мне нужно быть правым, даже когда это не важно.' }],
  blamer: [
    { en: 'When something goes wrong, I point to someone else first.', ru: 'Когда что-то идёт не так, я сразу указываю на другого.' },
    { en: 'I feel relief when the cause can be placed outside myself.', ru: 'Мне становится легче, когда причину можно найти вне себя.' },
    { en: 'When I am upset, I list other people\'s faults.', ru: 'Расстроившись, я перечисляю недостатки других.' }],
  underminer: [
    { en: 'I make a sarcastic remark that takes the shine off someone\'s success.', ru: 'Я отпускаю язвительную реплику, которая обесценивает чужой успех.' },
    { en: 'I delay or withhold help when someone annoys me.', ru: 'Я откладываю помощь или отказываю в ней, когда кто-то меня раздражает.' },
    { en: 'In private I play down other people\'s achievements.', ru: 'В узком кругу я преуменьшаю достижения других.' }],
  pleaser: [
    { en: 'I say yes to requests I would rather refuse.', ru: 'Я соглашаюсь на просьбы, от которых хотелось бы отказаться.' },
    { en: 'I change my opinion to match the people I am with.', ru: 'Я меняю своё мнение, чтобы совпасть с людьми рядом.' },
    { en: 'I feel anxious when someone seems unhappy with me.', ru: 'Мне тревожно, когда кто-то недоволен мной.' }],
  caretaker: [
    { en: 'I take on other people\'s problems before they ask.', ru: 'Я беру на себя чужие проблемы, ещё до того как меня попросят.' },
    { en: 'I feel I must keep others comfortable, even at my own cost.', ru: 'Мне кажется, что нужно держать других в комфорте, даже в ущерб себе.' },
    { en: 'I feel useless when no one needs my help.', ru: 'Мне кажется бесполезным, когда никому не нужна моя помощь.' }],
  chameleon: [
    { en: 'I adjust my views to fit whoever I am with.', ru: 'Я подстраиваю свои взгляды под собеседника.' },
    { en: 'In a group I feel I have no opinion of my own.', ru: 'В группе мне кажется, что у меня нет собственного мнения.' },
    { en: 'I copy someone\'s tone or mood, so that I am accepted.', ru: 'Я копирую чужой тон или настроение, чтобы меня приняли.' }],
  martyr: [
    { en: 'I give more than I am asked, and feel resentful later.', ru: 'Я отдаю больше, чем просят, а потом чувствую обиду.' },
    { en: 'I expect others to notice what I have sacrificed.', ru: 'Я жду, что другие заметят мои жертвы.' },
    { en: 'I say "it is fine" while I am actually hurt.', ru: 'Я говорю «всё нормально», хотя мне на самом деле больно.' }],
  charmer: [
    { en: 'When tension rises, I win people back with humour or charm.', ru: 'Когда напряжение растёт, я возвращаю людей обаянием или шуткой.' },
    { en: 'I feel I must be liked by everyone in the room.', ru: 'Мне кажется, что меня должны любить все в комнате.' },
    { en: 'When uncertainty takes over, I show a lighter version of myself.', ru: 'Когда неуверенность берёт верх, я показываю более лёгкую версию себя.' }],
  clinger: [
    { en: 'I message or call to check that I am still wanted.', ru: 'Я пишу или звоню, чтобы убедиться, что меня всё ещё хотят видеть.' },
    { en: 'I feel panic when someone is slow to reply.', ru: 'Меня охватывает паника, когда кто-то долго не отвечает.' },
    { en: 'In one conversation I ask "are we okay?" more than once.', ru: 'Я спрашиваю «у нас всё в порядке?» несколько раз за один разговор.' }],
  helpless: [
    { en: 'I say I cannot manage before I have tried.', ru: 'Я говорю, что не справлюсь, ещё до того, как попробую.' },
    { en: 'When things get hard, I wait for someone to take over.', ru: 'Когда становится трудно, я жду, что кто-то возьмёт всё на себя.' },
    { en: 'I feel others would manage better than I do.', ru: 'Мне кажется, что другие справились бы лучше меня.' }],
  hermit: [
    { en: 'I need long periods alone to feel settled.', ru: 'Мне нужны долгие периоды одиночества, чтобы почувствовать себя спокойно.' },
    { en: 'I keep my inner life to myself, even with people I trust.', ru: 'Я избегаю делиться своим внутренним миром, даже с теми, кому доверяю.' },
    { en: 'I withdraw when there are too many feelings around people.', ru: 'Я отстраняюсь, когда рядом с людьми становится слишком много чувств.' }],
  analyst: [
    { en: 'I try to understand a feeling before I let myself have it.', ru: 'Я стараюсь понять чувство, прежде чем позволить себе его испытать.' },
    { en: 'I turn a conversation that should be emotional into an analysis.', ru: 'Я перевожу разговор, который должен быть эмоциональным, в рассуждения.' },
    { en: 'I stay calm by thinking about what happened, instead of feeling it.', ru: 'Я сохраняю спокойствие, размышляя о случившемся, вместо того чтобы чувствовать.' }],
  avoider: [
    { en: 'I put off a hard task until it becomes urgent.', ru: 'Я откладываю трудное дело, пока оно не станет срочным.' },
    { en: 'I avoid a conversation I know needs to happen.', ru: 'Я избегаю разговора, который знаю, что нужно провести.' },
    { en: 'I drop a project as soon as it starts to feel hard.', ru: 'Я бросаю проект, как только он становится трудным.' }],
  numb: [
    { en: 'When something painful comes up, I switch off or go blank.', ru: 'Когда поднимается что-то болезненное, я отключаюсь или ухожу в пустоту.' },
    { en: 'I feel nothing where I expected to feel something.', ru: 'Я ничего не чувствую там, где ожидаю чувствовать.' },
    { en: 'When a hard feeling starts, I go into a screen.', ru: 'Когда начинается тяжёлое чувство, я ухожу в экран.' }],
  soother: [
    { en: 'When things get hard, I eat or snack to calm down.', ru: 'Когда становится тяжело, я ем или перекусываю, чтобы успокоиться.' },
    { en: 'To soften an uncomfortable feeling, I scroll or shop.', ru: 'Чтобы сгладить неприятное чувство, я листаю ленту или делаю покупки.' },
    { en: 'To ease tension, I reach for a drink, a cigarette or something sweet.', ru: 'Чтобы смягчить напряжение, я тянусь к напитку, сигарете или сладкому.' }],
  thrill_seeker: [
    { en: 'When life feels flat, I take a risk to feel something.', ru: 'Когда жизнь кажется пресной, я иду на риск, чтобы что-то почувствовать.' },
    { en: 'I seek intense experiences to avoid feeling bored or low.', ru: 'Я ищу острые впечатления, чтобы не скучать и не грустить.' },
    { en: 'I start something new quickly, then lose interest.', ru: 'Я быстро начинаю что-то новое, а потом теряю интерес.' }],
  bypasser: [
    { en: 'When I am hurting, I tell myself that everything happens for a reason.', ru: 'Когда мне больно, я говорю себе, что всё случается не просто так.' },
    { en: 'I move from a loss to the positive very quickly.', ru: 'Я очень быстро перехожу от потери к позитивному.' },
    { en: 'I say "it is all for the best" before I have felt the loss.', ru: 'Я говорю «всё к лучшему», ещё не почувствовав утраты.' }],
  rationaliser: [
    { en: 'I find a reason for an upsetting event before I have felt it.', ru: 'Я нахожу объяснение неприятному событию раньше, чем почувствую его.' },
    { en: 'I can explain a disappointment away in a few sentences.', ru: 'Я могу объяснить разочарование в нескольких предложениях.' },
    { en: 'I think about why something happened, not about how I feel.', ru: 'Я думаю о том, почему что-то случилось, а не о том, что чувствую.' }],
  minimiser: [
    { en: 'I say it was not a big deal, even when it hurt.', ru: 'Я говорю, что это ерунда, даже когда мне было больно.' },
    { en: 'I compare my situation with worse ones, to feel less affected.', ru: 'Я сравниваю своё положение с худшими, чтобы меньше переживать.' },
    { en: 'I brush off a hurtful comment as if it meant nothing.', ru: 'Обидный комментарий я отмахиваюсь как ничего не значащий.' }],
  funster: [
    { en: 'When a serious moment comes, I make a joke.', ru: 'Когда наступает серьёзный момент, я шучу.' },
    { en: 'I lighten the mood when someone is about to show emotion.', ru: 'Я разряжаю атмосферу, когда кто-то готов проявить чувства.' },
    { en: 'I feel I must entertain others to be accepted.', ru: 'Мне кажется, что нужно развлекать других, чтобы меня приняли.' }],
  dreamer: [
    { en: 'To get through a hard day, I imagine a rescue or a better life.', ru: 'Чтобы пережить трудный день, я представляю спасение или лучшую жизнь.' },
    { en: 'I think about an idealised past or future more than the present.', ru: 'Я думаю об идеализированном прошлом или будущем больше, чем о настоящем.' },
    { en: 'I feel better in fantasy than in the real situation.', ru: 'В фантазиях мне лучше, чем в реальной ситуации.' }],
};

export const CONFIRM_SCALE: readonly Bi[] = [
  { en: 'Never', ru: 'Никогда' }, { en: 'Rarely', ru: 'Редко' }, { en: 'Sometimes', ru: 'Иногда' },
  { en: 'Often', ru: 'Часто' }, { en: 'Almost always', ru: 'Почти всегда' },
];

/** "If this part stopped, what would it fear would happen?" One line per exile. */
export const FEAR_COPY: Record<ExileId, Bi> = {
  frightened: { en: 'that something bad is coming and I will not cope.', ru: 'что придёт что-то плохое, и я не справлюсь.' },
  betrayed: { en: 'that someone will hurt or use me as soon as I trust them.', ru: 'что кто-то причинит боль или воспользуется мной, как только я доверюсь.' },
  abandoned: { en: 'that people will leave me or stop caring.', ru: 'что люди уйдут или перестанут заботиться.' },
  outsider: { en: 'that I belong nowhere and nobody will take me in.', ru: 'что я нигде не принадлежу и меня никто не примет.' },
  unseen: { en: 'that my needs do not matter and nobody will notice me.', ru: 'что мои потребности не важны и меня никто не заметит.' },
  ashamed: { en: 'that I am defective or bad, and people will see it.', ru: 'что со мной что-то не так и люди это увидят.' },
  powerless: { en: 'that I cannot change anything and events will swallow me.', ru: 'что я ничего не смогу изменить и меня поглотят обстоятельства.' },
  stifled: { en: 'that my joy, anger or desire is too much and must be choked off.', ru: 'что моя радость, злость или желания слишком велики и их придётся задушить.' },
};

export const EXILE_COPY: Record<ExileId, { name: Bi; feeling: Bi; belief: Bi }> = {
  frightened: { name: { en: 'The Frightened One', ru: 'Напуганный' }, feeling: { en: 'terror', ru: 'ужас' }, belief: { en: 'Something bad is coming.', ru: 'Что-то плохое вот-вот случится.' } },
  betrayed: { name: { en: 'The Betrayed One', ru: 'Преданный' }, feeling: { en: 'mistrust, held-back anger', ru: 'недоверие, сдержанная злость' }, belief: { en: 'People will hurt or use me.', ru: 'Люди причинят боль или воспользуются мной.' } },
  abandoned: { name: { en: 'The Abandoned One', ru: 'Брошенный' }, feeling: { en: 'panic, grief', ru: 'паника, горе' }, belief: { en: 'People leave.', ru: 'Люди уходят.' } },
  outsider: { name: { en: 'The Outsider', ru: 'Чужой' }, feeling: { en: 'loneliness', ru: 'одиночество' }, belief: { en: 'I do not fit anywhere.', ru: 'Я нигде не на своём месте.' } },
  unseen: { name: { en: 'The Unseen One', ru: 'Незамеченный' }, feeling: { en: 'emptiness, longing', ru: 'пустота, тоска' }, belief: { en: 'My needs do not matter.', ru: 'Мои потребности не важны.' } },
  ashamed: { name: { en: 'The Ashamed One', ru: 'Стыдящийся' }, feeling: { en: 'shame or guilt', ru: 'стыд или вина' }, belief: { en: 'Something in me is not right.', ru: 'Во мне что-то не так.' } },
  powerless: { name: { en: 'The Powerless One', ru: 'Бессильный' }, feeling: { en: 'helplessness, feeling trapped', ru: 'беспомощность, ощущение западни' }, belief: { en: 'I cannot, or I get swallowed.', ru: 'Я не могу, или меня поглощают обстоятельства.' } },
  stifled: { name: { en: 'The Stifled One', ru: 'Придавленный' }, feeling: { en: 'deadness, flatness', ru: 'оцепенение, пустота внутри' }, belief: { en: 'My joy, anger or desire is too much.', ru: 'Моя радость, злость или желание — это слишком много.' } },
};

export const NEED_COPY: Record<NeedId, Bi> = {
  safety: { en: 'Safety', ru: 'Безопасность' },
  connection: { en: 'Connection', ru: 'Связь' },
  attunement: { en: 'Being seen and understood', ru: 'Быть понятым' },
  worth: { en: 'Worth', ru: 'Ценность' },
  agency: { en: 'Agency', ru: 'Самостоятельность' },
  aliveness: { en: 'Aliveness', ru: 'Жизненность' },
};

export const PROVIDER_COPY: Record<ProviderRole, Bi> = {
  guardian: { en: 'Guardian: stands between you and the threat, and believes you.', ru: 'Страж: встаёт между вами и угрозой и верит вам.' },
  companion: { en: 'Companion: stays, and shows you that you have a place here.', ru: 'Спутник: остаётся рядом и показывает, что вам здесь место.' },
  mirror: { en: 'Mirror: sees you and takes pleasure in you.', ru: 'Зеркало: видит вас и радуется вам.' },
  blesser: { en: 'Blesser: accepts you without conditions.', ru: 'Благословитель: принимает вас без условий.' },
  mentor: { en: 'Mentor: says "you can, and you may say no".', ru: 'Наставник: говорит «вы можете и вправе сказать нет».' },
  playmate: { en: 'Playmate: welcomes your energy and your play.', ru: 'Товарищ по играм: принимает вашу энергию и игру.' },
};

export const PROVIDER_FORM_COPY: Record<ProviderForm, Bi> = {
  ownAdult: { en: 'Your own adult self', ru: 'Ваше взрослое «Я»' },
  realPerson: { en: 'A real person you remember or know', ru: 'Реальный человек, которого вы помните или знаете' },
  idealParent: { en: 'An ideal parent figure', ru: 'Идеальный образ родителя' },
  ancestor: { en: 'An ancestor or family line', ru: 'Предок или род' },
  animalHelper: { en: 'An animal helper', ru: 'Животное-помощник' },
  place: { en: 'A place, a tree or a landscape', ru: 'Место, дерево или пейзаж' },
  faithFigure: { en: 'A spiritual or faith figure', ru: 'Духовная или религиозная фигура' },
  fictional: { en: 'A fictional character', ru: 'Вымышленный персонаж' },
  futureSelf: { en: 'Your future self', ru: 'Ваше будущее «Я»' },
};

export const CAPACITY_COPY: Record<CapacityId, { name: Bi; line: Bi }> = {
  maker: { name: { en: 'Maker', ru: 'Созидатель' }, line: { en: 'Effort that comes from interest.', ru: 'Усилие, которое идёт от интереса.' } },
  steward: { name: { en: 'Steward', ru: 'Попечитель' }, line: { en: 'Foresight without gripping.', ru: 'Предусмотрительность без хватки.' } },
  warrior: { name: { en: 'Warrior', ru: 'Воин' }, line: { en: 'Clear boundaries and honest action.', ru: 'Ясные границы и честное действие.' } },
  caregiver: { name: { en: 'Caregiver', ru: 'Заботник' }, line: { en: 'Care that includes you.', ru: 'Забота, которая включает и вас самих.' } },
  reacher: { name: { en: 'Reacher', ru: 'Тянущийся' }, line: { en: 'Asking openly for what you need.', ru: 'Открыто просит о том, что нужно.' } },
  sage: { name: { en: 'Sage', ru: 'Мудрец' }, line: { en: 'Reflective distance that sees clearly.', ru: 'Рефлексивная дистанция, которая видит ясно.' } },
  player: { name: { en: 'Explorer', ru: 'Исследователь' }, line: { en: 'Curiosity, play and pleasure.', ru: 'Любопытство, игра и удовольствие.' } },
  meaningMaker: { name: { en: 'Meaning-maker', ru: 'Создатель смысла' }, line: { en: 'Real perspective, real humour and real faith.', ru: 'Настоящая перспектива, настоящий юмор и настоящая вера.' } },
};

export const GROUND_COPY: Record<GroundId, Bi> = {
  calmPlace: { en: 'A calm place you can return to', ru: 'Спокойное место, куда можно вернуться' },
  bodyAnchor: { en: 'A body anchor: feet on the floor, a hand on the chest', ru: 'Опора в теле: стопы на полу, рука на груди' },
  breath: { en: 'Slow breath or a steady rhythm', ru: 'Медленное дыхание или ровный ритм' },
  containerForLater: { en: 'A plan to come back to it later', ru: 'План вернуться к этому позже' },
  nature: { en: 'Time outside, with trees, sky or water', ru: 'Время на воздухе: деревья, небо или вода' },
  realPeople: { en: 'Real people who know you', ru: 'Близкие люди, которые вас знают' },
  ritualOrPrayer: { en: 'A ritual or prayer you trust', ru: 'Ритуал или молитва, которым вы доверяете' },
  ancestralRemembrance: { en: 'Remembering your ancestors or your family line', ru: 'Память о предках и роде' },
};

export const COSTUME_COPY: Record<CostumeId, Bi> = {
  faith: { en: 'Faith', ru: 'Вера' },
  humour: { en: 'Humour', ru: 'Юмор' },
  reason: { en: 'Reason', ru: 'Логика' },
  work: { en: 'Work', ru: 'Работа' },
  food: { en: 'Food', ru: 'Еда' },
  screens: { en: 'Screens', ru: 'Экраны' },
  body: { en: 'The body', ru: 'Тело' },
  money: { en: 'Money', ru: 'Деньги' },
  sex: { en: 'Sex or intimacy', ru: 'Секс или близость' },
  ancestry: { en: 'Family duty or tradition', ru: 'Семейный долг или традиция' },
};

export const BLENDING_COPY: Record<BlendingOption, Bi> = {
  curious: { en: 'Curious', ru: 'Любопытство' },
  warm: { en: 'Warm', ru: 'Тепло' },
  neutral: { en: 'Neutral', ru: 'Нейтрально' },
  annoyed: { en: 'Annoyed', ru: 'Раздражение' },
  afraid: { en: 'Afraid', ru: 'Страх' },
  itIsMe: { en: 'It is me', ru: 'Это я' },
};

export const TIMING_COPY: Record<Timing, Bi> = {
  preventive: { en: 'Before it happens', ru: 'Заранее' },
  reactive: { en: 'When it hits', ru: 'Когда накрывает' },
};

export const ACCESS_COPY: Record<'easy' | 'effort' | 'none', Bi> = {
  easy: { en: 'Easily', ru: 'Легко' },
  effort: { en: 'With effort', ru: 'С усилием' },
  none: { en: 'Nothing comes to mind', ru: 'Ничего не приходит в голову' },
};

export const FAMILY_COPY: Record<FamilyId, Bi> = {
  overPerform: { en: 'Over-perform', ru: 'Гиперсделанность' },
  overControl: { en: 'Over-control', ru: 'Гиперконтроль' },
  attack: { en: 'Attack', ru: 'Атака' },
  appease: { en: 'Appease', ru: 'Умиротворение' },
  pursue: { en: 'Pursue', ru: 'Погоня за близостью' },
  withdraw: { en: 'Withdraw', ru: 'Уход' },
  numbSoothe: { en: 'Numb or soothe', ru: 'Онемение или успокоение' },
  reframe: { en: 'Reframe', ru: 'Переосмысление' },
};

/** Screen copy. Every key is used by the screens; the test suite checks that each key has both languages. */
export const UI_COPY = {
  title: { en: 'Parts map 2.0', ru: 'Карта частей 2.0' },
  kicker: { en: 'About nine minutes · reflective, not a diagnosis', ru: 'Около девяти минут · рефлексия, а не диагноз' },
  notDiagnosis: { en: 'This is a reflective lens. It shows patterns to explore, not facts about you, and it does not diagnose anything.', ru: 'Это рефлексивная карта. Она показывает паттерны для исследования, а не факты о вас, и ничего не диагностирует.' },
  stageNames: { en: ['Ground', 'Scenes', 'Narrow', 'Confirm', 'Beneath', 'Toward', 'Place'], ru: ['Опора', 'Сцены', 'Сужение', 'Проверка', 'Под поверхностью', 'Отношение', 'Размещение'] },
  steadyQ: { en: 'How steady do you feel right now?', ru: 'Насколько вы сейчас устойчивы?' },
  steadyLabels: { en: ['Very unsettled', 'Unsettled', 'Mixed', 'Steady', 'Very steady'], ru: ['Очень неустойчиво', 'Неустойчиво', 'Смешанно', 'Устойчиво', 'Очень устойчиво'] },
  lighterOffer: { en: 'Go lighter: skip the exile questions', ru: 'Пройти легче: без вопросов об изгнанниках' },
  lighterNote: { en: 'Exile questions are part of the full map. The lighter path keeps protectors and resources only.', ru: 'Вопросы об изгнанниках входят в полную карту. Лёгкий путь оставляет только защиты и ресурсы.' },
  lowSteadyHint: { en: 'You feel unsettled. The lighter path may suit this moment better.', ru: 'Вы чувствуете себя неустойчиво. Лёгкий путь может подойти сейчас лучше.' },
  sceneHelp: { en: 'Pick the reaction that is most like you, then the one that is least like you.', ru: 'Выберите реакцию, которая больше всего похожа на вас, и ту, которая меньше всего.' },
  most: { en: 'Most like me', ru: 'Больше всего похоже' },
  least: { en: 'Least like me', ru: 'Меньше всего похоже' },
  noneFits: { en: 'None of these fits', ru: 'Ничего из этого не подходит' },
  skip: { en: 'Skip', ru: 'Пропустить' },
  next: { en: 'Next', ru: 'Дальше' },
  back: { en: 'Back', ru: 'Назад' },
  narrowHelp: { en: 'Which of these fits this part of you best?', ru: 'Какая из этих частей лучше всего описывает эту часть вас?' },
  timingQ: { en: 'When does it usually show up?', ru: 'Когда она обычно проявляется?' },
  confirmHelp: { en: 'In the last month, how often has this happened?', ru: 'За последний месяц, как часто это случалось?' },
  fearQ: { en: 'If this part stopped doing its job, what would it fear would happen?', ru: 'Если бы эта часть перестала выполнять свою работу, чего бы она боялась?' },
  levelQ: { en: 'When this feeling comes up, how strong is it?', ru: 'Когда это чувство появляется, насколько оно сильное?' },
  levelLabels: { en: ['Faint', 'Light', 'Clear', 'Strong', 'Overwhelming'], ru: ['Едва заметно', 'Слабо', 'Ясно', 'Сильно', 'Переполняет'] },
  needQ: { en: 'What does this exile most need?', ru: 'Что больше всего нужно этому изгнаннику?' },
  feelQ: { en: 'How do you feel toward this part?', ru: 'Как вы относитесь к этой части?' },
  providerQ: { en: 'Is there anyone or anything, real or imagined, that gives this?', ru: 'Есть ли кто-то или что-то, реальное или воображаемое, что даёт это?' },
  providerFormQ: { en: 'Who or what could give it? Choose the form that feels right.', ru: 'Кто или что могло бы это дать? Выберите подходящую форму.' },
  capacityEasyQ: { en: 'Which of these do you reach for easily?', ru: 'К чему из этого вы обращаетесь легко?' },
  capacityHardQ: { en: 'Which of these is hardest to reach?', ru: 'К чему из этого труднее всего дотянуться?' },
  groundQ: { en: 'What helps you feel steady? Choose any that apply.', ru: 'Что помогает вам чувствовать опору? Отметьте всё подходящее.' },
  placeHelp: { en: 'Drag each part to where it sits for you, or use the arrow keys. Each part starts at its reference position.', ru: 'Перетащите каждую часть туда, где она находится для вас, или используйте стрелки. Каждая часть начинается с опорной позиции.' },
  placeHint: { en: 'Energy across, depth up and down. Direction is the second pad.', ru: 'Энергия по горизонтали, глубина по вертикали. Направление на втором поле.' },
  placeReference: { en: 'Reference position', ru: 'Опорная позиция' },
  placePlaced: { en: 'Placed by you', ru: 'Размещено вами' },
  pad1: { en: 'Energy and depth', ru: 'Энергия и глубина' },
  pad2: { en: 'Direction and blending', ru: 'Направление и слитность' },
  axisEnergy: { en: 'Energy', ru: 'Энергия' },
  axisDepth: { en: 'Depth', ru: 'Глубина' },
  axisDirection: { en: 'Direction', ru: 'Направление' },
  axisBlending: { en: 'Blending', ru: 'Слитность' },
  lowLabel: { en: 'shut down', ru: 'оцепенение' },
  highLabel: { en: 'mobilised', ru: 'мобилизация' },
  deepLabel: { en: 'deep', ru: 'глубоко' },
  surfaceLabel: { en: 'surface', ru: 'на поверхности' },
  awayLabel: { en: 'away', ru: 'от людей' },
  towardLabel: { en: 'toward', ru: 'к людям' },
  resultTitle: { en: 'Your parts map', ru: 'Ваша карта частей' },
  resultNote: { en: 'These are rankings and self-placements, not measurements or norms. Results can change as you learn more.', ru: 'Это ранжирование и ваши собственные размещения, а не измерения или нормы. Результат может меняться по мере узнавания себя.' },
  resultTop: { en: 'The strongest patterns for you right now', ru: 'Самые сильные паттерны для вас сейчас' },
  resultRank: { en: 'Rank', ru: 'Ранг' },
  resultConfidence: { en: 'Confidence', ru: 'Уверенность' },
  resultLevel: { en: 'Level', ru: 'Уровень' },
  confHigh: { en: 'High', ru: 'Высокая' },
  confMedium: { en: 'Medium', ru: 'Средняя' },
  confLow: { en: 'Low', ru: 'Низкая' },
  levelUnknown: { en: 'Not measured', ru: 'Не измерено' },
  guards: { en: 'Guards', ru: 'Защищает' },
  needLabel: { en: 'Need', ru: 'Потребность' },
  providerLabel: { en: 'Provider', ru: 'Опора' },
  costumeQ: { en: 'Does this pattern wear a familiar costume? Choose any that apply.', ru: 'Носит ли этот паттерн знакомый костюм? Отметьте подходящее.' },
  conflictsTitle: { en: 'Tensions between parts', ru: 'Напряжения между частями' },
  conflictNames: {
    'strategy-against-strategy': { en: 'Two strategies guard the same feeling in opposite ways', ru: 'Две стратегии защищают одно чувство противоположными способами' },
    'protector-against-exile': { en: 'A part is blocking a feeling that is strong for you', ru: 'Одна часть блокирует сильное для вас чувство' },
    'critic-against-criticised': { en: 'The inner critic is turned on a part that carries shame', ru: 'Внутренний критик направлен на часть, которая несёт стыд' },
    'need-against-need': { en: 'Two needs pull in opposite directions', ru: 'Две потребности тянут в противоположные стороны' },
  },
  supportTitle: { en: 'You do not have to do this alone', ru: 'Вам не нужно проходить это в одиночку' },
  supportBody: { en: 'If this feels heavy, you can stop here. Talking with someone you trust, or with a professional, can help. If you are in danger, contact your local emergency services.', ru: 'Если это тяжело, можно остановиться. Поговорить с близким человеком или со специалистом может помочь. Если вам угрожает опасность, звоните в местные экстренные службы.' },
  save: { en: 'Save and open my map', ru: 'Сохранить и открыть карту' },
  resume: { en: 'Resume where you stopped', ru: 'Продолжить с места остановки' },
  restart: { en: 'Start again', ru: 'Начать заново' },
  remainingSteps: { en: 'steps left', ru: 'шагов осталось' },
  placeBlendingNote: { en: 'Blending is set in the Toward step, not here.', ru: 'Слитность задаётся на шаге «Отношение», а не здесь.' },
  providerTest: { en: 'The test for any source: after you reach toward it, is this feeling met, or skipped past?', ru: 'Проверка для любого источника: после обращения к нему чувство удовлетворено или его проскочили?' },
  provisionalNote: { en: 'Provisional, from your first six choices', ru: 'Предварительно, по первым шести выборам' },
  depthNotAnswered: { en: 'Depth not answered yet', ru: 'Глубина пока не указана' },
  depthNotSure: { en: 'Not sure', ru: 'Не знаю' },
  notSetByYou: { en: 'not set by you', ru: 'не задано вами' },
  setByYou: { en: 'set by you', ru: 'задано вами' },
  depthChoiceHelp: { en: 'Move the depth slider to answer depth, or choose Not sure. Dragging the pad does not answer depth.', ru: 'Чтобы ответить про глубину, передвиньте ползунок глубины или выберите «Не знаю». Перетаскивание по полю глубину не задаёт.' },
  stageLabel: { en: 'Stage', ru: 'Этап' },
  ofLabel: { en: 'of', ru: 'из' },
  familyLabel: { en: 'Family', ru: 'Семья' },
  memberPickNote: { en: 'One pick per family. Choose none if no card fits.', ru: 'Одна позиция на семью. Выберите «ничего», если ни одна карточка не подходит.' },
} as const;

/** Compile-time guard: every scene, family, member, exile and item in the taxonomy has copy. */
export const copyCoverage = {
  scenes: SCENES.every((s) => SCENE_COPY[s] && SCENE_FAMILIES[s].every((f) => REACTION_COPY[`${s}:${f}`])),
  members: MEMBERS.every((m) => MEMBER_COPY[m] && CONFIRM_COPY[m]?.length === 3),
  exiles: EXILES.every((e) => FEAR_COPY[e] && EXILE_COPY[e]),
  needs: NEEDS.every((n) => NEED_COPY[n]),
  providers: PROVIDER_ROLES.every((r) => PROVIDER_COPY[r]) && PROVIDER_FORMS.every((f) => PROVIDER_FORM_COPY[f]),
  capacities: CAPACITIES.every((c) => CAPACITY_COPY[c]),
  ground: GROUND_ITEMS.every((g) => GROUND_COPY[g]),
  costumes: COSTUMES.every((c) => COSTUME_COPY[c]),
  blending: BLENDING_OPTIONS.every((b) => BLENDING_COPY[b]),
  families: FAMILIES.every((f) => FAMILY_COPY[f]),
} as const;
