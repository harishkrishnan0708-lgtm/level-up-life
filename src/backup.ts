import { sanitizeRoster, type Roster } from './hero'

/** Marks a file as a Level Up Life backup, and which version of the format it uses. */
const BACKUP_APP = 'level-up-life'
const BACKUP_VERSION = 1
/** Far bigger than any real backup; anything larger is not one of ours. */
const MAX_BACKUP_BYTES = 2_000_000

interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  savedAt: string
  roster: Roster
}

export function makeBackup(roster: Roster, now: Date): string {
  const backup: BackupFile = { app: BACKUP_APP, version: BACKUP_VERSION, savedAt: now.toISOString(), roster }
  return JSON.stringify(backup)
}

/** e.g. level-up-life-backup-2026-10-22.json */
export function backupFileName(now: Date): string {
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0')).join('-')
  return `level-up-life-backup-${day}.json`
}

export type RestoreResult = { ok: true; roster: Roster; savedAt: string } | { ok: false; problem: string }

/** Checks a backup file and rebuilds its heroes, or explains what's wrong with it. */
export function readBackup(text: string, today: string): RestoreResult {
  if (text.length > MAX_BACKUP_BYTES) {
    return { ok: false, problem: 'That file is far too big to be a Level Up Life backup.' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, problem: 'That file isn’t a Level Up Life backup. Pick the file you saved from this app.' }
  }
  const backup = parsed as Partial<BackupFile> | null
  if (typeof backup !== 'object' || backup === null || backup.app !== BACKUP_APP) {
    return { ok: false, problem: 'That file isn’t a Level Up Life backup. Pick the file you saved from this app.' }
  }
  if (typeof backup.version !== 'number' || backup.version > BACKUP_VERSION) {
    return { ok: false, problem: 'That backup was made by a newer version of the app. Update the app, then try again.' }
  }
  const roster = sanitizeRoster(backup.roster, today)
  if (roster.heroes.length === 0) {
    return { ok: false, problem: 'That backup has no heroes in it, so there’s nothing to restore.' }
  }
  return { ok: true, roster, savedAt: typeof backup.savedAt === 'string' ? backup.savedAt : '' }
}
