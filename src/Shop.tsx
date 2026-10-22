import { useCallback, useEffect, useMemo, useState } from 'react'
import './Shop.css'
import { levelProgress, rankName } from './game'
import type { Appearance, Hero } from './hero'
import { marketChatter, wickGreetings, wickThanks } from './clues'
import Emblem from './Emblem'
import ItemSprite from './ItemSprite'
import MarketScene from './MarketScene'
import Portrait from './Portrait'
import TypedText from './TypedText'
import {
  SHOP_ITEMS,
  checkPurchase,
  maxOwned,
  ownedCount,
  seededRandom,
  stockLeft,
  type PurchaseCheck,
  type ShopCategory,
  type ShopItem,
} from './wares'

const GREETINGS = [
  'Ah, a customer. Coin speaks louder than prayers, traveller. Have a look at what’s on the counter.',
  'Wares from beyond the fog. Look all you like, but mind the price.',
  'Fresh stock at every dawn. What sells, sells. What doesn’t, rots.',
  'Sweat earns coin, and coin builds kingdoms. Come, see what I carry.',
]

const THANKS = [
  'A fine purchase. May it outlast you.',
  'Pleasure doing business. Mind the fog on your way out.',
  'Sold! Spend wisely.',
]

const CHATTER = [
  'Fresh bread! Only slightly cursed!',
  'Did you hear? Something stirs in the old crypt…',
  'Wick’s prices are robbery, I tell you.',
  'My cousin saved a whole moon for a gold statue.',
  'Mind your purse, traveller.',
  'Mind the cobbles. They bite.',
  'Ale! Who wants ale?',
  'They say the lantern merchant never sleeps.',
  'Another hero? We’ll see how long this one lasts.',
  'Ran the long road to market again. My legs!',
  'Smith says the iron’s good this year.',
]

const BROWSE: Record<ShopCategory, { ask: string; reply: string; counterLabel: string }> = {
  kingdom: {
    ask: 'Show me your buildings',
    reply: 'Buildings. Every kingdom starts with one stone.',
    counterLabel: 'Buildings on the counter',
  },
  gear: {
    ask: 'Show me your gear',
    reply: 'Gear, then. Steel and leather, mostly. Some of it was even cleaned. Pick a piece and I’ll hold up the mirror.',
    counterLabel: 'Gear on the counter',
  },
  potion: {
    ask: 'Show me your potions',
    reply: 'Potions, then. Strong stuff. They won’t do the work for you, mind.',
    counterLabel: 'Potions on the counter',
  },
  training: {
    ask: 'Train my scouts',
    reply: 'Scouts, eh? I know people who know people. Better eyes win sieges, and they last forever.',
    counterLabel: 'Scout training on the counter',
  },
}

const BIG_PURCHASE_CHATTER = ['Look at that one, spending like a lord!', 'Coin to burn, eh?', 'Hah! Wick’ll sleep well tonight.']

/** Where townsfolk call out from, as percentages of the scene. */
const CHATTER_SPOTS = [
  { left: 3, top: 22 },
  { left: 60, top: 28 },
  { left: 4, top: 58 },
  { left: 58, top: 62 },
] as const

const CHATTER_INTERVAL_MS = 5000

interface Chatter {
  id: number
  text: string
  spot: number
}

function pickLine(lines: readonly string[], seed: string): string {
  return lines[Math.floor(seededRandom(seed) * lines.length)]
}

/** What the merchant says when the hero can't buy something. */
function refusal(check: Exclude<PurchaseCheck, 'ok'>, item: ShopItem, hero: Hero): string {
  switch (check) {
    case 'locked':
      return `That’s not for a mere ${rankName(levelProgress(hero.game.totalXp).level)}. Return when you reach level ${item.minLevel}.`
    case 'max-owned':
      if (item.trainingRank) {
        return 'Your scouts already know everything that lesson can teach.'
      }
      return item.equipSlot ? `You already own the ${item.name}. One is plenty.` : `Your land has no room for another ${item.name}.`
    case 'needs-training':
      return `Walk before you run. Your scouts need rank ${(item.trainingRank ?? 1) - 1} first.`
    case 'sold-out':
      return item.rarity === 'legendary'
        ? `None today. Wares like that only find me some days. Check back at dawn.`
        : `Sold out, I’m afraid. The fog brings new stock at dawn.`
    case 'too-poor':
      return `${item.price} coins, and you carry ${hero.game.coins}. Go sweat for the rest.`
  }
}

/** Wick's pitch for an item, including whether you can have it. */
function describe(item: ShopItem, hero: Hero, today: string): string {
  const check = checkPurchase(hero.game, hero.holdings, item, today)
  if (check !== 'ok') {
    return `The ${item.name}. ${item.description} ${refusal(check, item, hero)}`
  }
  const left = stockLeft(hero.holdings, item, today)
  const owned = item.tiles ? ` You own ${ownedCount(hero.holdings, item)} of ${maxOwned(item)}.` : item.equipSlot ? ' Suits you, I’d say.' : ''
  const scarcity = item.rarity === 'legendary' ? ' I won’t have another for a while.' : ` ${left} left today.`
  return `The ${item.name}. ${item.description}${scarcity}${owned} Yours for ${item.price} coins.`
}

/** The hero's appearance with one piece of gear swapped in, for trying it on. */
function wearing(appearance: Appearance, item: ShopItem): Appearance {
  return item.equipSlot ? ({ ...appearance, [item.equipSlot]: item.id } as Appearance) : appearance
}

interface ShopProps {
  hero: Hero
  today: string
  onBuy: (itemId: string) => PurchaseCheck
}

function Shop({ hero, today, onBuy }: ShopProps) {
  const [category, setCategory] = useState<ShopCategory>('kingdom')
  const [selected, setSelected] = useState<ShopItem | null>(null)
  const [speech, setSpeech] = useState(() => ({ id: 0, text: pickLine([...GREETINGS, ...wickGreetings(hero.story)], `${today}:greeting`) }))
  const [doneSpeaking, setDoneSpeaking] = useState(false)
  const [chatter, setChatter] = useState<Chatter | null>(null)
  const [merchantPleased, setMerchantPleased] = useState(false)
  const [revealedGear, setRevealedGear] = useState<ShopItem | null>(null)

  const chatterLines = useMemo(() => [...CHATTER, ...marketChatter(hero.story)], [hero.story])

  // Townsfolk call out every few seconds.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setChatter((previous) => {
        const id = (previous?.id ?? 0) + 1
        return { id, text: pickLine(chatterLines, `${today}:${id}`), spot: id % CHATTER_SPOTS.length }
      })
    }, CHATTER_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [today, chatterLines])

  useEffect(() => {
    if (!merchantPleased) {
      return
    }
    const timer = window.setTimeout(() => setMerchantPleased(false), 1500)
    return () => window.clearTimeout(timer)
  }, [merchantPleased])

  const markDoneSpeaking = useCallback(() => setDoneSpeaking(true), [])

  function say(text: string) {
    setSpeech((previous) => ({ id: previous.id + 1, text }))
    setDoneSpeaking(false)
  }

  function handleItemTap(item: ShopItem) {
    setSelected(item)
    say(describe(item, hero, today))
  }

  function handleBuy(item: ShopItem) {
    const result = onBuy(item.id)
    setSelected(null)
    if (result !== 'ok') {
      say(refusal(result, item, hero))
      return
    }
    say(item.equipSlot ? `Wear it well. The ${item.name} has found its owner.` : pickLine([...THANKS, ...wickThanks(hero.story)], `${today}:${item.id}:${hero.game.coins}`))
    setMerchantPleased(true)
    if (item.equipSlot) {
      setRevealedGear(item)
    }
    if (item.price >= 200) {
      setChatter((previous) => {
        const id = (previous?.id ?? 0) + 1
        return { id, text: pickLine(BIG_PURCHASE_CHATTER, `${today}:${id}`), spot: id % CHATTER_SPOTS.length }
      })
    }
  }

  function handleSomethingElse() {
    setSelected(null)
    say('Something else, then. Take your time. I’m not going anywhere.')
  }

  function handleBrowse(next: ShopCategory) {
    setCategory(next)
    setSelected(null)
    say(BROWSE[next].reply)
  }

  function handleAskRare() {
    setSelected(null)
    const rareToday = SHOP_ITEMS.filter((item) => item.rarity === 'legendary' && stockLeft(hero.holdings, item, today) > 0)
    say(
      rareToday.length === 0
        ? 'Nothing rare today. The fog was stingy. Ask me again tomorrow.'
        : `You’re in luck. Today I carry the ${rareToday.map((item) => item.name).join(' and the ')}. Don’t dawdle.`,
    )
  }

  const selectedCheck = selected ? checkPurchase(hero.game, hero.holdings, selected, today) : null

  return (
    <div className="shop">
      <div className="market">
        <MarketScene merchantPleased={merchantPleased} />
        <p className="purse" aria-label={`Your purse: ${hero.game.coins} coins`}>
          <span className="coin-icon" aria-hidden="true" /> {hero.game.coins}
        </p>
        {chatter && (
          <p
            key={chatter.id}
            className="chatter"
            style={{ left: `${CHATTER_SPOTS[chatter.spot].left}%`, top: `${CHATTER_SPOTS[chatter.spot].top}%` }}
            aria-hidden="true"
          >
            {chatter.text}
          </p>
        )}
      </div>

      <div className="counter" role="list" aria-label={BROWSE[category].counterLabel}>
        {SHOP_ITEMS.filter((item) => item.category === category).map((item) => {
          const check = checkPurchase(hero.game, hero.holdings, item, today)
          const status =
            check === 'locked'
              ? `Lv ${item.minLevel}`
              : check === 'needs-training'
                ? 'Locked'
                : check === 'sold-out'
                  ? 'Sold'
                  : check === 'max-owned'
                    ? item.trainingRank
                      ? 'Done'
                      : 'Full'
                    : null
          return (
            <div key={item.id} role="listitem">
              <button
                type="button"
                className={`counter-item rarity-${item.rarity}${selected?.id === item.id ? ' selected' : ''}${check === 'ok' || check === 'too-poor' ? '' : ' unavailable'}`}
                aria-label={`${item.name}, ${item.price} coins${status ? `, ${check.replace('-', ' ')}` : ''}`}
                onClick={() => handleItemTap(item)}
              >
                <Emblem tone={item.rarity} className="counter-emblem">
                  <ItemSprite itemId={item.id} />
                </Emblem>
                <span className="price-tag" aria-hidden="true">
                  {status ?? item.price}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <section className="dialogue" aria-label="Wick, the Lantern Merchant">
        <p className="dialogue-name">Wick, the Lantern Merchant</p>
        <div className="dialogue-body">
          {selected?.equipSlot && (
            <figure className="mirror">
              <Portrait
                appearance={wearing(hero.appearance, selected)}
                framing={selected.equipSlot === 'hat' ? 'face' : 'bust'}
                className="mirror-portrait"
                label={`You, trying on the ${selected.name}`}
              />
              <figcaption>Trying it on</figcaption>
            </figure>
          )}
          <div className="dialogue-text" aria-live="polite">
            <TypedText key={speech.id} text={speech.text} onDone={markDoneSpeaking} />
          </div>
        </div>
        <div className={`choices${doneSpeaking ? ' visible' : ''}`}>
          {selected ? (
            <>
              {selectedCheck === 'ok' && (
                <button type="button" className="choice choice-buy" onClick={() => handleBuy(selected)}>
                  Buy it ({selected.price} coins)
                </button>
              )}
              <button type="button" className="choice" onClick={handleSomethingElse}>
                Something else
              </button>
            </>
          ) : (
            <>
              {(Object.keys(BROWSE) as ShopCategory[])
                .filter((key) => key !== category)
                .map((key) => (
                  <button key={key} type="button" className="choice" onClick={() => handleBrowse(key)}>
                    {BROWSE[key].ask}
                  </button>
                ))}
              <button type="button" className="choice" onClick={handleAskRare}>
                Anything rare today?
              </button>
            </>
          )}
        </div>
      </section>

      {revealedGear && (
        <div className="overlay" onClick={() => setRevealedGear(null)}>
          <div
            className="sheet reveal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reveal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <Portrait appearance={hero.appearance} className="reveal-portrait" label={`${hero.name}, wearing the ${revealedGear.name}`} />
            <h2 id="reveal-title">Wear it well</h2>
            <p>
              The {revealedGear.name} is yours, and you’re wearing it now. Change your look any time under <strong>Heroes → Edit</strong>.
            </p>
            <button type="button" className="button-primary full" onClick={() => setRevealedGear(null)}>
              Back to the market
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Shop
