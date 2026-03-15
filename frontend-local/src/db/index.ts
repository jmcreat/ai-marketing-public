import Dexie, { type Table } from 'dexie'

export interface LocalContact {
  id?: number
  name: string
  company?: string
  position?: string
  phone?: string
  email?: string
  address?: string
  memo?: string
  card_image_url?: string
  tags?: string
  created_at: string
  updated_at: string
}

export interface LocalEvent {
  id?: number
  title: string
  description?: string
  start_dt: string
  end_dt?: string
  all_day: boolean
  color: string
  contact_id?: number
  created_at: string
  updated_at: string
}

export interface LocalMemo {
  id?: number
  date: string   // "2026-03-15" unique
  content: string
  updated_at: string
}

class MarketingDB extends Dexie {
  contacts!: Table<LocalContact, number>
  events!: Table<LocalEvent, number>
  memos!: Table<LocalMemo, number>

  constructor() {
    super('ai-marketing')
    this.version(1).stores({
      contacts: '++id, name, company, email, phone, tags',
      events: '++id, start_dt, contact_id',
      memos: '++id, &date',   // date는 unique index
    })
  }
}

export const db = new MarketingDB()
