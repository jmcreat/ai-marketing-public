/**
 * JSON 기반 Import / Export 유틸리티
 * - exportAll(): IndexedDB 전체 → JSON 파일 다운로드
 * - importAll(file): JSON 파일 → IndexedDB 덮어쓰기 또는 병합
 */

import { db } from '../db'
import type { LocalContact, LocalEvent, LocalMemo } from '../db'

export interface BackupData {
  version: number
  exportedAt: string
  contacts: LocalContact[]
  events: LocalEvent[]
  memos: LocalMemo[]
}

// ──────────────────────────────────────────────
// Export: IndexedDB → JSON 파일 다운로드
// ──────────────────────────────────────────────
export async function exportAll(): Promise<void> {
  const [contacts, events, memos] = await Promise.all([
    db.contacts.toArray(),
    db.events.toArray(),
    db.memos.toArray(),
  ])

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    contacts,
    events,
    memos,
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `ai-marketing-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ──────────────────────────────────────────────
// Import: JSON 파일 → IndexedDB
// ──────────────────────────────────────────────
export async function importAll(
  file: File,
  mode: 'replace' | 'merge' = 'merge',
): Promise<{ contacts: number; events: number; memos: number }> {
  const text = await file.text()
  const backup: BackupData = JSON.parse(text)

  if (!backup.contacts || !backup.events || !backup.memos) {
    throw new Error('올바른 백업 파일이 아닙니다')
  }

  if (mode === 'replace') {
    await db.transaction('rw', db.contacts, db.events, db.memos, async () => {
      await db.contacts.clear()
      await db.events.clear()
      await db.memos.clear()
      await db.contacts.bulkPut(backup.contacts)
      await db.events.bulkPut(backup.events)
      await db.memos.bulkPut(backup.memos)
    })
  } else {
    // merge: 같은 id는 updated_at 비교 후 최신 우선
    await db.transaction('rw', db.contacts, db.events, db.memos, async () => {
      // Contacts
      const existingContacts = await db.contacts.toArray()
      const existingMap = new Map(existingContacts.map((c) => [c.id, c]))
      const contactsToUpsert = backup.contacts.filter((c) => {
        const ex = existingMap.get(c.id)
        return !ex || new Date(c.updated_at) >= new Date(ex.updated_at)
      })
      if (contactsToUpsert.length > 0) await db.contacts.bulkPut(contactsToUpsert)

      // Events
      const existingEvents = await db.events.toArray()
      const existingEvtMap = new Map(existingEvents.map((e) => [e.id, e]))
      const eventsToUpsert = backup.events.filter((e) => {
        const ex = existingEvtMap.get(e.id)
        return !ex || new Date(e.updated_at) >= new Date(ex.updated_at)
      })
      if (eventsToUpsert.length > 0) await db.events.bulkPut(eventsToUpsert)

      // Memos
      const existingMemos = await db.memos.toArray()
      const existingMemoMap = new Map(existingMemos.map((m) => [m.date, m]))
      const memosToUpsert = backup.memos.filter((m) => {
        const ex = existingMemoMap.get(m.date)
        return !ex || new Date(m.updated_at) >= new Date(ex.updated_at)
      })
      if (memosToUpsert.length > 0) await db.memos.bulkPut(memosToUpsert)
    })
  }

  return {
    contacts: backup.contacts.length,
    events: backup.events.length,
    memos: backup.memos.length,
  }
}
