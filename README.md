# AI Marketing - PWA (오프라인 버전)

연락처 · 스케줄러 · 메모 통합 영업 관리 앱

서버 없이 브라우저 로컬(IndexedDB)에 데이터를 저장하는 PWA 버전입니다.

## 배포 주소

**https://jmcreat.github.io/ai-marketing-public/**

## 주요 기능

- **연락처**: 수동 입력 / 명함 OCR / vCard 가져오기 / 태그 필터
- **스케줄러**: FullCalendar 월/주/목록 뷰 · 드래그앤드롭 · 연락처 연결
- **메모**: TipTap 리치텍스트 에디터 · 날짜별 자동저장 · dot indicator

## 데이터 저장

모든 데이터는 **브라우저 IndexedDB**에 저장됩니다.  
서버 연결 없이 완전 오프라인으로 동작합니다.

## 로컬 실행

```bash
cd frontend-local
npm install
npm run dev
```

## 기술 스택

- React + Vite + TypeScript + TailwindCSS
- Dexie.js (IndexedDB)
- FullCalendar · TipTap
- PWA (vite-plugin-pwa)
