import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { LocalContact } from '../../db/contacts'
import { createContact, updateContact, importVcardLocal } from '../../db/contacts'
import { Camera, Upload, FileInput, Loader2 } from 'lucide-react'
import api from '../../api/client'
import type { OcrResult } from '../../api/types'

interface Props {
  contact?: LocalContact
  onSuccess: () => void
}

type Tab = 'manual' | 'camera' | 'upload' | 'vcard'

export default function ContactForm({ contact, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('manual')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [vcardLoading, setVcardLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Omit<LocalContact, 'id' | 'created_at' | 'updated_at'>>({
    defaultValues: contact ?? {},
  })

  const applyOcrResult = (result: OcrResult) => {
    if (result.name) setValue('name', result.name)
    if (result.company) setValue('company', result.company)
    if (result.position) setValue('position', result.position)
    if (result.phone) setValue('phone', result.phone)
    if (result.email) setValue('email', result.email)
    if (result.address) setValue('address', result.address)
    setTab('manual')
  }

  const handleCameraOrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<OcrResult>('/api/contacts/ocr', form)
      applyOcrResult(data)
    } catch {
      alert('OCR 서버에 연결할 수 없습니다. 수동으로 입력해 주세요.')
      setTab('manual')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleVcardImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVcardLoading(true)
    try {
      const text = await file.text()
      const count = await importVcardLocal(text)
      alert(`${count}명의 연락처를 가져왔습니다.`)
      onSuccess()
    } catch {
      alert('vCard 파일을 읽을 수 없습니다.')
    } finally {
      setVcardLoading(false)
    }
  }

  const onSubmit = async (data: Omit<LocalContact, 'id' | 'created_at' | 'updated_at'>) => {
    if (contact?.id) {
      await updateContact(contact.id, data)
    } else {
      await createContact(data)
    }
    onSuccess()
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'manual', label: '수동 입력', icon: null },
    { key: 'camera', label: '카메라', icon: <Camera size={14} /> },
    { key: 'upload', label: '이미지 업로드', icon: <Upload size={14} /> },
    { key: 'vcard', label: 'vCard 가져오기', icon: <FileInput size={14} /> },
  ]

  return (
    <div>
      {!contact && (
        <div className="flex gap-1 mb-6 border-b border-gray-200 pb-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {(tab === 'camera' || tab === 'upload') && (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-300 rounded-xl text-center gap-3">
          {ocrLoading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm">명함 인식 중...</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 rounded-full">
                {tab === 'camera' ? <Camera size={28} className="text-blue-500" /> : <Upload size={28} className="text-blue-500" />}
              </div>
              <p className="text-sm text-gray-600 font-medium">
                {tab === 'camera' ? '카메라로 명함을 촬영하세요' : '명함 이미지를 업로드하세요'}
              </p>
              <p className="text-xs text-gray-400">OCR 서버 연결 시 자동 인식됩니다</p>
              <label className="mt-2 cursor-pointer px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                {tab === 'camera' ? '촬영하기' : '파일 선택'}
                <input
                  type="file"
                  accept="image/*"
                  capture={tab === 'camera' ? 'environment' : undefined}
                  className="hidden"
                  onChange={handleCameraOrUpload}
                />
              </label>
            </>
          )}
        </div>
      )}

      {tab === 'vcard' && (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-300 rounded-xl text-center gap-3">
          {vcardLoading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm">vCard 가져오는 중...</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-purple-50 rounded-full">
                <FileInput size={28} className="text-purple-500" />
              </div>
              <p className="text-sm text-gray-600 font-medium">.vcf 파일을 업로드하세요</p>
              <p className="text-xs text-gray-400">폰에 저장됩니다 (서버 불필요)</p>
              <label className="mt-2 cursor-pointer px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors">
                파일 선택
                <input type="file" accept=".vcf" className="hidden" onChange={handleVcardImport} />
              </label>
            </>
          )}
        </div>
      )}

      {tab === 'manual' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: '이름을 입력하세요' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="홍길동"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
              <input
                {...register('position')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="팀장"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사</label>
            <input
              {...register('company')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="(주)ABC 기업"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <input
                {...register('phone')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="010-1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                {...register('email')}
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              {...register('address')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="서울시 강남구..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
            <input
              {...register('tags')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="VIP,파트너,잠재고객 (쉼표 구분)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              {...register('memo')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="추가 메모..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              {contact ? '저장' : '추가'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
