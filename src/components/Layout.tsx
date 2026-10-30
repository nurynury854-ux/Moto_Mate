import { NavLink, Outlet } from 'react-router-dom'
import { CloudSun, Fuel, Gauge, Settings, Stethoscope, Wrench } from 'lucide-react'
import { cx, km } from './ui'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Home', icon: Gauge },
  { to: '/garage', label: 'Garage', icon: Wrench },
  { to: '/fuel', label: 'Fuel', icon: Fuel },
  { to: '/ride', label: 'Ride?', icon: CloudSun },
  { to: '/diagnose', label: 'Diagnose', icon: Stethoscope },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/icon.svg" alt="" className="h-9 w-9" />
      <div className="leading-tight">
        <div className="font-display text-2xl font-bold uppercase italic tracking-wide">
          Moto<span className="text-accent">Mate</span>
        </div>
        <div className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Ride smarter in Taiwan</div>
      </div>
    </div>
  )
}

export function Layout() {
  const { bike } = useStore()
  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="carbon sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line p-5 md:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {[...NAV, { to: '/settings', label: 'Settings', icon: Settings }].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-base font-semibold uppercase tracking-wider transition-colors',
                  isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />}
                  <Icon size={18} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-line bg-black/40 p-3 text-xs">
          <div className="font-display font-semibold uppercase tracking-[0.16em] text-muted">Your bike</div>
          <div className="mt-0.5 font-semibold">{bike.nickname}</div>
          <div className="text-muted">{bike.model}</div>
          <div className="num mt-2 text-sm text-ink">{km(bike.odometer)} <span className="text-muted">km</span></div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <NavLink to="/settings" aria-label="Settings" className={({ isActive }) => cx('rounded-lg p-2', isActive ? 'text-accent' : 'text-muted')}>
          <Settings size={20} />
        </NavLink>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pt-10 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cx('relative flex flex-col items-center gap-1 py-2.5 font-display text-xs font-semibold uppercase tracking-wider', isActive ? 'text-accent' : 'text-muted')}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />}
                <Icon size={20} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
