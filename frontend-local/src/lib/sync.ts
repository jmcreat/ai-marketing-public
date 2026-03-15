/**
 * Supabase ↔ IndexedDB 동기화 레이어
 *
 * 전략: "Last Write Wins" + Supabase를 원본(source of truth)으로 사용
 * - pushAll: IndexedDB → Supabase (업로드)
 * - pullAll: Supabase → IndexedDB (다운로드)
 * - syncAll: 양방향 (updated_at 기준 최신 우선)
 */

import { db, type LocalContact, type LocalEvent, type LocalMemo } from '../db'
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

  try {
    const contacts = await db.contacts.toArray()
    if (contacts.length > 0) {
      const rows = contacts.map(({ id: _id, ...rest }) => rest)
      const { error } = await supabase.from('contacts').upsert(rows, { onConflict: 'id' })
      if (error) result.errors.push(`contacts: ${error.message}`)
      else result.contacts = contacts.length
    }
  } catch (e) { result.errors.push(`contacts: ${String(e)}`) }

  try {
    const events = await db.events.toArray()
    if (events.length > 0) {
      const rows = events.map(({ id: _id, ...rest }) => rest)
      const { error } = await supabase.from('events').upsert(rows, { onConflict: 'id' })
      if (error) result.errors.push(`events: ${error.message}`)
      else result.events = events.length
    }
  } catch (e) { result.errors.push(`events: ${String(e)}`) }

  try {
    const memos = await db.memos.toArray()
    if (memos.length > 0) {
      const rows = memos.map(({ id: _id, ...rest }) => rest)
      const { error } = await supabase.from('memos').upsert(rows, { onConflict: 'date' })
      if (error) result.errors.push(`memos: ${error.message}`)
      else result.memos = memos.length
    }
  } catch (e) { result.errors.push(`memos: ${String(e)}`) }

  return result
}

// ──────────────────────────────────────────────
// Pull: Supabase → IndexedDB
// ──────────────────────────────────────────────
export async function pullAll(): Promise<SyncResult> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')

  const result: SyncResult = { contacts: 0, events: 0, memos: 0, errors: [] }

  try {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at')
    if (error) { result.errors.push(`contacts: ${error.message}`) }
    else if (data) {
      await db.contacts.clear()
      await db.contacts.bulkPut(data as LocalContact[])
      result.contacts = data.length
    }
  } catch (e) { result.errors.push(`contacts: ${String(e)}`) }

  try {
    const { data, error } = await supabase.from('events').select('*').order('start_dt')
    if (error) { result.errors.push(`events: ${error.message}`) }
    else if (data) {
      await db.events.clear()
      await db.events.bulkPut(data as LocalEvent[])
      result.events = data.length
    }
  } catch (e) { result.errors.push(`events: ${String(e)}`) }

  try {
    const { data, error } = await supabase.from('memos').select('*').order('date')
    if (error) { result.errors.push(`memos: ${error.message}`) }
    else if (data) {
      await db.memos.clear()
      await db.memos.bulkPut(data as LocalMemo[])
      result.memos = data.length
    }
  } catch (e) { result.errors.push(`memos: ${String(e)}`) }

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
    const [localContacts, { data: remoteData, error }] = await Promise.all([
      db.contacts.toArray(),
      supabase.from('contacts').select('*'),
    ])
    if (error) throw error
    const remote = (remoteData ?? []) as LocalContact[]
    const remoteMap = new Map(remote.map((r) => [r.id, r]))
    const localMap = new Map(localContacts.map((l) => [l.id, l]))

    const toRemote = localContacts.filter((l) => {
      const r = remoteMap.get(l.id)
      return !r || new Date(l.updated_at) > new Date(r.updated_at)
    })
    const toLocal = remote.filter((r) => {
      const l = localMap.get(r.id)
      return !l || new Date(r.updated_at) > new Date(l.updated_at)
    })

    if (toRemote.length > 0) {
      const rows = toRemote.map(({ id: _id, ...rest }) => rest)
      await supabase.from('contacts').upsert(rows, { onConflict: 'id' })
    }
    if (toLocal.length > 0) await db.contacts.bulkPut(toLocal)
    result.contacts = toRemote.length + toLocal.length
  } catch (e) { result.errors.push(`contacts: ${String(e)}`) }

  // Events
  try {
    const [localEvents, { data: remoteData, error }] = await Promise.all([
      db.events.toArray(),
      supabase.from('events').select('*'),
    ])
    if (error) throw error
    const remote = (remoteData ?? []) as LocalEvent[]
    const remoteMap = new Map(remote.map((r) => [r.id, r]))
    const localMap = new Map(localEvents.map((l) => [l.id, l]))

    const toRemote = localEvents.filter((l) => {
      const r = remoteMap.get(l.id)
      return !r || new Date(l.updated_at) > new Date(r.updated_at)
    })
    const toLocal = remote.filter((r) => {
      const l = localMap.get(r.id)
      return !l || new Date(r.updated_at) > new Date(l.updated_at)
    })

    if (toRemote.length > 0) {
      const rows = toRemote.map(({ id: _id, ...rest }) => rest)
      await supabase.from('events').upsert(rows, { onConflict: 'id' })
    }
    if (toLocal.length > 0) await db.events.bulkPut(toLocal)
    result.events = toRemote.length + toLocal.length
  } catch (e) { result.errors.push(`events: ${String(e)}`) }

  // Memos
  try {
    const [localMemos, { data: remoteData, error }] = await Promise.all([
      db.memos.toArray(),
      supabase.from('memos').select('*'),
    ])
    if (error) throw error
    const remote = (remoteData ?? []) as LocalMemo[]
    const remoteMap = new Map(remote.map((r) => [r.date, r]))
    const localMap = new Map(localMemos.map((l) => [l.date, l]))

    const toRemote = localMemos.filter((l) => {
      const r = remoteMap.get(l.date)
      return !r || new Date(l.updated_at) > new Date(r.updated_at)
    })
    const toLocal = remote.filter((r) => {
      const l = localMap.get(r.date)
      return !l || new Date(r.updated_at) > new Date(l.updated_at)
    })

    if (toRemote.length > 0) {
      const rows = toRemote.map(({ id: _id, ...rest }) => rest)
      await supabase.from('memos').upsert(rows, { onConflict: 'date' })
    }
    if (toLocal.length > 0) await db.memos.bulkPut(toLocal)
    result.memos = toRemote.length + toLocal.length
  } catch (e) { result.errors.push(`memos: ${String(e)}`) }

  return result
}
