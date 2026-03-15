import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // 1시간마다 업데이트 확인
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 text-sm">
      <span>새 버전이 있습니다</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-lg font-medium transition-colors"
      >
        업데이트
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        나중에
      </button>
    </div>
  )
}
