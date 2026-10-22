import { useRef, useState, type ChangeEvent } from 'react'
import { backupFileName, makeBackup, readBackup } from './backup'
import { displayName, type Roster } from './hero'

interface BackupControlsProps {
  roster: Roster
  today: string
  onRestore: (roster: Roster) => void
}

type Status = { kind: 'idle' } | { kind: 'done' | 'problem'; message: string } | { kind: 'confirm'; restored: Roster; savedAt: string }

/** Saves every hero to a file, and restores them from one: a safety net, since progress lives only on this phone. */
function BackupControls({ roster, today, onRestore }: BackupControlsProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileInput = useRef<HTMLInputElement>(null)
  const hasHeroes = roster.heroes.length > 0

  async function saveBackup() {
    const now = new Date()
    const file = new File([makeBackup(roster, now)], backupFileName(now), { type: 'application/json' })
    // On phones the share sheet can save straight to Files, Notes, or another device.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Level Up Life backup' })
        setStatus({ kind: 'done', message: 'Backup saved. Keep that file somewhere safe.' })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setStatus({ kind: 'problem', message: 'The backup couldn’t be shared. Try again.' })
        }
      }
      return
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(file)
    link.download = file.name
    link.click()
    URL.revokeObjectURL(link.href)
    setStatus({ kind: 'done', message: `Backup saved to your downloads as ${file.name}.` })
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    const result = readBackup(await file.text(), today)
    setStatus(result.ok ? { kind: 'confirm', restored: result.roster, savedAt: result.savedAt } : { kind: 'problem', message: result.problem })
  }

  function confirmRestore(restored: Roster) {
    onRestore(restored)
    setStatus({ kind: 'done', message: `Restored ${restored.heroes.length === 1 ? '1 hero' : `${restored.heroes.length} heroes`}.` })
  }

  return (
    <section className="backup" aria-labelledby="backup-title">
      <h3 id="backup-title">{hasHeroes ? 'Keep your progress safe' : 'Played before?'}</h3>
      <p className="backup-hint">
        {hasHeroes
          ? 'Your heroes live only on this phone. Save a backup now and then, so clearing your browser or switching phones loses nothing.'
          : 'If you saved a backup on another phone, restore it here to bring your heroes back.'}
      </p>
      {status.kind === 'confirm' ? (
        <div className="backup-confirm" role="alert">
          <p>
            {hasHeroes ? `This replaces the ${roster.heroes.length} hero${roster.heroes.length === 1 ? '' : 'es'} on this phone with ` : 'This brings back '}
            <strong>{status.restored.heroes.map(displayName).join(', ')}</strong>
            {status.savedAt && ` from the backup of ${new Date(status.savedAt).toLocaleDateString()}`}.
          </p>
          <div className="backup-actions">
            <button type="button" className="button-primary small" onClick={() => confirmRestore(status.restored)}>
              Restore
            </button>
            <button type="button" className="button-secondary small" onClick={() => setStatus({ kind: 'idle' })}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="backup-actions">
          {hasHeroes && (
            <button type="button" className="button-secondary small" onClick={saveBackup}>
              Save a backup
            </button>
          )}
          <button type="button" className="button-secondary small" onClick={() => fileInput.current?.click()}>
            Restore from a backup
          </button>
        </div>
      )}
      {(status.kind === 'done' || status.kind === 'problem') && (
        <p className={`backup-status ${status.kind}`} role="status">
          {status.message}
        </p>
      )}
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={chooseFile} />
    </section>
  )
}

export default BackupControls
