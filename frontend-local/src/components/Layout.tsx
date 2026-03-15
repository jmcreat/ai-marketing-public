import { NavLink, Outlet } from 'react-router-dom'
import { Users, Calendar, FileText } from 'lucide-react'

const navItems = [
  { to: '/contacts', label: '연락처', icon: Users },
  { to: '/scheduler', label: '스케줄러', icon: Calendar },
  { to: '/memo', label: '메모', icon: FileText },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - 데스크탑만 표시 */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col shadow-sm shrink-0">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-blue-600 tracking-tight">AI Marketing</h1>
          <p className="text-xs text-gray-400 mt-0.5">영업 관리 플랫폼</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 모바일 상단 헤더 */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center shrink-0">
          <h1 className="text-base font-bold text-blue-600 tracking-tight">AI Marketing</h1>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* 모바일 하단 탭 바 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40
                        flex items-stretch safe-bottom"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
