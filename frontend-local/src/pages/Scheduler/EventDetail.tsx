import { Calendar, Clock, AlignLeft, User, Trash2, Pencil } from 'lucide-react'
import type { LocalEvent } from '../../db/events'
import { deleteEvent } from '../../db/events'
import { useContact } from '../../db/contacts'

interface Props {
  event: LocalEvent
  onEdit: () => void
  onClose: () => void
}

export default function EventDetail({ event, onEdit, onClose }: Props) {
  const { data: contact } = useContact(event.contact_id ?? 0)

  const handleDelete = async () => {
    if (!confirm(`"${event.title}" 일정을 삭제하시겠습니까?`)) return
    await deleteEvent(event.id!)
    onClose()
  }

  const fmt = (dt: string) =>
    new Date(dt).toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: event.all_day ? undefined : '2-digit',
      minute: event.all_day ? undefined : '2-digit',
    })

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: event.color }} />
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{event.title}</h3>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Calendar size={15} className="text-gray-400 shrink-0" />
          <span>{fmt(event.start_dt)}</span>
        </div>
        {event.end_dt && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock size={15} className="text-gray-400 shrink-0" />
            <span>~ {fmt(event.end_dt)}</span>
          </div>
        )}
        {contact && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <User size={15} className="text-gray-400 shrink-0" />
            <span>{contact.name}{contact.company ? ` · ${contact.company}` : ''}</span>
          </div>
        )}
        {event.description && (
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <AlignLeft size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{event.description}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={14} />
          삭제
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
        >
          <Pencil size={14} />
          편집
        </button>
      </div>
    </div>
  )
}
