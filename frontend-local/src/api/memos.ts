import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'
import type { DailyMemo } from './types'

export const memoKeys = {
  all: ['memos'] as const,
  date: (date: string) => ['memos', 'date', date] as const,
  dates: (month?: string) => ['memos', 'dates', month] as const,
}

export function useMemo(date: string) {
  return useQuery({
    queryKey: memoKeys.date(date),
    queryFn: async () => {
      try {
        const { data } = await api.get<DailyMemo>(`/api/memos/${date}`)
        return data
      } catch (e: any) {
        if (e.response?.status === 404) return null
        throw e
      }
    },
    enabled: !!date,
  })
}

export function useMemoDates(month?: string) {
  return useQuery({
    queryKey: memoKeys.dates(month),
    queryFn: async () => {
      const { data } = await api.get<{ dates: string[] }>('/api/memos/dates', {
        params: { month },
      })
      return data.dates
    },
  })
}

export function useUpsertMemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, content }: { date: string; content: string }) => {
      const { data } = await api.put<DailyMemo>(`/api/memos/${date}`, { content })
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: memoKeys.date(vars.date) })
      qc.invalidateQueries({ queryKey: memoKeys.all })
    },
  })
}
