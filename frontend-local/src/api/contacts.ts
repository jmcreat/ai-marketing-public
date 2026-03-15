import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'
import type { Contact, ContactCreate, OcrResult } from './types'

export const contactKeys = {
  all: ['contacts'] as const,
  list: (search?: string, tag?: string) => ['contacts', 'list', search, tag] as const,
  detail: (id: number) => ['contacts', 'detail', id] as const,
}

export function useContacts(search?: string, tag?: string) {
  return useQuery({
    queryKey: contactKeys.list(search, tag),
    queryFn: async () => {
      const { data } = await api.get<Contact[]>('/api/contacts', {
        params: { search, tag },
      })
      return data
    },
  })
}

export function useContact(id: number) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Contact>(`/api/contacts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ContactCreate) => {
      const { data } = await api.post<Contact>('/api/contacts', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<ContactCreate> }) => {
      const { data } = await api.put<Contact>(`/api/contacts/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/contacts/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  })
}

export function useOcrBusinessCard() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<OcrResult>('/api/contacts/ocr', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
  })
}

export function useImportVcard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<Contact[]>('/api/contacts/import-vcard', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  })
}
