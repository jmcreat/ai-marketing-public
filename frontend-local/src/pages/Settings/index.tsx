import { useState, useRef } from 'react'
import { Cloud, CloudDownload, CloudUpload, RefreshCw, Download, Upload, CheckCircle, XCircle, Loader2, Info } from 'lucide-react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { pushAll, pullAll, syncAll, type SyncResult } from '../../lib/sync'
import { exportAll, importAll } from '../../lib/importExport'

type Op = 'push' | 'pull' | 'sync' | 'export' | 'import' | null

export default function SettingsPage() {
  const [op, setOp] = useState<Op>(null)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const fileRef = useRef<HTMLInputElement>(null)

  const supabaseOk = isSupabaseConfigured()

  async function run(action: Op, fn: () => Promise<SyncResult | void>) {
    setOp(action)
    setResult(null)
    try {
      const res = await fn()
      if (res) {
        const { contacts, events, memos, errors } = res as SyncResult
        if (errors.length > 0) {
          setResult({ ok: false, message: `오류: ${errors.join(', ')}` })
        } else {
          setResult({ ok: true, message: `완료 — 연락처 ${contacts}개, 일정 ${events}개, 메모 ${memos}개` })
        }
      } else {
        setResult({ ok: true, message: '완료되었습니다' })
      }
    } catch (e) {
      setResult({ ok: false, message: String(e) })
    } finally {
      setOp(null)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOp('import')
    setResult(null)
    try {
      const counts = await importAll(file, importMode)
      setResult({ ok: true, message: `가져오기 완료 — 연락처 ${counts.contacts}개, 일정 ${counts.events}개, 메모 ${counts.memos}개` })
    } catch (err) {
      setResult({ ok: false, message: String(err) })
    } finally {
      setOp(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const busy = op !== null

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="text-sm text-gray-500 mt-1">데이터 동기화 및 백업/복원</p>
      </div>

      {/* ── Supabase Sync ────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Cloud size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-800">Supabase 클라우드 동기화</h2>
          {supabaseOk ? (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">연결됨</span>
          ) : (
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">미설정</span>
          )}
        </div>

        {!supabaseOk && (
          <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex gap-2 text-sm text-amber-800">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Supabase 설정이 필요합니다</p>
              <p className="mt-1 text-amber-700">
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline">supabase.com</a>에서
                프로젝트를 만들고 <code className="bg-amber-100 px-1 rounded">.env.local</code> 파일에 아래 값을 추가하세요:
              </p>
              <pre className="mt-2 bg-amber-100 rounded p-2 text-xs text-amber-900 select-all">
{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...`}
              </pre>
              <p className="mt-1 text-amber-700">그 다음 <code className="bg-amber-100 px-1 rounded">supabase-schema.sql</code>을 Supabase SQL Editor에서 실행하세요.</p>
            </div>
          </div>
        )}

        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SyncButton
            label="양방향 동기화"
            desc="최신 데이터 우선"
            icon={<RefreshCw size={18} />}
            color="blue"
            disabled={!supabaseOk || busy}
            loading={op === 'sync'}
            onClick={() => run('sync', syncAll)}
          />
          <SyncButton
            label="업로드"
            desc="로컬 → 클라우드"
            icon={<CloudUpload size={18} />}
            color="indigo"
            disabled={!supabaseOk || busy}
            loading={op === 'push'}
            onClick={() => run('push', pushAll)}
          />
          <SyncButton
            label="다운로드"
            desc="클라우드 → 로컬"
            icon={<CloudDownload size={18} />}
            color="violet"
            disabled={!supabaseOk || busy}
            loading={op === 'pull'}
            onClick={() => run('pull', pullAll)}
          />
        </div>
      </section>

      {/* ── Import / Export ───────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Download size={18} className="text-green-500" />
          <h2 className="font-semibold text-gray-800">JSON 백업 / 복원</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">데이터 내보내기</p>
              <p className="text-xs text-gray-500">전체 데이터를 JSON 파일로 저장합니다</p>
            </div>
            <button
              onClick={() => run('export', exportAll)}
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {op === 'export' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              내보내기
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Import */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-800">데이터 가져오기</p>
                <p className="text-xs text-gray-500">JSON 백업 파일을 불러옵니다</p>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {op === 'import' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                가져오기
              </button>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>

            {/* Import mode */}
            <div className="flex gap-3">
              {(['merge', 'replace'] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="importMode"
                    value={mode}
                    checked={importMode === mode}
                    onChange={() => setImportMode(mode)}
                    className="accent-blue-600"
                  />
                  {mode === 'merge' ? '병합 (최신 우선)' : '전체 교체 (기존 삭제)'}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Result Toast */}
      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
          result.ok
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {result.ok
            ? <CheckCircle size={18} className="shrink-0 mt-0.5 text-green-600" />
            : <XCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          }
          <p>{result.message}</p>
          <button onClick={() => setResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Storage info */}
      <section className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-1">데이터 저장 위치</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li><span className="font-medium">로컬</span>: 브라우저 IndexedDB (이 기기에만 저장)</li>
          <li><span className="font-medium">Supabase</span>: 클라우드 PostgreSQL (여러 기기 공유)</li>
          <li>모바일과 공유하려면 양방향 동기화 또는 JSON 내보내기/가져오기를 사용하세요</li>
        </ul>
      </section>
    </div>
  )
}

// ── Sub-component ─────────────────────────────
interface SyncButtonProps {
  label: string
  desc: string
  icon: React.ReactNode
  color: 'blue' | 'indigo' | 'violet'
  disabled: boolean
  loading: boolean
  onClick: () => void
}

const colorMap = {
  blue:   'bg-blue-600 hover:bg-blue-700',
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
}

function SyncButton({ label, desc, icon, color, disabled, loading, onClick }: SyncButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg text-white transition-colors disabled:opacity-40 ${colorMap[color]}`}
    >
      {loading ? <Loader2 size={22} className="animate-spin" /> : icon}
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs opacity-80">{desc}</span>
    </button>
  )
}
