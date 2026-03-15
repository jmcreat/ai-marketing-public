import { useRef, useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core'
import { Plus } from 'lucide-react'
import { useEvents, updateEvent } from '../../db/events'
import type { LocalEvent } from '../../db/events'
import { useMemoDates } from '../../db/memos'
import Modal from '../../components/Modal'
import EventForm from './EventForm'
import EventDetail from './EventDetail'

export default function SchedulerPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [rangeStart, setRangeStart] = useState<string>()
  const [rangeEnd, setRangeEnd] = useState<string>()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const { data: events } = useEvents(rangeStart, rangeEnd)
  const { data: memoDates } = useMemoDates(currentMonth)

  const [showAdd, setShowAdd] = useState(false)
  const [initialStart, setInitialStart] = useState<string>()
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null)
  const [editEvent, setEditEvent] = useState<LocalEvent | null>(null)

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRangeStart(arg.startStr)
    setRangeEnd(arg.endStr)
    const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2)
    setCurrentMonth(`${mid.getFullYear()}-${String(mid.getMonth() + 1).padStart(2, '0')}`)
  }, [])

  const handleDateSelect = useCallback((arg: DateSelectArg) => {
    setInitialStart(arg.startStr)
    setShowAdd(true)
  }, [])

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const ev = events.find((e) => String(e.id) === arg.event.id)
      if (ev) setSelectedEvent(ev)
    },
    [events],
  )

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const id = Number(arg.event.id)
    await updateEvent(id, {
      start_dt: arg.event.startStr,
      end_dt: arg.event.endStr || undefined,
    })
  }, [])

  const fcEvents = events.map((ev) => ({
    id: String(ev.id),
    title: ev.title,
    start: ev.start_dt,
    end: ev.end_dt,
    allDay: ev.all_day,
    backgroundColor: ev.color,
    borderColor: ev.color,
  }))

  // Memo dot indicators (background events)
  const memoBackgrounds = memoDates.map((d) => ({
    id: `memo-${d}`,
    start: d,
    allDay: true,
    display: 'background',
    backgroundColor: '#EEF2FF',
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">스케줄러</h2>
          <p className="text-sm text-gray-500 mt-0.5">일정을 관리하세요</p>
        </div>
        <button
          onClick={() => { setInitialStart(undefined); setShowAdd(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          일정 추가
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 md:p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 md:p-4 h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listWeek',
            }}
            buttonText={{ today: '오늘', month: '월', week: '주', list: '목록' }}
            locale="ko"
            selectable
            editable
            events={[...fcEvents, ...memoBackgrounds]}
            datesSet={handleDatesSet}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="100%"
          />
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="일정 추가" size="md">
        <EventForm initialStart={initialStart} onSuccess={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="일정 상세" size="md">
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onEdit={() => { setEditEvent(selectedEvent); setSelectedEvent(null) }}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </Modal>

      <Modal isOpen={!!editEvent} onClose={() => setEditEvent(null)} title="일정 편집" size="md">
        {editEvent && (
          <EventForm
            eventId={editEvent.id}
            defaultValues={editEvent}
            onSuccess={() => setEditEvent(null)}
          />
        )}
      </Modal>
    </div>
  )
}
