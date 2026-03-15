import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LocalMemo } from '../db'

export type { LocalMemo }

export function useMemo(date: string) {
  const memo = useLiveQuery(
    () => db.memos.where('date').equals(date).first(),
    [date],
  )
  // undefined = loading, null/falsy = not found
  return { data: memo ?? null, isLoading: memo === undefined }
}

export function useMemoDates(month?: string) {
  const dates = useLiveQuery(async () => {
    let all = await db.memos.toArray()
    if (month) all = all.filter((m) => m.date.startsWith(month))
    return all.map((m) => m.date)
  }, [month])
  return { data: dates ?? [] }
}

export async function upsertMemo(date: string, content: string) {
  const existing = await db.memos.where('date').equals(date).first()
  const now = new Date().toISOString()
  if (existing?.id) {
    await db.memos.update(existing.id, { content, updated_at: now })
    return existing.id
  } else {
    return db.memos.add({ date, content, updated_at: now })
  }
}

export async function deleteMemo(date: string) {
  const existing = await db.memos.where('date').equals(date).first()
  if (existing?.id) await db.memos.delete(existing.id)
}
