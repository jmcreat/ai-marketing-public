import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'
import type { CalendarEvent, EventCreate } from './types'

export const eventKeys = {
  all: ['events'] as const,
  range: (start?: string, end?: string) => ['events', 'range', start, end] as const,
  detail: (id: number) => ['events', 'detail', id] as const,
  byContact: (contactId: number) => ['events', 'contact', contactId] as const,
}

export function useEvents(start?: string, end?: string) {
  return useQuery({
    queryKey: eventKeys.range(start, end),
    queryFn: async () => {
      const { data } = await api.get<CalendarEvent[]>('/api/events', {
        params: { start, end },
      })
      return data
    },
  })
}

export function useEventsByContact(contactId: number) {
  return useQuery({
    queryKey: eventKeys.byContact(contactId),
    queryFn: async () => {
      const { data } = await api.get<CalendarEvent[]>('/api/events', {
        params: { contact_id: contactId },
      })
      return data
    },
    enabled: !!contactId,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: EventCreate) => {
      const { data } = await api.post<CalendarEvent>('/api/events', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<EventCreate> }) => {
      const { data } = await api.put<CalendarEvent>(`/api/events/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/events/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  })
}
