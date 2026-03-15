import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { LocalEvent } from '../../db/events'
import { createEvent, updateEvent } from '../../db/events'
import { useContacts } from '../../db/contacts'
import { Loader2 } from 'lucide-react'

interface Props {
  initialStart?: string
  eventId?: number
  defaultValues?: Partial<Omit<LocalEvent, 'id' | 'created_at' | 'updated_at'>>
  onSuccess: () => void
}

const COLOR_OPTIONS = [
  { label: '파랑', value: '#3B82F6' },
  { label: '초록', value: '#10B981' },
  { label: '빨강', value: '#EF4444' },
  { label: '보라', value: '#8B5CF6' },
  { label: '주황', value: '#F97316' },
  { label: '분홍', value: '#EC4899' },
]

function toLocalInput(dt: string | undefined) {
  if (!dt) return ''
  try { return new Date(dt).toISOString().slice(0, 16) } catch { return dt.slice(0, 16) }
}

export default function EventForm({ initialStart, eventId, defaultValues, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, control, formState: { errors } } = useForm<Omit<LocalEvent, 'id' | 'created_at' | 'updated_at'>>({
    defaultValues: {
      color: '#3B82F6',
      all_day: false,
      start_dt: defaultValues?.start_dt ? toLocalInput(defaultValues.start_dt) : (initialStart ?? ''),
      end_dt: defaultValues?.end_dt ? toLocalInput(defaultValues.end_dt) : '',
      ...defaultValues,
    },
  })

  const { data: contacts } = useContacts()

  const onSubmit = async (data: Omit<LocalEvent, 'id' | 'created_at' | 'updated_at'>) => {
    setSaving(true)
    try {
      const payload = { ...data, contact_id: data.contact_id ? Number(data.contact_id) : undefined }
      if (eventId) {
        await updateEvent(eventId, payload)
      } else {
        await createEvent(payload)
      }
      onSuccess()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title', { required: '제목을 입력하세요' })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="일정 제목"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작</label>
          <input
            {...register('start_dt', { required: true })}
            type="datetime-local"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
          <input
            {...register('end_dt')}
            type="datetime-local"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input {...register('all_day')} type="checkbox" id="all_day" className="w-4 h-4 text-blue-500 rounded" />
        <label htmlFor="all_day" className="text-sm text-gray-700">종일 일정</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">연락처 연결</label>
        <select
          {...register('contact_id')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">연락처 없음</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.company ? ` (${c.company})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  title={opt.label}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    field.value === opt.value ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: opt.value }}
                />
              ))}
            </div>
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="일정 설명..."
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="animate-spin" size={14} />}
          {eventId ? '저장' : '추가'}
        </button>
      </div>
    </form>
  )
}
