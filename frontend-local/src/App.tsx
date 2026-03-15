import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ContactsPage from './pages/Contacts'
import SchedulerPage from './pages/Scheduler'
import MemoPage from './pages/Memo'
import PwaUpdater from './components/PwaUpdater'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/contacts" replace />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="scheduler" element={<SchedulerPage />} />
          <Route path="memo" element={<MemoPage />} />
        </Route>
      </Routes>
      <PwaUpdater />
    </BrowserRouter>
  )
}
