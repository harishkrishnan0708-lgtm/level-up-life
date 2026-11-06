/**
 * Everything that talks to the server: signing in with Google, publishing your kingdom, finding a friend's by code,
 * and raid reports. Loaded only when someone opens the friends' raids, so the rest of the game works offline.
 */
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { FIREBASE_CONFIG } from './firebaseConfig'
import { isKingdomSnapshot, newRaidCode, type KingdomSnapshot, type RaidReport } from './pvp'

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
