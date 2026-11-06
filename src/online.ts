/**
 * Everything that talks to the server: signing in with Google, publishing your kingdom, finding a friend's by code,
 * and raid reports. Loaded only when someone opens the friends' raids, so the rest of the game works offline.
 */
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, query, runTransaction, serverTimestamp, setDoc, where, type DocumentData } from 'firebase/firestore'
import { FIREBASE_CONFIG } from './firebaseConfig'
import { isKingdomSnapshot, newRaidCode, type KingdomSnapshot, type RaidReport } from './pvp'
import { isTradeItem, type Trade, type TradeItem } from './trades'

const app = initializeApp(FIREBASE_CONFIG)
const auth = getAuth(app)
const db = getFirestore(app)

export interface Player {
  uid: string
  /** The name on their Google account, shown only to them. */
  accountName: string
}

export function watchPlayer(onChange: (player: Player | null) => void): () => void {
  return onAuthStateChanged(auth, (user: User | null) => onChange(user ? { uid: user.uid, accountName: user.displayName ?? 'you' } : null))
}

export async function signIn(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider())
}

export async function signOutPlayer(): Promise<void> {
  await signOut(auth)
}

/** The player's raid code, claiming a new one the first time. */
export async function raidCodeFor(uid: string): Promise<string> {
  const existing = await getDoc(doc(db, 'kingdoms', uid))
  const saved = existing.data()?.code
  if (typeof saved === 'string') {
    return saved
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newRaidCode()
    const claimed = await runTransaction(db, async (transaction) => {
      const codeDoc = doc(db, 'codes', code)
      if ((await transaction.get(codeDoc)).exists()) {
        return false
      }
      transaction.set(codeDoc, { uid })
      return true
    })
    if (claimed) {
      return code
    }
  }
  throw new Error('Could not find a free raid code')
}

/** Shares the player's kingdom so friends with their code can raid it. */
export async function publishKingdom(uid: string, kingdom: KingdomSnapshot): Promise<void> {
  await setDoc(doc(db, 'kingdoms', uid), { ...kingdom, updatedAt: serverTimestamp() })
}

/** A friend's kingdom by their code, or null if no one has that code. */
export async function findKingdom(code: string): Promise<{ uid: string; kingdom: KingdomSnapshot } | null> {
  const codeDoc = await getDoc(doc(db, 'codes', code))
  const uid = codeDoc.data()?.uid
  if (typeof uid !== 'string') {
    return null
  }
  const kingdom = (await getDoc(doc(db, 'kingdoms', uid))).data()
  return isKingdomSnapshot(kingdom) ? { uid, kingdom } : null
}

/** Leaves a report for the defender to find next time they open the game. */
export async function reportRaid(attackerName: string, defenderUid: string, outcome: RaidReport['outcome']): Promise<void> {
  const attackerUid = auth.currentUser?.uid
  if (!attackerUid) {
    throw new Error('Signed out before the raid ended')
  }
  await addDoc(collection(db, 'raids'), { attackerUid, attackerName: attackerName.slice(0, 40), defenderUid, outcome, at: serverTimestamp() })
}

/** The latest raids on the player's kingdom, newest first. */
export async function raidsOn(uid: string): Promise<RaidReport[]> {
  const found = await getDocs(query(collection(db, 'raids'), where('defenderUid', '==', uid), limit(20)))
  return found.docs
    .map((raid) => {
      const data = raid.data()
      return { id: raid.id, attackerName: String(data.attackerName ?? 'Someone'), outcome: data.outcome, at: data.at?.toMillis?.() ?? 0 }
    })
    .filter((report): report is RaidReport => ['victory', 'defeat', 'stalemate'].includes(report.outcome))
    .sort((first, second) => second.at - first.at)
    .slice(0, 5)
}

function readTrade(id: string, data: DocumentData | undefined): Trade | null {
  if (!data || !isTradeItem(data.give) || (data.want !== null && !isTradeItem(data.want))) {
    return null
  }
  if (!['pending', 'accepted', 'declined', 'cancelled'].includes(data.status)) {
    return null
  }
  return {
    id,
    fromUid: String(data.fromUid),
    fromName: String(data.fromName ?? 'A friend'),
    toUid: String(data.toUid),
    toName: String(data.toName ?? 'a friend'),
    give: data.give,
    want: data.want,
    status: data.status,
    fromSettled: data.fromSettled === true,
  }
}

/** Sends a friend an offer. The caller has already taken the offered item out of the player's hands. */
export async function offerTrade(fromName: string, toUid: string, toName: string, give: TradeItem, want: TradeItem | null): Promise<void> {
  const fromUid = auth.currentUser?.uid
  if (!fromUid) {
    throw new Error('Not signed in')
  }
  await addDoc(collection(db, 'trades'), {
    fromUid,
    fromName: fromName.slice(0, 40),
    toUid,
    toName: toName.slice(0, 40),
    give,
    want,
    status: 'pending',
    fromSettled: false,
    at: serverTimestamp(),
  })
}

/** Offers waiting for this player's answer, and every offer they've sent that isn't finished on their side yet. */
export async function tradesFor(uid: string): Promise<{ incoming: Trade[]; outgoing: Trade[] }> {
  const read = async (field: 'fromUid' | 'toUid') =>
    (await getDocs(query(collection(db, 'trades'), where(field, '==', uid), limit(50)))).docs
      .map((trade) => readTrade(trade.id, trade.data()))
      .filter((trade): trade is Trade => trade !== null)
  const [incoming, outgoing] = await Promise.all([read('toUid'), read('fromUid')])
  return { incoming: incoming.filter((trade) => trade.status === 'pending'), outgoing: outgoing.filter((trade) => !trade.fromSettled) }
}

/** Changes a trade only if it's still in the state the player saw, returning the trade if the change went through. */
async function changeTrade(id: string, allowed: (trade: Trade) => boolean, changes: Record<string, unknown>): Promise<Trade | null> {
  return runTransaction(db, async (transaction) => {
    const ref = doc(db, 'trades', id)
    const trade = readTrade(id, (await transaction.get(ref)).data())
    if (!trade || !allowed(trade)) {
      return null
    }
    transaction.update(ref, changes)
    return trade
  })
}

export function answerTrade(id: string, accept: boolean): Promise<Trade | null> {
  return changeTrade(id, (trade) => trade.status === 'pending' && trade.toUid === auth.currentUser?.uid, { status: accept ? 'accepted' : 'declined' })
}

export function cancelTrade(id: string): Promise<Trade | null> {
  return changeTrade(id, (trade) => trade.status === 'pending' && trade.fromUid === auth.currentUser?.uid, { status: 'cancelled' })
}

/** Marks the giver's side of an answered trade as done, so their item is received or returned exactly once. */
export function settleTrade(id: string): Promise<Trade | null> {
  return changeTrade(id, (trade) => trade.status !== 'pending' && !trade.fromSettled && trade.fromUid === auth.currentUser?.uid, { fromSettled: true })
}
