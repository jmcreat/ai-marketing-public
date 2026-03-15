import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LocalContact } from '../db'

export type { LocalContact }

export function useContacts(search?: string, tag?: string) {
  const contacts = useLiveQuery(async () => {
    let q = db.contacts.orderBy('name')
    const all = await q.toArray()
    let result = all
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.company?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.phone?.includes(s),
      )
    }
    if (tag) {
      result = result.filter((c) => c.tags?.includes(tag))
    }
    return result
  }, [search, tag])

  return { data: contacts ?? [], isLoading: contacts === undefined }
}

export function useContact(id: number) {
  const contact = useLiveQuery(() => db.contacts.get(id), [id])
  return { data: contact, isLoading: contact === undefined }
}

export async function createContact(payload: Omit<LocalContact, 'id' | 'created_at' | 'updated_at'>) {
  const now = new Date().toISOString()
  return db.contacts.add({ ...payload, created_at: now, updated_at: now })
}

export async function updateContact(id: number, payload: Partial<LocalContact>) {
  return db.contacts.update(id, { ...payload, updated_at: new Date().toISOString() })
}

export async function deleteContact(id: number) {
  return db.contacts.delete(id)
}

export async function importVcardLocal(text: string): Promise<number> {
  const now = new Date().toISOString()
  const cards = parseVcard(text)
  let count = 0
  for (const c of cards) {
    await db.contacts.add({ ...c, created_at: now, updated_at: now })
    count++
  }
  return count
}

function parseVcard(text: string) {
  const cards: Omit<LocalContact, 'id' | 'created_at' | 'updated_at'>[] = []
  let current: Partial<LocalContact> = {}
  for (const line of text.split('\n')) {
    const l = line.trim()
    if (l === 'BEGIN:VCARD') { current = {} }
    else if (l === 'END:VCARD') { if (current.name) cards.push(current as any) }
    else if (l.startsWith('FN:')) current.name = l.slice(3)
    else if (l.startsWith('ORG:')) current.company = l.slice(4).split(';')[0]
    else if (l.startsWith('TITLE:')) current.position = l.slice(6)
    else if (l.startsWith('TEL')) current.phone = l.split(':').slice(1).join(':')
    else if (l.startsWith('EMAIL')) current.email = l.split(':').slice(1).join(':')
    else if (l.startsWith('ADR')) current.address = l.split(':').slice(1).join(':').replace(/;/g, ' ').trim()
  }
  return cards
}
