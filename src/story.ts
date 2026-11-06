import { develop, meets, newCastState, type CastState, type Condition, type Development } from './cast'
import type { Expression, Pose } from './heroPixels'
import { PRACTICE_RIVAL, rivalById, type WarRecord } from './raids'

/** Who is speaking a line. The narrator has no portrait; the hero's portrait is their own. */
export type Speaker = 'narrator' | 'hero' | 'holt' | 'brannoc' | 'wick' | 'mordrake' | 'morwen' | 'gorrak'

/** Where a scene takes place. */
export type SceneId = 'fort-yard' | 'fort-cellar' | 'market' | 'keep-hall' | 'cinder-fen' | 'steppe-camp' | 'camp-night' | 'salt-road' | 'dungeon' | 'elven-forest' | 'volcano-fortress' | 'bone-desert' | 'burned-gate' | 'harrow-ford' | 'keep-courtyard' | 'burned-village' | 'moth-hill' | 'war-circle'

/** The characters who can stand on stage; the narrator never does. */
export type Actor = Exclude<Speaker, 'narrator'>

export interface StoryLine {
  speaker: Speaker
  /** `{hero}` is replaced with the hero's name. */
  text: string
  /** Moves the story to a new place from this line on. */
  scene?: SceneId
  /** Who stands on stage from this line on, left to right. */
  cast?: Actor[]
  /** The speaker's pose for this line only, matching what they say or do. */
  pose?: Pose
  /** Poses held from this line on, e.g. a prisoner bound until freed. */
  poses?: Partial<Record<Actor, Pose>>
  /** The speaker's expression for this line only. */
  mood?: Expression
  /** Expressions held from this line on, e.g. listeners brightening at good news. */
  moods?: Partial<Record<Actor, Expression>>
  /** Only plays if a character stands where this says, e.g. a line only for a hero who freed Brannoc. */
  when?: Condition
}

/** How each character stands when they aren't doing anything in particular. */
export const RESTING_POSES: Record<Actor, Pose> = {
  hero: 'hand-on-hilt',
  holt: 'arms-crossed',
  brannoc: 'stand',
  wick: 'stand',
  mordrake: 'stand',
  morwen: 'stand',
  gorrak: 'arms-crossed',
}

/** Each character's face when nothing in particular is happening: Holt's grumpy scowl, Gorrak's hard stare. */
export const RESTING_MOODS: Record<Actor, Expression> = {
  hero: 'neutral',
  holt: 'stern',
  brannoc: 'neutral',
  wick: 'neutral',
  mordrake: 'stern',
  morwen: 'neutral',
  gorrak: 'stern',
}

/** The hidden scores that choices move. Together with the final ultimatum, they decide the ending. */
export type StoryScore = 'mercy' | 'trust'

export interface StoryOption {
  id: string
  label: string
  effects: Partial<Record<StoryScore, number>>
  /** Someone who will stand with the hero later because of this choice. */
  ally?: string
  /** Only offered if a character stands where this says, e.g. a moment that needs Morwen at the hero's side. */
  when?: Condition
  /** How this choice changes the characters: where they stand, how they feel about the hero. */
  develops?: Development[]
  /** How the Journal remembers this choice, e.g. "You took Brannoc and his men into your army." */
  outcome: string
  /** What is said right after choosing, before the chapter's closing lines. */
  replies: StoryLine[]
}

export interface Chapter {
  id: string
  act: number
  number: number
  title: string
  /** The rival whose defeat opens this chapter. */
  unlockedBy?: string
  /** Interludes open from the hero's habits instead: a streak of this many days, at its best. */
  streakNeeded?: number
  /** A short quiet chapter between the main ones, at camp with the companions. */
  interlude?: true
  /** Empty while the chapter is still being written. */
  opening: StoryLine[]
  choice?: { prompt: string; options: StoryOption[] }
  closing: StoryLine[]
  /** How reading this chapter changes the characters, whatever the choice: who the hero meets, what they learn. */
  develops?: Development[]
  /** What happened, as the Journal tells it, before the hero's choice. */
  summary?: string
  /** What the hero learned about the Moth in this chapter. */
  mothClues?: string[]
}

/** What the hero has read and decided so far. */
export interface StoryState {
  /** The option picked in each chapter, by chapter id. Choices are final. */
  choices: Record<string, string>
  /** Chapters read to the end. */
  read: string[]
}

export function newStoryState(): StoryState {
  return { choices: {}, read: [] }
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'lantern-man',
    act: 1,
    number: 1,
    title: 'The Moth',
    unlockedBy: 'old-fort',
    opening: [
      {
        speaker: 'narrator',
        text: 'Smoke still hangs over the Old Watch Fort. Your soldiers pick through what the deserters left behind.',
        scene: 'fort-yard',
        cast: [],
      },
      {
        speaker: 'holt',
        text: 'Forty-two deserters, Captain, and not one of them could hold a wall. Now come down to the cellar. You’ll want to see this.',
        cast: ['hero', 'holt'],
        pose: 'point',
      },
      { speaker: 'hero', text: 'Any of ours hurt?', pose: 'think' },
      {
        speaker: 'holt',
        text: 'Seven scratched, two bruised, and one fell off the wall and landed on a deserter. I’m counting that one as a tactic.',
        pose: 'shrug',
        mood: 'happy',
      },
      {
        speaker: 'narrator',
        text: 'Crates. Dozens of them. Inside, new swords, still oiled, and every hilt is stamped with a tiny moth.',
        scene: 'fort-cellar',
      },
      {
        speaker: 'narrator',
        text: 'You lift a blade into the torchlight. It is light, keen, and perfectly balanced: better than anything your own smith has ever made.',
      },
      { speaker: 'hero', text: 'Who makes steel like this?', pose: 'think', mood: 'surprised' },
      { speaker: 'holt', text: 'Nobody I know, Captain. And I know every smith from here to the sea.', pose: 'shrug' },
      { speaker: 'hero', text: 'Deserters don’t buy new steel. Where did all this come from?', pose: 'think' },
      { speaker: 'holt', text: 'Sixty-three crates. I counted twice. Half these blades are better than ours, and ours were the old king’s best.', pose: 'shrug' },
      {
        speaker: 'narrator',
        text: 'Your soldiers drag in the deserters’ captain: a gaunt man with one ear, turning a battered coin over in his bound fingers.',
        cast: ['hero', 'brannoc', 'holt'],
        poses: { brannoc: 'bound' },
        moods: { brannoc: 'sad' },
      },
      { speaker: 'brannoc', text: 'Brannoc. I marched under the old king’s banner, back when there was a king. This coin’s the last wage he ever paid me.' },
      { speaker: 'brannoc', text: 'The swords were a gift. Came at night, by cart. The man never showed his face. Called himself the Moth.' },
      { speaker: 'brannoc', text: 'Said he wanted the roads kept dangerous. Laughed when he said it. A dry little laugh, like paper burning.', mood: 'neutral' },
      { speaker: 'holt', text: 'A merchant who gives his wares away. Forty years a soldier, and I’ve never met one of those.', pose: 'talk' },
      { speaker: 'brannoc', text: 'He’ll want paying eventually. That kind always does. Trust me, I know a debt when I see one.' },
      {
        speaker: 'narrator',
        text: 'Brannoc glances at his men, bound in the courtyard. Twenty of them, tired and hungry.',
        scene: 'fort-yard',
      },
      { speaker: 'brannoc', text: 'So, {hero}. What happens to us? I’d flip you for it, but I doubt you’d take the bet.', mood: 'happy' },
    ],
    choice: {
      prompt: 'What do you do with the deserters?',
      options: [
        {
          id: 'enlist',
          label: 'Take them into your army',
          effects: { mercy: 1 },
          ally: 'brannoc',
          outcome: 'You took Brannoc and his men into your army.',
          develops: [
            { who: 'brannoc', standing: 'ally', bond: 2, learn: 'brannoc-debt' },
            { who: 'holt', bond: -1 },
          ],
          replies: [
            { speaker: 'hero', text: 'You’ll march under my banner now. Desert me, and the roads will be the least of your worries.', pose: 'point', mood: 'stern' },
            { speaker: 'brannoc', text: 'Fair terms. Fairer than we’d have given you. Consider me in your debt.', pose: 'hand-on-heart', poses: { brannoc: 'stand' }, moods: { brannoc: 'happy' } },
            { speaker: 'holt', text: 'Wonderful. Twenty-one more mouths to feed. I’ll be keeping my good eye on that one, Captain.', pose: 'arms-crossed' },
          ],
        },
        {
          id: 'release',
          label: 'Send them into the wilds, unarmed',
          effects: {},
          outcome: 'You sent Brannoc and his men into the wilds, unarmed.',
          develops: [{ who: 'brannoc', standing: 'free', bond: 1, learn: 'brannoc-debt' }],
          replies: [
            { speaker: 'hero', text: 'Leave the swords. Leave the fort. If I see you on my roads again, I won’t be this kind.', pose: 'point', mood: 'stern' },
            { speaker: 'brannoc', text: 'Unarmed, on roads like these. You’re colder than you look. Still, a debt’s a debt. I won’t forget it.', pose: 'shrug', poses: { brannoc: 'stand' }, mood: 'sad' },
          ],
        },
        {
          id: 'hang',
          label: 'Hand them over to be hanged',
          effects: { mercy: -1 },
          outcome: 'You handed Brannoc and his men over to be hanged.',
          develops: [
            { who: 'brannoc', standing: 'dead' },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            { speaker: 'hero', text: 'You robbed travellers and called it a living. The law can decide what that’s worth.', pose: 'arms-crossed', mood: 'stern' },
            { speaker: 'brannoc', text: 'The gallows, then. Remember me when the Moth comes to collect from you.', pose: 'fist', mood: 'stern' },
            { speaker: 'holt', text: 'A hard call, Captain. Hard, but the law’s the law. The old king would’ve done the same.', pose: 'talk', mood: 'sad' },
          ],
        },
      ],
    },
    closing: [
      { speaker: 'narrator', text: 'Before you leave, you pocket one of the stamped hilts. The little moth catches the light.' },
      {
        speaker: 'narrator',
        text: 'Holt lingers by the burned gate, turning a small carved bird over in his fingers, counting something under his breath. When he sees you looking, he tucks it away.',
        scene: 'burned-gate',
        cast: ['holt'],
        poses: { holt: 'think' },
        moods: { holt: 'sad' },
      },
      { speaker: 'narrator', text: 'On the road home you pass the market, busy as ever. Wick waves you over from his stall.', scene: 'market', cast: [] },
      { speaker: 'wick', text: 'Back from the old fort already, my friend? Victorious, I hope! Victors deserve the finest things, and it so happens I have a few.' },
    ],
    summary:
      'You took the Old Watch Fort. In its cellar, Holt found crates of brand-new swords, every hilt stamped with a tiny moth. The deserters’ captain, Brannoc, said they were a gift from a stranger who called himself the Moth.',
    mothClues: [
      'Gave crates of new swords to a band of deserters, and asked nothing in return.',
      'Came at night, by cart, and never showed his face.',
      'Wanted the roads kept dangerous. Laughed when he said it, a dry little laugh, like paper burning.',
    ],
    develops: [
      { who: 'holt', standing: 'ally', stage: 1, learn: 'holt-counts' },
      { who: 'holt', learn: 'holt-old-guard' },
      { who: 'holt', learn: 'holt-carving' },
      { who: 'brannoc', standing: 'prisoner', stage: 1, learn: 'brannoc-coin' },
      { who: 'brannoc', learn: 'brannoc-moth' },
      { who: 'wick', standing: 'ally', stage: 1, learn: 'wick-market' },
    ],
  },
  {
    id: 'around-the-fire',
    act: 1,
    number: 1,
    title: 'Around the Fire',
    interlude: true,
    streakNeeded: 3,
    opening: [
      {
        speaker: 'narrator',
        text: 'Three days of good marching since the Old Watch Fort. Tonight your army camps in a quiet valley, and for once nobody is fighting anybody.',
        scene: 'camp-night',
        cast: [],
      },
      {
        speaker: 'narrator',
        text: 'Holt sits by the fire with his boots off and his pipe lit, counting the stars as if they owed him money.',
        cast: ['hero', 'holt'],
        poses: { holt: 'think' },
      },
      {
        speaker: 'holt',
        text: 'Four hundred and six, Captain. Give or take. The old king used to say a soldier who can count the stars can count anything.',
        mood: 'neutral',
        pose: 'point',
        poses: { holt: 'arms-crossed' },
      },
      { speaker: 'hero', text: 'Did you serve him long?', pose: 'think' },
      {
        speaker: 'holt',
        text: 'Forty years. I carried his banner at Harrow Ford, and his shield at the very end. Neither did him much good.',
        mood: 'sad',
        pose: 'shrug',
      },
      {
        speaker: 'brannoc',
        text: 'Harrow Ford. I was there too, Sergeant. Other side of the river.',
        mood: 'happy',
        when: { who: 'brannoc', standing: ['ally'] },
        cast: ['hero', 'brannoc', 'holt'],
        pose: 'shrug',
      },
      {
        speaker: 'holt',
        text: '…Were you, now. Then you owe me a pair of boots, deserter. I lost mine in that river.',
        mood: 'happy',
        when: { who: 'brannoc', standing: ['ally'] },
        pose: 'talk',
      },
      {
        speaker: 'narrator',
        text: 'The fire pops. Holt turns his little carved bird over in his fingers, the way other men worry a coin.',
        cast: ['hero', 'holt'],
      },
      { speaker: 'hero', text: 'You’re always holding that bird.', pose: 'think' },
      { speaker: 'holt', text: 'Am I? Habit, Captain. Same as the counting.', pose: 'shrug', mood: 'surprised' },
    ],
    choice: {
      prompt: 'What do you say to Holt?',
      options: [
        {
          id: 'stories',
          label: 'Share a drink, and let him tell old war stories',
          effects: {},
          outcome: 'You shared a drink with Holt and let him tell his old war stories.',
          develops: [{ who: 'holt', bond: 1 }],
          replies: [
            { speaker: 'hero', text: 'Tell me about Harrow Ford, then. The real version.', pose: 'talk', mood: 'happy' },
            { speaker: 'holt', text: 'Ha. The real version has more mud and fewer heroes. Pour, Captain, and I’ll tell it.', pose: 'talk', mood: 'happy' },
            {
              speaker: 'narrator',
              text: 'As he talks you can almost see it: rain, knee-deep mud, the river running red under a broken bridge, and the old king’s banner still flying in the current.',
              scene: 'harrow-ford',
              cast: [],
            },
            { speaker: 'narrator', text: 'He talks until the fire burns low. Not once does he mention the bird again.', scene: 'camp-night', cast: ['hero', 'holt'] },
          ],
        },
        {
          id: 'bird',
          label: 'Ask him about the carved bird',
          effects: {},
          outcome: 'You asked Holt about his carved bird. He said his son made it, long ago.',
          develops: [{ who: 'holt', learn: 'holt-bird-son' }],
          replies: [
            { speaker: 'hero', text: 'Who carved it?', pose: 'think' },
            {
              speaker: 'holt',
              text: 'My son. A long time ago. He was better with a knife than a sword. It didn’t save him.',
              mood: 'sad',
              pose: 'stand',
            },
            { speaker: 'holt', text: 'Goodnight, Captain.', pose: 'stand', mood: 'sad' },
            {
              speaker: 'narrator',
              text: 'He walks off into the dark. Later, from the far side of camp, you hear him counting under his breath.',
              cast: ['hero'],
            },
          ],
        },
        {
          id: 'early',
          label: 'Turn in early',
          effects: {},
          outcome: 'You turned in early, and left Holt alone by the fire.',
          replies: [
            { speaker: 'hero', text: 'Get some sleep, Sergeant. Long road tomorrow.', pose: 'stand' },
            { speaker: 'holt', text: 'Aye. Long road.', pose: 'stand' },
            {
              speaker: 'narrator',
              text: 'From your tent you look back once. He’s still by the fire with a folded letter, reading it twice before he feeds it to the flames.',
              cast: ['holt'],
              poses: { holt: 'think' },
            },
          ],
        },
      ],
    },
    closing: [{ speaker: 'narrator', text: 'Morning comes grey and cold, and the army marches on toward the Grey Keep.', cast: [] }],
    summary:
      'Three days after the Old Watch Fort, your army camped in a quiet valley. Holt counted the stars, spoke of forty years under the old king and of Harrow Ford, and turned his carved bird over in his fingers.',
    develops: [{ who: 'holt', learn: 'holt-harrow' }],
  },
  {
    id: 'grey-keep',
    act: 1,
    number: 2,
    title: 'The Grey Keep',
    unlockedBy: 'mordrake',
    opening: [
      {
        speaker: 'narrator',
        text: 'The Grey Keep has fallen. Snow drifts through the broken windows of Baron Mordrake’s great hall, and his banners hang in tatters.',
        scene: 'keep-hall',
        cast: [],
      },
      {
        speaker: 'holt',
        text: 'Thirty-one banners, Captain. Every one of them stitched new this spring. That’s a lord who was expecting a war.',
        cast: ['hero', 'holt'],
        pose: 'point',
      },
      {
        speaker: 'narrator',
        text: 'Mordrake waits at the head of his long table, still in his black plate, as if this were a council and not a surrender.',
        cast: ['hero', 'mordrake', 'holt'],
      },
      {
        speaker: 'mordrake',
        text: 'Ah. The conqueror. Do sit, if you like. I’m told it’s customary to be gracious in defeat, though I confess I’ve had very little practice.',
        mood: 'happy',
        pose: 'talk',
      },
      { speaker: 'hero', text: 'You armed for war all spring. Against whom?', pose: 'think' },
      { speaker: 'mordrake', text: 'Against the Ash Witch, of course. Letter after letter, all winter: she was gathering an army in the fen.', pose: 'point' },
      { speaker: 'mordrake', text: 'Unsigned, every one. I took it for a friend’s discretion.', pose: 'shrug', mood: 'sad' },
      {
        speaker: 'narrator',
        text: 'He slides a stack of letters down the table. Every seal is the same: a tiny moth, pressed in grey wax.',
      },
      { speaker: 'narrator', text: 'You break one of the seals and read the letter aloud.' },
      {
        speaker: 'hero',
        text: '“My lord. The Witch gathers in the fen. Strike before she strikes you. A friend.”',
        pose: 'think',
      },
      {
        speaker: 'mordrake',
        text: 'Every one the same. Patient. Polite. Never once asking for anything, until the steel arrived, and the bill with it.',
        mood: 'sad',
        pose: 'shrug',
      },
      { speaker: 'holt', text: 'Same hand on every one, Captain. Neat. Practised. Somebody writes a great many letters.', pose: 'think' },
      {
        speaker: 'mordrake',
        text: 'I served the old king, you know, before the end. When he fell, I swore I would never again be caught unready. You see how well that went.',
        mood: 'sad',
        pose: 'hand-on-heart',
      },
      {
        speaker: 'mordrake',
        text: 'So I bought steel. A great deal of it, from the very man who wrote these, I now suspect. I am an old fool, conqueror, but I am not a liar.',
        mood: 'sad',
        pose: 'hand-on-heart',
      },
      {
        speaker: 'brannoc',
        text: 'Funny. The Moth told my lads the Witch was coming for them too. Busy fellow.',
        mood: 'happy',
        when: { who: 'brannoc', standing: ['ally'] },
        cast: ['hero', 'brannoc', 'mordrake', 'holt'],
        pose: 'shrug',
      },
      {
        speaker: 'narrator',
        text: 'Holt isn’t listening. He is turning his little carved bird over in his fingers, lips moving.',
        cast: ['hero', 'mordrake', 'holt'],
        poses: { holt: 'think' },
      },
      { speaker: 'holt', text: 'Two hundred and twelve.', mood: 'neutral' },
      { speaker: 'hero', text: 'Two hundred and twelve what?', pose: 'think', mood: 'surprised' },
      {
        speaker: 'holt',
        text: 'Hm? Nothing, Captain. Old habit. Counting the stones in the wall.',
        mood: 'surprised',
        pose: 'shrug',
        poses: { holt: 'arms-crossed' },
      },
      { speaker: 'mordrake', text: 'So. What becomes of the Grey Keep, and of its foolish old baron?', pose: 'stand', mood: 'sad' },
    ],
    choice: {
      prompt: 'What do you do with Baron Mordrake?',
      options: [
        {
          id: 'vassal',
          label: 'Spare him, as your vassal',
          effects: { mercy: 1 },
          ally: 'mordrake',
          outcome: 'You spared Baron Mordrake and let him keep the Grey Keep as your vassal.',
          develops: [
            { who: 'mordrake', standing: 'ally', bond: 2 },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            {
              speaker: 'hero',
              text: 'Keep your hall, Baron. But your steel answers to me now, and so do your letters. If another moth arrives, I want it.',
              mood: 'stern',
              pose: 'point',
            },
            {
              speaker: 'mordrake',
              text: 'Generous. Unwisely generous, perhaps. But I do not forget generosity. I shall watch for moths.',
              mood: 'happy',
              pose: 'hand-on-heart',
            },
            { speaker: 'holt', text: 'A lord who owes you his life is worth ten who don’t, Captain. Usually.', pose: 'talk', mood: 'neutral' },
          ],
        },
        {
          id: 'exile',
          label: 'Take his keep, and send him into exile',
          effects: {},
          outcome: 'You took the Grey Keep and sent Baron Mordrake into exile.',
          develops: [{ who: 'mordrake', standing: 'free', bond: -1 }],
          replies: [
            { speaker: 'hero', text: 'The Grey Keep is mine. Take a horse and go, and don’t come back.', pose: 'point', mood: 'stern' },
            {
              speaker: 'mordrake',
              text: 'Exile. At my age. Well, the roads are full of old men with grievances. I shall be in good company.',
              mood: 'sad',
              pose: 'shrug',
            },
            { speaker: 'holt', text: 'Cold, Captain. But clean.', pose: 'arms-crossed' },
          ],
        },
        {
          id: 'execute',
          label: 'Execute him for the war he started',
          effects: { mercy: -1 },
          outcome: 'You had Baron Mordrake executed in his own hall.',
          develops: [
            { who: 'mordrake', standing: 'dead', learn: 'mordrake-warning' },
            { who: 'holt', bond: -1 },
          ],
          replies: [
            { speaker: 'hero', text: 'You bought the steel and you raised the army. That makes the war yours.', pose: 'arms-crossed', mood: 'stern' },
            {
              speaker: 'mordrake',
              text: 'Then let it be quick. And, conqueror: read your own letters closely. Whoever wrote mine knows your name too.',
              pose: 'fist',
            },
            {
              speaker: 'holt',
              text: 'Done is done, Captain. I’ve watched kings hang men for less. I’ve never liked it.',
              mood: 'sad',
              pose: 'talk',
            },
          ],
        },
      ],
    },
    closing: [
      {
        speaker: 'narrator',
        text: 'As you leave the hall, Holt slips one of the moth-sealed letters into his coat when he thinks no one is watching.',
        scene: 'keep-courtyard',
        cast: ['holt'],
        poses: { holt: 'stand' },
      },
      { speaker: 'narrator', text: 'Back at the market, Wick has saved you a seat beside his brazier.', scene: 'market', cast: [] },
      {
        speaker: 'wick',
        text: 'My friend! The conqueror of the Grey Keep, at my humble stall. I’ve put something special aside for you. Victors’ prices, of course.',
      },
    ],
    summary:
      'You took the Grey Keep. Baron Mordrake said he armed only because unsigned letters, sealed with wax moths, warned him all winter that the Ash Witch was coming for him. He bought his steel from the man who wrote them.',
    mothClues: [
      'Sent Baron Mordrake unsigned letters all winter, warning him the Ash Witch was arming against him.',
      'Seals his letters with a little moth, pressed in grey wax.',
      'Frightened Mordrake into war, then sold him the steel to fight it.',
    ],
    develops: [
      { who: 'mordrake', standing: 'prisoner', stage: 1, learn: 'mordrake-proud' },
      { who: 'mordrake', learn: 'mordrake-letters' },
      { who: 'holt', stage: 2, learn: 'holt-days' },
    ],
  },
  {
    id: 'cinder-fen',
    act: 1,
    number: 3,
    title: 'Cinder Fen',
    unlockedBy: 'witch',
    opening: [
      {
        speaker: 'narrator',
        text: 'The Cinder Fen still smoulders. Black reeds stand in black water, and ash falls like snow that never melts.',
        scene: 'cinder-fen',
        cast: [],
      },
      {
        speaker: 'narrator',
        text: 'You walk the last mile on foot. Your boots sink in ash, and here and there you pass the black shells of houses.',
        scene: 'burned-village',
        cast: ['hero', 'holt'],
      },
      { speaker: 'holt', text: 'Forty-four huts on the old maps, Captain. I count one. The rest are ash.', pose: 'point', mood: 'sad' },
      { speaker: 'narrator', text: 'Outside one of the shells lies a child’s doll, burned down to the wire.' },
      { speaker: 'hero', text: 'This wasn’t an army’s work.', pose: 'think', mood: 'sad' },
      {
        speaker: 'narrator',
        text: 'The Ash Witch waits on the steps of that last hut, a glass jar of moths in her hand. She does not bow.',
        scene: 'cinder-fen',
        cast: ['hero', 'morwen', 'holt'],
      },
      {
        speaker: 'morwen',
        text: 'So you’re the one who knocked down my last wall. Congratulations, conqueror. It was the only one still standing.',
        mood: 'stern',
        pose: 'talk',
      },
      { speaker: 'hero', text: 'Baron Mordrake swore you were raising an army against him.', pose: 'think' },
      { speaker: 'morwen', text: 'An army. Look around you. Does this look like a woman with an army?', pose: 'shrug', mood: 'stern' },
      {
        speaker: 'morwen',
        text: 'Two winters ago a trader sold me oil that never burns down. “Everlasting,” he called it. Light your fen through the longest night.',
      },
      { speaker: 'narrator', text: 'She looks out across the black water, and for a moment her voice goes quiet.' },
      {
        speaker: 'morwen',
        text: 'It burned, all right. It burned everything. My garden, my neighbours, my mother’s house. It would not go out.',
        mood: 'sad',
        pose: 'fist',
      },
      {
        speaker: 'morwen',
        text: 'I went to town for help. New lamps, new oil, new everything. Nobody had ever seen my trader. Nobody ever does.',
        mood: 'sad',
        pose: 'shrug',
      },
      {
        speaker: 'morwen',
        text: 'I’ve hunted him ever since. Moths fly toward his kind of fire, so I keep moths. Every night I let one go and follow it.',
        mood: 'stern',
      },
      { speaker: 'hero', text: 'And where do they fly?', pose: 'think' },
      { speaker: 'narrator', text: 'She uncorks the jar. A moth climbs out, circles her hand once, and flies off over the black water.' },
      { speaker: 'morwen', text: 'Toward town. Always toward town. And then I lose them among the lights.', pose: 'point' },
      {
        speaker: 'brannoc',
        text: 'So the “witch” got robbed by the same man as the rest of us. Makes a change from witches doing the robbing.',
        mood: 'happy',
        when: { who: 'brannoc', standing: ['ally'] },
        cast: ['hero', 'brannoc', 'morwen', 'holt'],
        pose: 'shrug',
      },
      {
        speaker: 'narrator',
        text: 'Morwen’s gaze moves past you and settles on Holt. It stays there a moment too long.',
        cast: ['hero', 'morwen', 'holt'],
      },
      { speaker: 'morwen', text: 'Some free advice, since you’ve taken everything else. One of yours lies to you. Every single day.', pose: 'talk', mood: 'happy' },
      {
        speaker: 'holt',
        text: 'Mind your tongue, witch. Captain, she’d say anything to save her neck.',
        pose: 'fist',
      },
      { speaker: 'morwen', text: 'Would I? Well. You’ll find out, one way or the other.', pose: 'shrug', mood: 'happy' },
      { speaker: 'morwen', text: 'So, conqueror. Burn the last of me, or don’t. Decide.', pose: 'stand', mood: 'stern' },
    ],
    choice: {
      prompt: 'What do you do with the Ash Witch?',
      options: [
        {
          id: 'trust',
          label: 'Trust her, and ask her to hunt the Moth with you',
          effects: { trust: 1, mercy: 1 },
          ally: 'morwen',
          outcome: 'You trusted the Ash Witch, Morwen, and asked her to help you hunt the Moth.',
          develops: [
            { who: 'morwen', standing: 'ally', bond: 2, romance: 1 },
            { who: 'holt', bond: -1 },
          ],
          replies: [
            {
              speaker: 'hero',
              text: 'Help me find him. Your moths and my army. Whatever he did to your fen, he’s doing to every kingdom in reach.',
              pose: 'hand-on-heart',
            },
            { speaker: 'morwen', text: '…You’re a strange sort of conqueror. Fine. I keep my moths, and you keep your sergeant away from my hut.', pose: 'talk', mood: 'surprised' },
            {
              speaker: 'morwen',
              text: 'Oh, and {hero}? You might want to wash. You’ve got half my fen on your face.',
              mood: 'happy',
              pose: 'point',
            },
            { speaker: 'holt', text: 'Your call, Captain. I’ll be counting the silverware.', pose: 'arms-crossed' },
          ],
        },
        {
          id: 'peace',
          label: 'Leave her to rebuild in peace',
          effects: { mercy: 1 },
          outcome: 'You left the Ash Witch to rebuild the Cinder Fen in peace.',
          develops: [{ who: 'morwen', standing: 'free', bond: 1 }],
          replies: [
            { speaker: 'hero', text: 'Rebuild. Nobody troubles the fen again while I hold these lands.', pose: 'talk', mood: 'happy' },
            { speaker: 'morwen', text: 'Kind. Unexpected. If my moths find him first, I’ll send one your way.', pose: 'shrug', mood: 'surprised' },
            { speaker: 'holt', text: 'Sensible, Captain. Witches and soldiers don’t mix.', pose: 'talk', mood: 'neutral' },
          ],
        },
        {
          id: 'drive-out',
          label: 'Drive her out as a witch',
          effects: { mercy: -1, trust: -1 },
          outcome: 'You drove the Ash Witch out of the Cinder Fen.',
          develops: [
            { who: 'morwen', standing: 'free', bond: -2 },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            { speaker: 'hero', text: 'Take your jars and go. The fen is mine now.', pose: 'point', mood: 'stern' },
            { speaker: 'morwen', text: 'Of course it is. Everything is somebody’s. Enjoy the ashes.', pose: 'fist', mood: 'stern' },
            { speaker: 'holt', text: 'Good riddance, Captain. Lies, she says. Lies about our own.', pose: 'arms-crossed' },
          ],
        },
      ],
    },
    closing: [
      {
        speaker: 'narrator',
        text: 'As you ride away, a moth slips free of its jar and flutters off over the black water, toward the distant lights of town.',
        cast: [],
      },
      { speaker: 'narrator', text: 'In town the market is warm and bright after the fen. Wick waves a gloved hand.', scene: 'market' },
      {
        speaker: 'wick',
        text: 'Smoke in your hair, my friend! The fen, was it? Dreadful business, that fire. I always say: never trust a light you didn’t buy from someone you know.',
      },
    ],
    summary:
      'You took the Cinder Fen and met the Ash Witch, Morwen. She was never raising an army: her fen burned on “everlasting” oil a trader sold her, and she has hunted him ever since, following moths toward his fire. She warned you that one of your own lies to you every day.',
    mothClues: [
      'Sold the Ash Witch an “everlasting” oil that burned her fen to ash and would not go out.',
      'Moths fly toward his fire. The Witch’s moths always fly toward town.',
    ],
    develops: [
      { who: 'morwen', standing: 'prisoner', stage: 1, learn: 'morwen-oil' },
      { who: 'morwen', learn: 'morwen-moths' },
      { who: 'morwen', learn: 'morwen-town' },
      { who: 'morwen', learn: 'morwen-warning' },
    ],
  },
  {
    id: 'night-watch',
    act: 1,
    number: 3,
    title: 'The Night Watch',
    interlude: true,
    streakNeeded: 7,
    opening: [
      {
        speaker: 'narrator',
        text: 'A week of good days, and the army is in fine spirits. You can’t sleep, so you walk the camp under a sky full of stars.',
        scene: 'camp-night',
        cast: ['hero'],
      },
      { speaker: 'narrator', text: 'At the edge of the firelight, a broad figure with a pipe is slipping away into the dark.' },
      { speaker: 'hero', text: 'Holt? Where are you off to at this hour?', pose: 'think', mood: 'surprised' },
      {
        speaker: 'holt',
        text: 'Checking the sentries, Captain. Thirty-two of them, and someone has to.',
        mood: 'neutral',
        cast: ['hero', 'holt'],
        pose: 'talk',
      },
      { speaker: 'narrator', text: 'He goes. You notice he is walking away from the sentry lines, not toward them.', cast: ['hero'] },
      {
        speaker: 'brannoc',
        text: 'Your sergeant goes for a lot of walks, Captain. Just saying. A man who collects debts learns to notice things.',
        mood: 'stern',
        when: { who: 'brannoc', standing: ['ally'] },
        cast: ['hero', 'brannoc'],
        pose: 'shrug',
      },
      {
        speaker: 'morwen',
        text: 'Can’t sleep either, conqueror? Come here. I want to show you something.',
        mood: 'happy',
        when: { who: 'morwen', standing: ['ally'] },
        cast: ['hero', 'morwen'],
        pose: 'talk',
      },
      {
        speaker: 'narrator',
        text: 'She uncorks a jar. A single moth climbs to the rim, hesitates, and flutters off toward the faint glow of town on the horizon.',
        scene: 'moth-hill',
        when: { who: 'morwen', standing: ['ally'] },
      },
      {
        speaker: 'morwen',
        text: 'Every night, the same way. Whoever he is, he lives among people. Somewhere warm and bright.',
        when: { who: 'morwen', standing: ['ally'] },
        pose: 'point',
      },
      {
        speaker: 'morwen',
        text: '…You’re still here. Most people get bored of moths.',
        mood: 'surprised',
        when: { who: 'morwen', standing: ['ally'] },
        pose: 'shrug',
      },
      { speaker: 'narrator', text: 'Far off, past the sentries, a single light bobs in the dark for a moment, then goes out.' },
    ],
    choice: {
      prompt: 'What do you do?',
      options: [
        {
          id: 'follow',
          label: 'Follow Holt into the dark',
          effects: {},
          outcome: 'You followed Holt into the dark, but lost him among the trees.',
          develops: [{ who: 'holt', bond: -1 }],
          replies: [
            {
              speaker: 'narrator',
              text: 'You follow at a distance, but he knows the dark better than you do. Somewhere among the trees, you lose him.',
              cast: ['hero'],
            },
            { speaker: 'narrator', text: 'When you get back, he is already by the fire, as if he had never left.', scene: 'camp-night' },
            { speaker: 'holt', text: 'Sentries all present, Captain. Thirty-two.', cast: ['hero', 'holt'], pose: 'talk', mood: 'neutral' },
          ],
        },
        {
          id: 'trust-holt',
          label: 'Let him go. He has earned your trust',
          effects: { trust: 1 },
          outcome: 'You let Holt go about his business. He had earned your trust, you thought.',
          develops: [{ who: 'holt', bond: 1 }],
          replies: [
            { speaker: 'hero', text: 'He’s earned that much.', cast: ['hero'], pose: 'stand' },
            { speaker: 'narrator', text: 'Much later you hear him come back to camp. By the sound of it, he doesn’t sleep either.' },
          ],
        },
        {
          id: 'stay',
          label: 'Stay by the fire with Morwen',
          when: { who: 'morwen', standing: ['ally'] },
          effects: {},
          outcome: 'You stayed up by the fire with Morwen, watching her moths fly toward town.',
          develops: [{ who: 'morwen', bond: 1, romance: 2 }],
          replies: [
            { speaker: 'hero', text: 'Show me another one.', cast: ['hero', 'morwen'], pose: 'talk', mood: 'happy' },
            { speaker: 'morwen', text: '…Fine. But if you tell anyone I enjoyed this, I’ll deny it.', pose: 'shrug', mood: 'happy' },
            {
              speaker: 'narrator',
              text: 'You watch moths together until the sky turns grey. Somewhere in the night Holt comes back to camp. Neither of you notices.',
            },
          ],
        },
      ],
    },
    closing: [{ speaker: 'narrator', text: 'At dawn, the army breaks camp and rides for the Red Steppe.', scene: 'camp-night', cast: [] }],
    summary:
      'After a week of good days you couldn’t sleep, and saw Holt slip away from camp “to check the sentries”, walking away from the sentry lines, not toward them.',
    develops: [{ who: 'holt', learn: 'holt-walks' }],
  },
  {
    id: 'red-steppe',
    act: 1,
    number: 4,
    title: 'The Red Steppe',
    unlockedBy: 'gorrak',
    opening: [
      {
        speaker: 'narrator',
        text: 'The Red Steppe runs to every horizon, grass the colour of rust under a bleeding sky. Gorrak’s war camp is broken, his banners trampled.',
        scene: 'steppe-camp',
        cast: [],
      },
      {
        speaker: 'narrator',
        text: 'Your riders pick their way through the camp: cold cookfires, abandoned saddles, a hundred tethered horses stamping in the wind.',
        cast: ['hero', 'holt'],
      },
      { speaker: 'hero', text: 'Where are all his riders?', pose: 'think', mood: 'surprised' },
      {
        speaker: 'holt',
        text: 'Ran when their pay stopped coming, most of them. Gold buys a horde fast, Captain, and loses it faster.',
        pose: 'shrug',
      },
      {
        speaker: 'holt',
        text: 'Nine hundred riders, and not one granary between them. They meant to eat their way across the kingdom.',
        pose: 'point',
      },
      {
        speaker: 'narrator',
        text: 'Gorrak sits on an overturned war drum: huge, bloodied, and laughing.',
        cast: ['hero', 'gorrak', 'holt'],
      },
      {
        speaker: 'gorrak',
        text: 'Ha! Gorrak is beaten! Nobody has beaten Gorrak since Gorrak was a boy. Gorrak is almost glad to meet you.',
        mood: 'happy',
        pose: 'shrug',
      },
      { speaker: 'hero', text: 'Your riders were well paid, for a horde with no granaries.', pose: 'think' },
      { speaker: 'gorrak', text: 'Paid in gold! Good gold. Fresh from the mint, still bright.', pose: 'fist', mood: 'happy' },
      {
        speaker: 'narrator',
        text: 'He flicks you a coin. It is heavy and bright, as if struck yesterday. Pressed into its face is a tiny moth.',
      },
      {
        speaker: 'holt',
        text: 'That’s not right, Captain. No kingdom has minted gold in twenty years. Not since the old king fell.',
        mood: 'surprised',
        pose: 'think',
      },
      {
        speaker: 'gorrak',
        text: 'A soft-voiced trader brought chests of it. He said: ride west, take what you like, there is plenty more where this came from.',
        mood: 'neutral',
        pose: 'talk',
      },
      {
        speaker: 'brannoc',
        text: 'Same as my lot. Swords for the deserters, gold for the horse lords. He’s buying everyone.',
        mood: 'stern',
        when: { who: 'brannoc', standing: ['ally'] },
        cast: ['hero', 'brannoc', 'gorrak', 'holt'],
        pose: 'shrug',
      },
      {
        speaker: 'morwen',
        text: 'And oil for me. One man, every side. He isn’t starting wars. He’s farming them.',
        mood: 'stern',
        when: { who: 'morwen', standing: ['ally'] },
        cast: ['hero', 'morwen', 'gorrak', 'holt'],
        pose: 'point',
      },
      {
        speaker: 'hero',
        text: 'Swords for the deserters. Letters and steel for Mordrake. Oil for the fen. Gold for you. The Moth has armed every side.',
        mood: 'stern',
        cast: ['hero', 'gorrak', 'holt'],
        pose: 'fist',
      },
      { speaker: 'gorrak', text: 'Then Gorrak was a fool’s dog, and the fool was not Gorrak.', pose: 'arms-crossed' },
      { speaker: 'gorrak', text: 'So. What will you do with Gorrak, little conqueror?', pose: 'stand', mood: 'happy' },
    ],
    choice: {
      prompt: 'What do you do with Gorrak and his horde?',
      options: [
        {
          id: 'duel',
          label: 'Face him in an honour duel',
          effects: { mercy: 1 },
          ally: 'gorrak',
          outcome: 'You beat Gorrak in an honour duel, and his riders swore to ride for you.',
          develops: [
            { who: 'gorrak', standing: 'ally', bond: 2 },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            { speaker: 'hero', text: 'Get up, then. Your strongest against mine, and I’m the strongest I’ve got.', pose: 'fist', mood: 'stern' },
            { speaker: 'gorrak', text: 'Ha! Gorrak likes you. Gorrak will go easy on you. Gorrak lies, of course.', pose: 'talk', mood: 'happy' },
            {
              speaker: 'narrator',
              text: 'A ring of riders gathers, drumming their saddles. Gorrak swings first, and the great axe hums past your ear.',
              scene: 'war-circle',
            },
            { speaker: 'holt', text: 'Low, Captain! He leans when he swings!', pose: 'point', mood: 'surprised' },
            { speaker: 'narrator', text: 'It is short, loud, and brutal. When it’s over, Gorrak lies on his back in the grass, laughing at the sky.' },
            { speaker: 'gorrak', text: 'Ha! Gorrak’s horde rides for you now. Point Gorrak at this Moth.', pose: 'hand-on-heart', mood: 'happy' },
            { speaker: 'holt', text: 'Nine hundred riders and their appetites. I’ll need a bigger ledger, Captain.', pose: 'talk', mood: 'happy' },
          ],
        },
        {
          id: 'hire',
          label: 'Pay his horde to ride for you',
          effects: { trust: -1 },
          outcome: 'You paid Gorrak’s horde to ride for you, just as the Moth once did.',
          develops: [
            { who: 'gorrak', standing: 'ally', learn: 'gorrak-wisdom' },
            { who: 'holt', bond: -1 },
          ],
          replies: [
            { speaker: 'hero', text: 'Same gold, better master. Ride for me.', pose: 'point' },
            {
              speaker: 'gorrak',
              text: 'Gold is gold. But a man who fights for coin fights for nothing. Gorrak learned that today.',
              mood: 'sad',
              pose: 'shrug',
            },
            { speaker: 'holt', text: 'Gold buys riders, Captain. It doesn’t buy loyalty. Ask the Moth.', pose: 'arms-crossed' },
          ],
        },
        {
          id: 'disband',
          label: 'Break the horde and send it home',
          effects: { mercy: 1 },
          outcome: 'You broke Gorrak’s horde and sent his riders home across the steppe.',
          develops: [{ who: 'gorrak', standing: 'free', bond: -1 }],
          replies: [
            { speaker: 'hero', text: 'No more riding west. Take your riders home, every one of them.', pose: 'point', mood: 'stern' },
            {
              speaker: 'gorrak',
              text: 'Home. Gorrak has not been home in eleven winters. …Perhaps it is time.',
              mood: 'sad',
              pose: 'arms-crossed',
            },
            { speaker: 'holt', text: 'Fewer mouths. I approve, Captain.', pose: 'talk', mood: 'happy' },
          ],
        },
      ],
    },
    closing: [
      {
        speaker: 'narrator',
        text: 'That night your army camps on the steppe. For the first time since the Old Watch Fort, there are no more lords left to fight.',
        scene: 'camp-night',
        cast: ['hero'],
      },
      {
        speaker: 'morwen',
        text: 'Four lords. One moth. We’re close now, {hero}. I can feel it, like heat before a fire.',
        mood: 'stern',
        when: { who: 'morwen', standing: ['ally'] },
        cast: ['hero', 'morwen'],
        pose: 'talk',
      },
      {
        speaker: 'gorrak',
        text: 'Gorrak has never slept so well after losing. Wake Gorrak when there is someone to hit.',
        mood: 'happy',
        when: { who: 'gorrak', standing: ['ally'] },
        cast: ['hero', 'gorrak'],
        pose: 'arms-crossed',
      },
      {
        speaker: 'narrator',
        text: 'Holt sits apart from everyone, by a small fire of his own, his carved bird in his hands, lips moving.',
        cast: ['holt'],
        poses: { holt: 'think' },
      },
      { speaker: 'holt', text: 'Two hundred and forty.', mood: 'neutral' },
      { speaker: 'narrator', text: 'You return to the market a conqueror four times over, and the whole square turns to look.', scene: 'market', cast: [] },
      {
        speaker: 'wick',
        text: 'Four victories! The fort, the keep, the fen, the steppe. My very best customer! I’ve kept the finest things back, just for you.',
      },
      {
        speaker: 'narrator',
        text: 'Four lords fell, and every one of them was armed by the same hand. Somewhere out there, the Moth is still paying.',
      },
    ],
    summary:
      'You broke Gorrak’s horde on the Red Steppe. His riders were paid in fresh gold stamped with a moth, though no kingdom has minted gold in twenty years. Swords, letters, oil, and gold: the Moth has armed every side.',
    mothClues: [
      'Paid Gorrak’s horde in fresh gold stamped with a moth, though no kingdom has minted gold since the old king fell, twenty years ago.',
      'Arms every side at once: swords for the deserters, letters and steel for Mordrake, oil for the Witch, gold for Gorrak.',
      'Speaks softly, according to Gorrak, and always promises there is plenty more.',
    ],
    develops: [
      { who: 'gorrak', standing: 'prisoner', stage: 1, learn: 'gorrak-boasts' },
      { who: 'gorrak', learn: 'gorrak-gold' },
      { who: 'holt', stage: 3, learn: 'holt-twenty' },
    ],
  },
  {
    id: 'salt-road',
    act: 2,
    number: 5,
    title: 'The Salt Road',
    unlockedBy: 'salt-road',
    opening: [
      {
        speaker: 'narrator',
        text: 'The Salt Road runs white and straight across the flats. The old toll fort is yours now, and the Company’s banner lies in the dust.',
        scene: 'salt-road',
        cast: [],
      },
      {
        speaker: 'holt',
        text: 'Ninety-four prisoners, Captain. I counted twice. And not one of them looks surprised to see us.',
        cast: ['hero', 'holt'],
        pose: 'point',
      },
      { speaker: 'hero', text: 'Every ambush on this road landed on the right day. How did they keep finding our patrols?', pose: 'think' },
      { speaker: 'narrator', text: 'In the Company’s strongbox: pay chests stamped with a moth, and one folded page.' },
      { speaker: 'hero', text: '“Thirty-two sentries. Changed at moonrise. North side weakest.”', pose: 'think', mood: 'surprised' },
      { speaker: 'holt', text: 'Same hand as the Baron’s letters, Captain. Neat. Practised. Somebody writes a great many letters.', pose: 'think' },
      { speaker: 'hero', text: 'Thirty-two. That’s our number.', mood: 'stern' },
      { speaker: 'holt', text: 'Aye. I ought to know. I’m the one who counts them.', pose: 'shrug', mood: 'neutral' },
      { speaker: 'narrator', text: 'He looks at the page a moment longer than he needs to, then hands it back.' },
      { speaker: 'hero', text: 'This pay still smells of the furnace.', pose: 'think' },
      { speaker: 'holt', text: 'Then the furnace is close, Captain. A mint needs fire, water, and men who don’t talk. Find those, and you’ve found the Moth’s purse.', pose: 'point', mood: 'neutral' },
      {
        speaker: 'morwen',
        text: 'I did tell you, conqueror. One of yours lies to you. Every single day.',
        when: { who: 'morwen', standing: ['ally'] },
        cast: ['hero', 'holt', 'morwen'],
        pose: 'talk',
        mood: 'stern',
      },
      {
        speaker: 'holt',
        text: 'And I told you to mind your tongue, witch.',
        when: { who: 'morwen', standing: ['ally'] },
        pose: 'arms-crossed',
      },

      {
        speaker: 'narrator',
        text: 'Brannoc has been quiet all morning. He sits on a pay chest, turning his old coin over and over, a fresh moth-stamped one in his other hand.',
        when: { who: 'brannoc', standing: ['ally'] },
        cast: ['hero', 'brannoc', 'holt'],
      },
      { speaker: 'brannoc', text: 'Captain. You’ve heard me talk about this coin. Last wage the old king ever paid me.', when: { who: 'brannoc', standing: ['ally'] }, mood: 'sad' },
      { speaker: 'brannoc', text: 'Twenty years I’ve flipped it. Never once held it next to the Moth’s gold in good light.', when: { who: 'brannoc', standing: ['ally'] } },
      { speaker: 'narrator', text: 'Worn nearly smooth, right under the old king’s ear: a tiny moth.', when: { who: 'brannoc', standing: ['ally'] } },
      { speaker: 'holt', text: 'That’s not right. That coin came from the king’s own mint. I stood guard on it.', when: { who: 'brannoc', standing: ['ally'] }, pose: 'point', mood: 'surprised' },
      { speaker: 'hero', text: 'Then the Moth was paying the old king too.', when: { who: 'brannoc', standing: ['ally'] }, pose: 'think' },
      { speaker: 'brannoc', text: 'I told you that kind wants paying eventually. Never thought to ask who he’d been paying first.', when: { who: 'brannoc', standing: ['ally'] }, pose: 'shrug', mood: 'sad' },
      { speaker: 'narrator', text: 'Holt says nothing. His hand has gone to the little bird at his belt.', when: { who: 'brannoc', standing: ['ally'] } },

      {
        speaker: 'narrator',
        text: 'The prisoners shuffle aside. Their captain is a gaunt man with one ear, turning a battered coin in his bound fingers.',
        when: { who: 'brannoc', standing: ['free'] },
        cast: ['hero', 'brannoc', 'holt'],
        poses: { brannoc: 'bound' },
      },
      { speaker: 'brannoc', text: '“Unarmed, on roads like these.” You remember saying that, {hero}? I do. Turns out a road gives you a sword, if you stand on it long enough.', when: { who: 'brannoc', standing: ['free'] }, mood: 'happy' },
      { speaker: 'hero', text: 'You said you wouldn’t forget your debt.', when: { who: 'brannoc', standing: ['free'] }, pose: 'point', mood: 'stern' },
      { speaker: 'brannoc', text: 'And I haven’t. The Moth’s people asked me where to hit you. I told them your north side was weakest. It’s your strongest. I checked.', when: { who: 'brannoc', standing: ['free'] }, mood: 'happy' },
      { speaker: 'brannoc', text: 'That’s the debt, paid in full. Somebody else gave them the rest of that page.', when: { who: 'brannoc', standing: ['free'] }, mood: 'neutral' },
      { speaker: 'holt', text: 'A bandit’s word, Captain. I’ve counted what those are worth.', when: { who: 'brannoc', standing: ['free'] }, pose: 'arms-crossed' },
      { speaker: 'brannoc', text: 'So, {hero}. Second time you’ve had me in ropes. I’d flip you for it, but this time I think you might take the bet.', when: { who: 'brannoc', standing: ['free'] }, mood: 'happy' },

      {
        speaker: 'narrator',
        text: 'Twenty prisoners stand apart from the rest, in the old king’s faded colours. Each has a length of rope knotted around his sword arm.',
        when: { who: 'brannoc', standing: ['dead'] },
      },
      { speaker: 'narrator', text: '“He said to remember him when the Moth came to collect,” their sergeant says. “Has he come for you yet?”', when: { who: 'brannoc', standing: ['dead'] } },
      { speaker: 'hero', text: 'Brannoc’s men. Where did you get all this steel?', when: { who: 'brannoc', standing: ['dead'] }, pose: 'think', mood: 'stern' },
      { speaker: 'narrator', text: '“Same place as before. A soft-voiced trader. He bought the Captain’s coin from your hangman, too. Paid in fresh gold.”', when: { who: 'brannoc', standing: ['dead'] } },
      { speaker: 'holt', text: 'A hard call, I said, Captain. It’s still hard. A coin’s a strange thing to buy off a dead man.', when: { who: 'brannoc', standing: ['dead'] }, pose: 'think', mood: 'sad' },
    ],
    choice: {
      prompt: 'What do you do?',
      options: [
        {
          id: 'tell-army',
          label: 'Tell the army what the coin means',
          effects: { trust: 1 },
          when: { who: 'brannoc', standing: ['ally'] },
          outcome: 'You told the army the old king’s gold bore the Moth’s mark.',
          develops: [
            { who: 'brannoc', bond: 1, learn: 'brannoc-mark' },
            { who: 'holt', bond: -1 },
          ],
          replies: [
            { speaker: 'hero', text: 'They fought for that king’s memory. They should know who was paying him.', cast: ['hero', 'brannoc', 'holt'], pose: 'talk' },
            { speaker: 'brannoc', text: 'Won’t make you popular. Never stopped you yet.', pose: 'shrug', mood: 'happy' },
            { speaker: 'holt', text: 'Forty years, Captain. Forty years, and you’ll say that to their faces. …As you say.', pose: 'arms-crossed', mood: 'sad' },
          ],
        },
        {
          id: 'keep-quiet',
          label: 'Keep it between the three of you',
          effects: {},
          when: { who: 'brannoc', standing: ['ally'] },
          outcome: 'You kept the mark on the old king’s coin a secret.',
          develops: [
            { who: 'brannoc', learn: 'brannoc-mark' },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            { speaker: 'hero', text: 'Not a word. An army can only lose one king at a time.', cast: ['hero', 'brannoc', 'holt'], pose: 'stand' },
            { speaker: 'holt', text: 'Thank you, Captain. Truly.', pose: 'hand-on-heart', mood: 'sad' },
            { speaker: 'brannoc', text: 'Three people can keep a secret. I knew a man who said that. He’s dead, but he did say it.', pose: 'shrug', mood: 'happy' },
          ],
        },
        {
          id: 'enlist-late',
          label: 'Offer him a place in your army',
          effects: { mercy: 1 },
          ally: 'brannoc',
          when: { who: 'brannoc', standing: ['free'] },
          outcome: 'You took Brannoc into your army, the second time you held his life.',
          develops: [
            { who: 'brannoc', standing: 'ally', bond: 2, learn: 'brannoc-debt-paid' },
            { who: 'holt', bond: -1 },
          ],
          replies: [
            { speaker: 'hero', text: 'The debt’s paid. So here’s a new one. March with me.', cast: ['hero', 'brannoc', 'holt'], pose: 'talk' },
            { speaker: 'brannoc', text: 'Well. That’s the first time anyone’s offered me a second chance twice.', pose: 'hand-on-heart', poses: { brannoc: 'stand' }, moods: { brannoc: 'happy' } },
            { speaker: 'holt', text: 'Ninety-five mouths, then. Wonderful. I’ll keep my good eye on him, Captain. Same one as last time.', pose: 'arms-crossed' },
          ],
        },
        {
          id: 'let-go',
          label: 'Let him walk. The debt is paid',
          effects: {},
          when: { who: 'brannoc', standing: ['free'] },
          outcome: 'You let Brannoc walk free again, his debt paid.',
          develops: [{ who: 'brannoc', bond: 1, learn: 'brannoc-debt-paid' }],
          replies: [
            { speaker: 'hero', text: 'Paid in full, you said. Then we’re even. Get off my road.', cast: ['hero', 'brannoc', 'holt'], pose: 'point' },
            { speaker: 'brannoc', text: 'Even. There’s a word I’ve never had much use for. Mind that page, {hero}. It wasn’t me.', pose: 'shrug', poses: { brannoc: 'stand' }, mood: 'neutral' },
          ],
        },
        {
          id: 'law',
          label: 'Hand him over to the law at last',
          effects: { mercy: -1 },
          when: { who: 'brannoc', standing: ['free'] },
          outcome: 'You handed Brannoc over to the law.',
          develops: [
            { who: 'brannoc', standing: 'dead', learn: 'brannoc-debt-paid' },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            { speaker: 'hero', text: 'I warned you I wouldn’t be this kind twice.', cast: ['hero', 'brannoc', 'holt'], pose: 'arms-crossed', mood: 'stern' },
            { speaker: 'brannoc', text: 'So you did. Keep the coin, {hero}. Heads you were right. Tails you’ll find out.', pose: 'fist', mood: 'sad' },
          ],
        },
        {
          id: 'free-twenty',
          label: 'Free the twenty. Enough rope',
          effects: { mercy: 1 },
          when: { who: 'brannoc', standing: ['dead'] },
          outcome: 'You freed the twenty men who once followed Brannoc.',
          develops: [{ who: 'brannoc', learn: 'brannoc-coin-sold' }],
          replies: [
            { speaker: 'hero', text: 'Cut those ropes. Go home, all of you. There’s been enough hanging.', cast: ['hero', 'holt'], pose: 'talk', mood: 'sad' },
            { speaker: 'holt', text: 'They won’t thank you, Captain. But I’ll write it down.', pose: 'shrug', mood: 'neutral' },
          ],
        },
        {
          id: 'chain-twenty',
          label: 'Keep them in chains',
          effects: { mercy: -1 },
          when: { who: 'brannoc', standing: ['dead'] },
          outcome: 'You kept Brannoc’s twenty men in chains.',
          develops: [
            { who: 'brannoc', learn: 'brannoc-coin-sold' },
            { who: 'holt', bond: 1 },
          ],
          replies: [
            { speaker: 'hero', text: 'They chose this road twice. Chain them.', cast: ['hero', 'holt'], pose: 'arms-crossed', mood: 'stern' },
            { speaker: 'holt', text: 'Twenty more to feed. The law’s the law, Captain.', pose: 'talk' },
          ],
        },
      ],
    },
    closing: [
      {
        speaker: 'narrator',
        text: 'On the road back, a boy of about nine runs beside your column selling twists of salt. Holt stops walking, and stares after him until he’s out of sight.',
        cast: ['hero', 'holt'],
      },
      { speaker: 'hero', text: 'Someone you know?', pose: 'think' },
      { speaker: 'holt', text: 'No, Captain. Nobody. Nine, I’d say. About nine.', pose: 'stand', mood: 'sad' },
      { speaker: 'narrator', text: 'That night you double the guard on the north side, and change the watch at dusk instead of moonrise. Nobody but your officers is told.', cast: [] },
      {
        speaker: 'narrator',
        text: 'You find Holt at your own gate after dark, an oil can in his hand, working each hinge in turn.',
        cast: ['hero', 'holt'],
        poses: { holt: 'think' },
      },
      { speaker: 'holt', text: 'A squealing gate wakes the whole camp, Captain. A good one opens quiet.', pose: 'shrug', mood: 'neutral' },
      { speaker: 'narrator', text: 'He goes back to his hinges, lips moving.', cast: ['holt'] },
      { speaker: 'holt', text: 'Two hundred and fifty-nine.', mood: 'neutral' },
      {
        speaker: 'narrator',
        text: 'Morwen’s moths won’t settle tonight. Every one of them presses against the same side of the jar.',
        when: { who: 'morwen', standing: ['ally'] },
        cast: ['hero', 'morwen'],
      },
      {
        speaker: 'morwen',
        text: 'They’ve never been this eager. Whatever they’re flying toward, it’s close, and I don’t think it’s afraid of us.',
        when: { who: 'morwen', standing: ['ally'] },
        pose: 'think',
        mood: 'stern',
      },
      {
        speaker: 'narrator',
        text: 'A rider comes in from the Grey Keep with a note in the Baron’s stiff hand. “A moth has come. I shall bring it to you myself.”',
        when: { who: 'mordrake', standing: ['ally'] },
        cast: [],
      },
      {
        speaker: 'narrator',
        text: 'Your scouts mention an old man on a good horse, asking the way to your camp. Very polite, they say. He had a crown’s worth of grievances and no crown.',
        when: { who: 'mordrake', standing: ['free'] },
        cast: [],
      },
      {
        speaker: 'narrator',
        text: 'You read the page once more, closely, as the Baron told you to before he died. At the very bottom, small and neat: “{hero}.”',
        when: { who: 'mordrake', standing: ['dead'] },
        cast: [],
      },
      { speaker: 'narrator', text: 'Salt wagons roll into the market again, and the square smells of the road.', scene: 'market', cast: [] },
      { speaker: 'wick', text: 'The Salt Road open again, my friend! You can’t imagine the relief. I’d almost forgotten what it is to be paid on time.' },
    ],
    summary:
      'You took the toll fort on the Salt Road. In the Company’s strongbox: moth-stamped pay, and a page in the Baron’s letter-writer’s hand listing your own sentries, thirty-two of them. Someone is counting for the Moth.',
    mothClues: [
      'Paid the Salt Road Company to hunt your patrols, and knew exactly where they would be.',
      'Has a list of your own sentries, written in the same neat hand as Mordrake’s letters.',
      'Someone close enough to count your sentries is telling the Moth the number.',
    ],
    develops: [{ who: 'holt', stage: 4 }],
  },
]

/** The chapter before this one, which has to be read first so the story stays in order. */
function previousChapter(chapter: Chapter): Chapter | undefined {
  return CHAPTERS[CHAPTERS.indexOf(chapter) - 1]
}

/** How a chapter is named: "Chapter 2", or "Interlude" for the quiet ones between. */
export function chapterLabel(chapter: Chapter): string {
  return chapter.interlude ? 'Interlude' : `Chapter ${chapter.number}`
}

/** Whether the battle or the habit that opens this chapter has happened. */
function earned(chapter: Chapter, war: WarRecord, bestStreak: number): boolean {
  return (!chapter.unlockedBy || war.beaten.includes(chapter.unlockedBy)) && bestStreak >= (chapter.streakNeeded ?? 0)
}

/** What opens a chapter, e.g. "Defeat the Ash Witch", "Reach a 3-day streak", or "Read Chapter 1". */
export function unlockHint(chapter: Chapter, war: WarRecord, story: StoryState, bestStreak = 0): string {
  if (earned(chapter, war, bestStreak)) {
    const before = previousChapter(chapter)
    if (before && !story.read.includes(before.id)) {
      return before.interlude ? `Read “${before.title}”` : `Read ${chapterLabel(before)}`
    }
  }
  if (chapter.streakNeeded && bestStreak < chapter.streakNeeded) {
    return `Reach a ${chapter.streakNeeded}-day streak`
  }
  const name = (rivalById(chapter.unlockedBy ?? '')?.name ?? 'a rival').replace(/^The /, 'the ')
  return `${chapter.unlockedBy === PRACTICE_RIVAL.id ? 'Take' : 'Defeat'} ${name}`
}

export type ChapterStatus = 'locked' | 'unwritten' | 'new' | 'read'

export function chapterStatus(chapter: Chapter, war: WarRecord, story: StoryState, bestStreak = 0): ChapterStatus {
  const before = previousChapter(chapter)
  if (!earned(chapter, war, bestStreak) || (before && !story.read.includes(before.id))) {
    return 'locked'
  }
  if (chapter.opening.length === 0) {
    return 'unwritten'
  }
  return story.read.includes(chapter.id) ? 'read' : 'new'
}

/** The lines of a chapter in reading order: everything up to the choice, then (once chosen) the replies and the close. */
export function chapterScript(
  chapter: Chapter,
  choiceId: string | undefined,
  cast: CastState = newCastState(),
): { lines: StoryLine[]; choiceAt: number | null } {
  // Lines meant for other paths through the story drop out. Lines after the choice see what the chapter itself
  // changed, so someone who joins the hero in this chapter can speak at its close.
  const playing = (lines: readonly StoryLine[], state: CastState) => lines.filter((line) => !line.when || meets(line.when, state))
  const option = chapter.choice?.options.find(({ id }) => id === choiceId)
  const after = [...(chapter.develops ?? []), ...(option?.develops ?? [])].reduce(develop, cast)
  const opening = playing(chapter.opening, cast)
  if (!chapter.choice) {
    return { lines: [...opening, ...playing(chapter.closing, after)], choiceAt: null }
  }
  return {
    lines: option ? [...opening, ...playing(option.replies, after), ...playing(chapter.closing, after)] : opening,
    choiceAt: opening.length,
  }
}

/**
 * Where every character stands, from the chapters the hero has read and the choices made in them, in story order.
 * Pass a chapter id to see the cast as it was just before that chapter, which is how the chapter is staged.
 */
export function castState(story: StoryState, beforeChapterId?: string): CastState {
  let cast = newCastState()
  for (const chapter of CHAPTERS) {
    if (chapter.id === beforeChapterId) {
      break
    }
    if (!story.read.includes(chapter.id)) {
      continue
    }
    const option = chapter.choice?.options.find(({ id }) => id === story.choices[chapter.id])
    for (const change of [...(chapter.develops ?? []), ...(option?.develops ?? [])]) {
      cast = develop(cast, change)
    }
  }
  return cast
}

export interface Staging {
  scene: SceneId
  cast: Actor[]
  /** What each character on stage is doing at this line. */
  poses: Record<Actor, Pose>
  /** How each character on stage looks at this line. */
  moods: Record<Actor, Expression>
}

/**
 * Where the story stands at a given line: the latest scene, cast, and held poses and moods, plus the speaker's pose and
 * mood for the line.
 */
export function stagingAt(lines: readonly StoryLine[], index: number): Staging {
  let scene: SceneId = 'fort-yard'
  let cast: Actor[] = []
  let heldPoses: Record<Actor, Pose> = { ...RESTING_POSES }
  let heldMoods: Record<Actor, Expression> = { ...RESTING_MOODS }
  for (const line of lines.slice(0, index + 1)) {
    scene = line.scene ?? scene
    cast = line.cast ?? cast
    heldPoses = { ...heldPoses, ...line.poses }
    heldMoods = { ...heldMoods, ...line.moods }
  }
  const line = lines[index]
  const speaker = line && line.speaker !== 'narrator' ? line.speaker : null
  const poses = speaker && line.pose ? { ...heldPoses, [speaker]: line.pose } : heldPoses
  const moods = speaker && line.mood ? { ...heldMoods, [speaker]: line.mood } : heldMoods
  return { scene, cast, poses, moods }
}

/** Records a choice; choices are final, so a second one for the same chapter is ignored. */
export function chooseOption(story: StoryState, chapterId: string, optionId: string): StoryState {
  const chapter = CHAPTERS.find(({ id }) => id === chapterId)
  if (story.choices[chapterId] || !chapter?.choice?.options.some(({ id }) => id === optionId)) {
    return story
  }
  return { ...story, choices: { ...story.choices, [chapterId]: optionId } }
}

export function markRead(story: StoryState, chapterId: string): StoryState {
  return story.read.includes(chapterId) ? story : { ...story, read: [...story.read, chapterId] }
}

/** Adds up what the hero's choices have shown about them so far. */
export function storyScores(story: StoryState): Record<StoryScore, number> & { allies: string[] } {
  const totals = { mercy: 0, trust: 0, allies: [] as string[] }
  for (const chapter of CHAPTERS) {
    const option = chapter.choice?.options.find(({ id }) => id === story.choices[chapter.id])
    if (!option) {
      continue
    }
    totals.mercy += option.effects.mercy ?? 0
    totals.trust += option.effects.trust ?? 0
    if (option.ally) {
      totals.allies.push(option.ally)
    }
  }
  return totals
}

/** Rebuilds story progress from saved data, keeping only chapters and choices that exist. */
export function sanitizeStoryState(value: unknown): StoryState {
  if (typeof value !== 'object' || value === null) {
    return newStoryState()
  }
  const saved = value as Record<string, unknown>
  let story = newStoryState()
  if (typeof saved.choices === 'object' && saved.choices !== null) {
    for (const [chapterId, optionId] of Object.entries(saved.choices)) {
      if (typeof optionId === 'string') {
        story = chooseOption(story, chapterId, optionId)
      }
    }
  }
  if (Array.isArray(saved.read)) {
    for (const chapterId of saved.read) {
      if (CHAPTERS.some(({ id }) => id === chapterId)) {
        story = markRead(story, chapterId)
      }
    }
  }
  return story
}
