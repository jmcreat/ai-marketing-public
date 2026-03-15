import { useState, useMemo } from 'react'
import { Search, Plus, UserRound, Tag } from 'lucide-react'
import { useContacts } from '../../db/contacts'
import type { LocalContact } from '../../db/contacts'
import Modal from '../../components/Modal'
import ContactForm from './ContactForm'
import ContactDetail from './ContactDetail'

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>()
  const [selectedContact, setSelectedContact] = useState<LocalContact | null>(null)
  const [editContact, setEditContact] = useState<LocalContact | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const { data: contacts, isLoading } = useContacts(search || undefined, selectedTag)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    contacts.forEach((c) => {
      c.tags?.split(',').forEach((t) => {
        const trimmed = t.trim()
        if (trimmed) tags.add(trimmed)
      })
    })
    return Array.from(tags)
  }, [contacts])

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">연락처</h2>
            <p className="text-sm text-gray-500 mt-0.5">{contacts.length}명</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            추가
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 회사, 이메일, 전화번호..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setSelectedTag(undefined)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedTag ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">로딩 중...</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div className="p-4 bg-gray-100 rounded-full">
              <UserRound size={28} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">연락처가 없습니다.</p>
            <button onClick={() => setShowAdd(true)} className="text-sm text-blue-500 hover:underline">
              첫 번째 연락처 추가하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} onClick={() => setSelectedContact(contact)} />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="연락처 추가" size="lg">
        <ContactForm onSuccess={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={!!selectedContact} onClose={() => setSelectedContact(null)} title="연락처 상세" size="md">
        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            onEdit={() => { setEditContact(selectedContact); setSelectedContact(null) }}
            onClose={() => setSelectedContact(null)}
          />
        )}
      </Modal>

      <Modal isOpen={!!editContact} onClose={() => setEditContact(null)} title="연락처 편집" size="lg">
        {editContact && (
          <ContactForm contact={editContact} onSuccess={() => setEditContact(null)} />
        )}
      </Modal>
    </div>
  )
}

function ContactCard({ contact, onClick }: { contact: LocalContact; onClick: () => void }) {
  const tags = contact.tags?.split(',').filter(Boolean) ?? []
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">{contact.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{contact.name}</p>
          {contact.position && <p className="text-xs text-gray-500 truncate">{contact.position}</p>}
          {contact.company && <p className="text-xs text-gray-400 truncate">{contact.company}</p>}
        </div>
      </div>
      {(contact.phone || contact.email) && (
        <div className="mt-2.5 space-y-0.5">
          {contact.phone && <p className="text-xs text-gray-500 truncate">{contact.phone}</p>}
          {contact.email && <p className="text-xs text-gray-400 truncate">{contact.email}</p>}
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{tag.trim()}</span>
          ))}
        </div>
      )}
    </button>
  )
}
