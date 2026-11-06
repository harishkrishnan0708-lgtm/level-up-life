import { useState } from 'react'
import type { Hero } from './hero'
import type { KingdomSnapshot } from './pvp'
import { addItem, canGive, decodeItem, encodeItems, itemName, removeItem, tradeableItems, type Inventory, type Trade, type TradeItem } from './trades'

type Online = typeof import('./online')

/** Changes the active hero's pets and costumes; returns false if the change no longer applies. */
export type ChangeInventory = (change: (hero: Hero) => Inventory | null) => boolean

const describe = (item: TradeItem | null) => (item ? itemName(item) : 'nothing (a gift)')

interface OfferProps {
  hero: Hero
  online: Online
  friendUid: string
  friend: KingdomSnapshot
  onInventory: ChangeInventory
  onSent: () => void
}

/** Offers a friend one of your pets or costume pieces, as a gift or for one of theirs. */
export function TradeOffer({ hero, online, friendUid, friend, onInventory, onSent }: OfferProps) {
  const mine = tradeableItems(hero)
  const theirs = (friend.tradeables ?? []).map(decodeItem).filter((item): item is TradeItem => item !== null)
  const [give, setGive] = useState('')
  const [want, setWant] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  if (mine.length === 0) {
    return <p className="friend-hint">You have no pets or costume pieces free to trade. Pets following you and costumes you’re wearing stay with you.</p>
  }

  async function send() {
    const giveItem = decodeItem(give)
    const wantItem = want ? decodeItem(want) : null
    if (!giveItem) {
      setStatus('Pick something to offer.')
      return
    }
    // The item leaves your hands while the offer waits, so it can't be promised twice.
    if (!onInventory((current) => removeItem(current, giveItem))) {
      setStatus(`You no longer have ${itemName(giveItem)} free to trade.`)
      return
    }
    setStatus('Sending…')
    try {
      await online.offerTrade(hero.name, friendUid, friend.name, giveItem, wantItem)
      setStatus(null)
      setGive('')
      setWant('')
      onSent()
    } catch {
      onInventory((current) => addItem(current, giveItem))
      setStatus('Couldn’t send the offer, so nothing left your hands. Try again in a moment.')
    }
  }

  return (
    <div className="trade-offer">
      <h4>Offer a trade</h4>
      <label htmlFor="trade-give">You give</label>
      <select id="trade-give" className="text-input" value={give} onChange={(event) => setGive(event.target.value)}>
        <option value="">Choose a pet or costume…</option>
        {encodeItems(mine).map((code, index) => (
          <option key={code} value={code}>
            {itemName(mine[index])}
          </option>
        ))}
      </select>
      <label htmlFor="trade-want">You get</label>
      <select id="trade-want" className="text-input" value={want} onChange={(event) => setWant(event.target.value)}>
        <option value="">Nothing: it’s a gift</option>
        {encodeItems(theirs).map((code, index) => (
          <option key={code} value={code}>
            {itemName(theirs[index])}
          </option>
        ))}
      </select>
      <button type="button" className="button-secondary" disabled={!give || status === 'Sending…'} onClick={() => void send()}>
        Send offer
      </button>
      {status && <p className="friend-hint">{status}</p>}
    </div>
  )
}

interface TradeListProps {
  hero: Hero
  online: Online
  incoming: Trade[]
  outgoing: Trade[]
  onInventory: ChangeInventory
  onChanged: () => void
  onProblem: (problem: string) => void
}

/** Offers waiting for your answer, and your own offers waiting for your friends'. */
export function TradeList({ hero, online, incoming, outgoing, onInventory, onChanged, onProblem }: TradeListProps) {
  const [busy, setBusy] = useState(false)

  async function answer(trade: Trade, accept: boolean) {
    if (accept && trade.want && !canGive(hero, trade.want)) {
      onProblem(`You no longer have ${itemName(trade.want)} free to give. Switch your pet or costume first, or decline.`)
      return
    }
    setBusy(true)
    try {
      const answered = await online.answerTrade(trade.id, accept)
      if (answered && accept) {
        onInventory((current) => {
          const without = answered.want ? removeItem(current, answered.want) : current
          return without ? addItem(without, answered.give) : null
        })
      }
      if (!answered) {
        onProblem('That offer was already cancelled or answered.')
      }
    } catch {
      onProblem('Couldn’t answer the offer. Try again in a moment.')
    } finally {
      setBusy(false)
      onChanged()
    }
  }

  async function cancel(trade: Trade) {
    setBusy(true)
    try {
      if (!(await online.cancelTrade(trade.id))) {
        onProblem('Your friend already answered that offer.')
      }
    } catch {
      onProblem('Couldn’t cancel the offer. Try again in a moment.')
    } finally {
      setBusy(false)
      onChanged()
    }
  }

  const waiting = outgoing.filter((trade) => trade.status === 'pending')
  if (incoming.length === 0 && waiting.length === 0) {
    return null
  }
  return (
    <>
      {incoming.length > 0 && <h4>Offers for you</h4>}
      <ul className="trade-list">
        {incoming.map((trade) => (
          <li key={trade.id}>
            <span>
              {trade.fromName} offers <strong>{itemName(trade.give)}</strong> for {trade.want ? <strong>your {itemName(trade.want)}</strong> : 'nothing: a gift'}.
            </span>
            <span className="trade-actions">
              <button type="button" className="button-primary" disabled={busy} onClick={() => void answer(trade, true)}>
                Accept
              </button>
              <button type="button" className="button-secondary" disabled={busy} onClick={() => void answer(trade, false)}>
                Decline
              </button>
            </span>
          </li>
        ))}
      </ul>
      {waiting.length > 0 && <h4>Your offers</h4>}
      <ul className="trade-list">
        {waiting.map((trade) => (
          <li key={trade.id}>
            <span>
              Waiting for {trade.toName}: your <strong>{itemName(trade.give)}</strong> for {describe(trade.want)}.
            </span>
            <button type="button" className="button-secondary" disabled={busy} onClick={() => void cancel(trade)}>
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
