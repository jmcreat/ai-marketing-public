/**
 * Supabase ↔ IndexedDB 동기화 레이어
 *
 * 전략: "Last Write Wins" + Supabase를 원본(source of truth)으로 사용
 * - pushAll: IndexedDB → Supabase (업로드)
 * - pullAll: Supabase → IndexedDB (다운로드)
 * - syncAll: 양방향 (updated_at 기준 최신 우선)
 */

import { db } from '../db'
import { supabase } from './supabase'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncResult {
  contacts: number
  events: number
  memos: number
  errors: string[]
}

// ──────────────────────────────────────────────
// Push: IndexedDB → Supabase
// ──────────────────────────────────────────────
export async function pushAll(): Promise<SyncResult> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')

  const result: SyncResult = { contacts: 0, events: 0, memos: 0, errors: [] }

  // Contacts
  try {
    const contacts = await db.contacts.toArray()
    if (contacts.length > 0) {
      const rows = contacts.map(({ id: _id, ...rest }) => rest)
      const { error } = await supabase
        .from('contacts')
        .upsert(rows, { onConflict: 'id' })
      if (error) result.errors.push(`contacts: ${error.message}`)
      else result.contacts = contacts.length
    }
  } catch (e) {
    result.errors.push(`contacts: ${String(e)}`)
  }

  // Events
  try {
    const events = await db.events.toArray()
    if (events.length > 0) {
      const rows = events.map(({ id: _id, ...rest }) => rest)
      const { error } = await supabase
        .from('events')
        .upsert(rows, { onConflict: 'id' })
      if (error) result.errors.push(`events: ${error.message}`)
      else result.events = events.length
    }
  } catch (e) {
    result.errors.push(`events: ${String(e)}`)
  }

  // Memos
  try {
    const memos = await db.memos.toArray()
    if (memos.length > 0) {
      const rows = memos.map(({ id: _id, ...rest }) => rest)
      const { error } = await supabase
        .from('memos')
        .upsert(rows, { onConflict: 'date' })
      if (error) result.errors.push(`memos: ${error.message}`)
      else result.memos = memos.length
    }
  } catch (e) {
    result.errors.push(`memos: ${String(e)}`)
  }

  return result
}

// ──────────────────────────────────────────────
// Pull: Supabase → IndexedDB
// ──────────────────────────────────────────────
export async function pullAll(): Promise<SyncResult> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')

  const result: SyncResult = { contacts: 0, events: 0, memos: 0, errors: [] }

  // Contacts
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at')
    if (error) { result.errors.push(`contacts: ${error.message}`) }
    else if (data) {
      await db.contacts.clear()
      await db.contacts.bulkPut(data)
      result.contacts = data.length
    }
  } catch (e) {
    result.errors.push(`contacts: ${String(e)}`)
  }

  // Events
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_dt')
    if (error) { result.errors.push(`events: ${error.message}`) }
    else if (data) {
      await db.events.clear()
      await db.events.bulkPut(data)
      result.events = data.length
    }
  } catch (e) {
    result.errors.push(`events: ${String(e)}`)
  }

  // Memos
  try {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('date')
    if (error) { result.errors.push(`memos: ${error.message}`) }
    else if (data) {
      await db.memos.clear()
      await db.memos.bulkPut(data)
      result.memos = data.length
    }
  } catch (e) {
    result.errors.push(`memos: ${String(e)}`)
  }

  return result
}

// ──────────────────────────────────────────────
// Bidirectional Sync: updated_at 비교 → 최신 우선
// ──────────────────────────────────────────────
export async function syncAll(): Promise<SyncResult> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')

  const result: SyncResult = { contacts: 0, events: 0, memos: 0, errors: [] }

  // Contacts
  try {
    const [localContacts, { data: remoteContacts, error }] = await Promise.all([
      db.contacts.toArray(),
      supabase.from('contacts').select('*'),
    ])
    if (error) throw error

    const remote = remoteContacts ?? []
    const remoteMap = new Map(remote.map((r) => [r.id, r]))
    const localMap = new Map(localContacts.map((l) => [l.id, l]))

    const toUpsertRemote: typeof localContacts = []
    const toUpsertLocal: typeof remote = []

    // Local items newer than remote → push
    for (const local of localContacts) {
      const rem = remoteMap.get(local.id)
      if (!rem || new Date(local.updated_at) > new Date(rem.updated_at)) {
        toUpsertRemote.push(local)
      }
    }
    // Remote items newer than local → pull
    for (const rem of remote) {
      const loc = localMap.get(rem.id)
      if (!loc || new Date(rem.updated_at) > new Date(loc.updated_at)) {
        toUpsertLocal.push(rem)
      }
    }
    // New remote items not in local
    for (const rem of remote) {
      if (!localMap.has(rem.id)) toUpsertLocal.push(rem)
    }

    if (toUpsertRemote.length > 0) {
      const rows = toUpsertRemote.map(({ id: _id, ...rest }) => rest)
      await supabase.from('contacts').upsert(rows, { onConflict: 'id' })
    }
    if (toUpsertLocal.length > 0) {
      await db.contacts.bulkPut(toUpsertLocal)
    }
    result.contacts = toUpsertRemote.length + toUpsertLocal.length
  } catch (e) {
    result.errors.push(`contacts: ${String(e)}`)
  }

  // Events
  try {
    const [localEvents, { data: remoteEvents, error }] = await Promise.all([
      db.events.toArray(),
      supabase.from('events').select('*'),
    ])
    if (error) throw error

    const remote = remoteEvents ?? []
    const remoteMap = new Map(remote.map((r) => [r.id, r]))
    const localMap = new Map(localEvents.map((l) => [l.id, l]))

    const toUpsertRemote: typeof localEvents = []
    const toUpsertLocal: typeof remote = []

    for (const local of localEvents) {
      const rem = remoteMap.get(local.id)
      if (!rem || new Date(local.updated_at) > new Date(rem.updated_at)) {
        toUpsertRemote.push(local)
      }
    }
    for (const rem of remote) {
      const loc = localMap.get(rem.id)
      if (!loc || new Date(rem.updated_at) > new Date(loc.updated_at)) {
        toUpsertLocal.push(rem)
      }
    }
    for (const rem of remote) {
      if (!localMap.has(rem.id)) toUpsertLocal.push(rem)
    }

    if (toUpsertRemote.length > 0) {
      const rows = toUpsertRemote.map(({ id: _id, ...rest }) => rest)
      await supabase.from('events').upsert(rows, { onConflict: 'id' })
    }
    if (toUpsertLocal.length > 0) {
      await db.events.bulkPut(toUpsertLocal)
    }
    result.events = toUpsertRemote.length + toUpsertLocal.length
  } catch (e) {
    result.errors.push(`events: ${String(e)}`)
  }

  // Memos
  try {
    const [localMemos, { data: remoteMemos, error }] = await Promise.all([
      db.memos.toArray(),
      supabase.from('memos').select('*'),
    ])
    if (error) throw error

    const remote = remoteMemos ?? []
    const remoteMap = new Map(remote.map((r) => [r.date, r]))
    const localMap = new Map(localMemos.map((l) => [l.date, l]))

    const toUpsertRemote: typeof localMemos = []
    const toUpsertLocal: typeof remote = []

    for (const local of localMemos) {
      const rem = remoteMap.get(local.date)
      if (!rem || new Date(local.updated_at) > new Date(rem.updated_at)) {
        toUpsertRemote.push(local)
      }
    }
    for (const rem of remote) {
      const loc = localMap.get(rem.date)
      if (!loc || new Date(rem.updated_at) > new Date(loc.updated_at)) {
        toUpsertLocal.push(rem)
      }
    }
    for (const rem of remote) {
      if (!localMap.has(rem.date)) toUpsertLocal.push(rem)
    }

    if (toUpsertRemote.length > 0) {
      const rows = toUpsertRemote.map(({ id: _id, ...rest }) => rest)
      await supabase.from('memos').upsert(rows, { onConflict: 'date' })
    }
    if (toUpsertLocal.length > 0) {
      await db.memos.bulkPut(toUpsertLocal)
    }
    result.memos = toUpsertRemote.length + toUpsertLocal.length
  } catch (e) {
    result.errors.push(`memos: ${String(e)}`)
  }

  return result
}
