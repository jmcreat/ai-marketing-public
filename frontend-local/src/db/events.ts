import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LocalEvent } from '../db'

export type { LocalEvent }

export function useEvents(start?: string, end?: string, contactId?: number) {
  const events = useLiveQuery(async () => {
    let all = await db.events.toArray()
    if (start) all = all.filter((e) => e.start_dt >= start)
    if (end) all = all.filter((e) => e.start_dt <= end)
    if (contactId) all = all.filter((e) => e.contact_id === contactId)
    return all.sort((a, b) => a.start_dt.localeCompare(b.start_dt))
  }, [start, end, contactId])

  return { data: events ?? [], isLoading: events === undefined }
}

export function useEventsByContact(contactId: number) {
  const events = useLiveQuery(
    () => db.events.where('contact_id').equals(contactId).sortBy('start_dt'),
    [contactId],
  )
  return { data: events ?? [], isLoading: events === undefined }
}

export async function createEvent(payload: Omit<LocalEvent, 'id' | 'created_at' | 'updated_at'>) {
  const now = new Date().toISOString()
  return db.events.add({ ...payload, created_at: now, updated_at: now })
}

export async function updateEvent(id: number, payload: Partial<LocalEvent>) {
  return db.events.update(id, { ...payload, updated_at: new Date().toISOString() })
}

export async function deleteEvent(id: number) {
  return db.events.delete(id)
}
