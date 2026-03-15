import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useMemo as useMemoData, useMemoDates, upsertMemo } from '../../db/memos'
import MemoEditor from './MemoEditor'

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

export default function MemoPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const monthKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`
  const { data: memo, isLoading } = useMemoData(selectedDate)
  const { data: memoDates } = useMemoDates(monthKey)

  useEffect(() => {
    setSaveStatus('idle')
  }, [selectedDate])

  const handleChange = useCallback(
    (html: string) => {
      setSaveStatus('saving')
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(async () => {
        await upsertMemo(selectedDate, html)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 1500)
    },
    [selectedDate],
  )

  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(formatDate(d))
  }

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(formatDate(d))
  }

  const today = formatDate(new Date())
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()
  const calCells = Array.from({ length: firstDay + daysCount }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  )

  return (
    <div className="flex h-full">
      {/* Sidebar: mini calendar */}
      <aside className="w-60 bg-white border-r border-gray-200 shrink-0 p-4 flex flex-col gap-4 hidden md:flex">
        <div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {calendarMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {weekDays.map((d) => (
              <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
            {calCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === today
              const hasMemo = memoDates.includes(dateStr)
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    isSelected ? 'bg-blue-500 text-white' : isToday ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                  {hasMemo && (
                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setSelectedDate(today)}
            className="w-full py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            오늘로 이동
          </button>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-auto">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
          메모가 있는 날
        </div>
      </aside>

      {/* Main memo area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goToPrevDay} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base md:text-lg font-bold text-gray-900">{formatDisplay(selectedDate)}</h2>
            <button onClick={goToNextDay} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-gray-400">
                <Loader2 size={13} className="animate-spin" /> 저장 중...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 size={13} /> 저장됨
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <Loader2 className="animate-spin mr-2" size={18} /> 로딩 중...
            </div>
          ) : (
            <MemoEditor
              key={selectedDate}
              content={memo?.content ?? ''}
              onChange={handleChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
