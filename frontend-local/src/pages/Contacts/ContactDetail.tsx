import { Phone, Mail, Building2, MapPin, Tag, Pencil, Trash2, Calendar } from 'lucide-react'
import type { LocalContact } from '../../db/contacts'
import { deleteContact } from '../../db/contacts'
import { useEventsByContact } from '../../db/events'

interface Props {
  contact: LocalContact
  onEdit: () => void
  onClose: () => void
}

export default function ContactDetail({ contact, onEdit, onClose }: Props) {
  const { data: events } = useEventsByContact(contact.id!)

  const handleDelete = async () => {
    if (!confirm(`"${contact.name}"을(를) 삭제하시겠습니까?`)) return
    await deleteContact(contact.id!)
    onClose()
  }

  const tags = contact.tags?.split(',').filter(Boolean) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-bold">{contact.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900">{contact.name}</h3>
          {contact.position && <p className="text-sm text-gray-500">{contact.position}</p>}
          {contact.company && (
            <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-600">
              <Building2 size={13} />
              <span>{contact.company}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 group">
            <div className="p-1.5 bg-blue-50 rounded-md group-hover:bg-blue-100">
              <Phone size={14} className="text-blue-500" />
            </div>
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 group">
            <div className="p-1.5 bg-blue-50 rounded-md group-hover:bg-blue-100">
              <Mail size={14} className="text-blue-500" />
            </div>
            {contact.email}
          </a>
        )}
        {contact.address && (
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <MapPin size={14} className="text-blue-500" />
            </div>
            {contact.address}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={13} className="text-gray-400" />
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag.trim()}</span>
          ))}
        </div>
      )}

      {contact.memo && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 font-medium mb-1">메모</p>
          <p className="text-sm text-gray-700 leading-relaxed">{contact.memo}</p>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
            <Calendar size={12} />
            연결된 일정 ({events.length}건)
          </p>
          <div className="space-y-1.5">
            {events.slice(0, 3).map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                <span className="text-gray-700 truncate">{ev.title}</span>
                <span className="text-gray-400 text-xs shrink-0">
                  {new Date(ev.start_dt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
            {events.length > 3 && <p className="text-xs text-gray-400">+ {events.length - 3}건 더...</p>}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
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
