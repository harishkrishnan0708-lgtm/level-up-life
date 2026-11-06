import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Hero } from './hero'
import type { Player } from './online'
import { describeRaidOnYou, normalizeRaidCode, rivalFromKingdom, snapshotOf, type KingdomSnapshot, type RaidReport } from './pvp'
import { WAR_UNLOCK_LEVEL, type RaidReadiness } from './raids'

type Online = typeof import('./online')

interface FriendRaidsProps {
  hero: Hero
  /** Null while the War is still locked: the player can share their code and be raided, but can't march yet. */
  readiness: RaidReadiness | null
  onRaid: (ownerUid: string, kingdom: KingdomSnapshot) => void
}

/** Raiding friends' kingdoms: sign in, share your code, find a friend's, and see who raided you. */
function FriendRaids({ hero, readiness, onRaid }: FriendRaidsProps) {
  const [online, setOnline] = useState<Online | null>(null)
  const [player, setPlayer] = useState<Player | null | 'checking'>('checking')
  // Kept with the account they belong to, so signing out (or in as someone else) never shows the last player's.
  const [codeFor, setCodeFor] = useState<{ uid: string; code: string } | null>(null)
  const [reportsFor, setReportsFor] = useState<{ uid: string; reports: RaidReport[] } | null>(null)
  const [typed, setTyped] = useState('')
  const [found, setFound] = useState<{ uid: string; kingdom: KingdomSnapshot } | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const uid = player && player !== 'checking' ? player.uid : null
  const code = codeFor?.uid === uid ? codeFor.code : null
  const reports = reportsFor?.uid === uid ? reportsFor.reports : []
  const snapshotKey = useMemo(() => JSON.stringify(code ? snapshotOf(hero, code) : null), [hero, code])

  useEffect(() => {
    let stop = () => {}
    let cancelled = false
    import('./online')
      .then((module) => {
        if (!cancelled) {
          setOnline(module)
          stop = module.watchPlayer(setPlayer)
        }
      })
      .catch(() => {
        setPlayer(null)
        setProblem('Couldn’t reach the server. Check your connection and reopen this tab.')
      })
    return () => {
      cancelled = true
      stop()
    }
  }, [])

  useEffect(() => {
    if (!online || !uid) {
      return
    }
    online
      .raidCodeFor(uid)
      .then((claimed) => setCodeFor({ uid, code: claimed }))
      .catch(() => setProblem('Couldn’t set up your raid code. Try again in a moment.'))
    online
      .raidsOn(uid)
      .then((found) => setReportsFor({ uid, reports: found }))
      .catch(() => setProblem('Couldn’t load raids on your kingdom.'))
  }, [online, uid])

  useEffect(() => {
    // Keyed on the snapshot's contents, so a new object with the same contents doesn't publish again.
    const shared: KingdomSnapshot | null = JSON.parse(snapshotKey)
    if (online && uid && shared) {
      online.publishKingdom(uid, shared).catch(() => setProblem('Couldn’t share your kingdom with friends. Try again in a moment.'))
    }
  }, [online, uid, snapshotKey])

  async function run(task: () => Promise<void>, failure: string) {
    setBusy(true)
    setProblem(null)
    try {
      await task()
    } catch {
      setProblem(failure)
    } finally {
      setBusy(false)
    }
  }

  function findFriend(event: FormEvent) {
    event.preventDefault()
    const friendCode = normalizeRaidCode(typed)
    if (!friendCode) {
      setProblem('Raid codes are 6 letters and numbers, like K7Q2MX.')
      return
    }
    if (friendCode === code) {
      setProblem('That’s your own code. Ask a friend for theirs.')
      return
    }
    void run(async () => {
      const result = online ? await online.findKingdom(friendCode) : null
      setFound(result)
      if (!result) {
        setProblem(`No kingdom has the code ${friendCode}. Check it with your friend.`)
      }
    }, 'Couldn’t look up that code. Check your connection and try again.')
  }

  return (
    <section className="friend-raids" aria-labelledby="friend-raids-title">
      <h3 id="friend-raids-title">Raid a friend</h3>
      {player === 'checking' && <p className="friend-hint">Connecting…</p>}
      {player === null && (
        <>
          <p className="friend-hint">
            Sign in to share your kingdom with friends and raid theirs. Friends see only your hero’s name, level, and buildings, never
            your habits. Raids between friends win or lose nothing.
          </p>
          <button type="button" className="button-primary full" disabled={!online || busy} onClick={() => void run(online!.signIn, 'Sign-in didn’t finish. Try again.')}>
            Sign in with Google
          </button>
        </>
      )}
      {uid && (
        <>
          <p className="friend-code">
            Your raid code <strong>{code ?? '…'}</strong>
          </p>
          <p className="friend-hint">Give it to friends so they can raid you.</p>
          <form className="friend-find" onSubmit={findFriend} noValidate>
            <label htmlFor="friend-code-input">Friend’s raid code</label>
            <div className="friend-find-row">
              <input
                id="friend-code-input"
                className="text-input"
                value={typed}
                maxLength={8}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="K7Q2MX"
                onChange={(event) => {
                  setTyped(event.target.value)
                  setFound(null)
                }}
              />
              <button type="submit" className="button-secondary" disabled={busy}>
                Find
              </button>
            </div>
          </form>
          {found && (
            <FoundKingdom
              kingdom={found.kingdom}
              ownerUid={found.uid}
              readiness={readiness}
              onRaid={() => {
                onRaid(found.uid, found.kingdom)
                setFound(null)
                setTyped('')
              }}
            />
          )}
          <h4>Raids on your kingdom</h4>
          {reports.length === 0 ? (
            <p className="friend-hint">No one has raided you yet.</p>
          ) : (
            <ul className="raid-reports">
              {reports.map((report) => (
                <li key={report.id}>{describeRaidOnYou(report)}</li>
              ))}
            </ul>
          )}
          <button type="button" className="retreat-button" disabled={busy} onClick={() => void run(online!.signOutPlayer, 'Couldn’t sign out. Try again.')}>
            Sign out
          </button>
        </>
      )}
      {problem && (
        <p className="field-error" role="alert">
          {problem}
        </p>
      )}
    </section>
  )
}

function FoundKingdom({ kingdom, ownerUid, readiness, onRaid }: { kingdom: KingdomSnapshot; ownerUid: string; readiness: RaidReadiness | null; onRaid: () => void }) {
  const castle = rivalFromKingdom(kingdom, ownerUid)
  return (
    <div className="rival-card friend-kingdom">
      <div className="rival-text">
        <p className="rival-name">{castle.name}</p>
        <p className="rival-title">{castle.title}</p>
        <p className="rival-reputation">{castle.reputation}</p>
        <p className="rival-stats">
          Garrison {castle.garrison} · walls {castle.walls} · towers {castle.towers}
        </p>
      </div>
      <button type="button" className="button-primary" disabled={readiness !== 'ready'} onClick={onRaid}>
        March
      </button>
      {readiness !== 'ready' && (
        <p className="friend-hint">
          {readiness === null
            ? `You can raid friends once the War opens at level ${WAR_UNLOCK_LEVEL}.`
            : readiness === 'already-raided'
              ? 'Your army already marched today.'
              : 'Finish today’s quests to march.'}
        </p>
      )}
    </div>
  )
}

export default FriendRaids
