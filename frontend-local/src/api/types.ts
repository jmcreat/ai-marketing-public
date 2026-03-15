export interface Contact {
  id: number
  name: string
  company?: string
  position?: string
  phone?: string
  email?: string
  address?: string
  memo?: string
  card_image_url?: string
  tags?: string
  created_at?: string
  updated_at?: string
}

export interface ContactCreate {
  name: string
  company?: string
  position?: string
  phone?: string
  email?: string
  address?: string
  memo?: string
  card_image_url?: string
  tags?: string
}

export interface OcrResult {
  name?: string
  company?: string
  position?: string
  phone?: string
  email?: string
  address?: string
  raw_text: string
}

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  start_dt: string
  end_dt?: string
  all_day: boolean
  color: string
  contact_id?: number
  contact?: Contact
  created_at?: string
}

export interface EventCreate {
  title: string
  description?: string
  start_dt: string
  end_dt?: string
  all_day?: boolean
  color?: string
  contact_id?: number
}

export interface DailyMemo {
  id: number
  date: string
  content: string
  updated_at?: string
}
