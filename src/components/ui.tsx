import type { ComponentProps, ReactNode } from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Card({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div className={cx('panel rounded-2xl border border-line p-5', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ icon, children, action }: { icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-muted">
        {icon && <span className="text-accent">{icon}</span>}
        {children}
      </h2>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">{title}</h1>
        <div className="stripe mt-2 ml-1" />
        {subtitle && <p className="mt-3 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function Stat({ label, value, unit, hint }: { label: string; value: ReactNode; unit?: string; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-[#0c0e11] p-4 shadow-[inset_0_1px_8px_#000]">
      <div className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="num text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  )
}

export type Tone = 'good' | 'warn' | 'bad' | 'accent'

export const toneText: Record<Tone, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  accent: 'text-accent',
}

/** Indicator-lamp badge: a glowing dot plus a condensed uppercase label. */
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const styles: Record<Tone, string> = {
    good: 'border-good/30 bg-good/10 text-good',
    warn: 'border-warn/40 bg-warn/10 text-warn',
    bad: 'border-bad/40 bg-bad/10 text-bad',
    accent: 'border-accent/30 bg-accent-soft text-accent',
  }
  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-display text-[13px] font-semibold uppercase tracking-wider whitespace-nowrap', styles[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      {children}
    </span>
  )
}

export function Button({ variant = 'primary', className, ...rest }: ComponentProps<'button'> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-gradient-to-b from-[#ff8a3d] to-accent text-black shadow-[inset_0_1px_0_#ffffff55,0_6px_18px_-6px_#ff6a13aa] hover:brightness-110',
    ghost: 'border border-line bg-surface-2 text-ink shadow-[inset_0_1px_0_#ffffff0a] hover:border-muted',
    danger: 'border border-bad/40 bg-bad/10 text-bad hover:bg-bad/20',
  }
  return (
    <button
      className={cx(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-display text-[15px] font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40',
        styles[variant],
        className,
      )}
      {...rest}
    />
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-line bg-[#0c0e11] px-3 py-2.5 text-sm text-ink shadow-[inset_0_1px_4px_#000] outline-none placeholder:text-muted/60 focus:border-accent'

export function Input(props: ComponentProps<'input'>) {
  return <input {...props} className={cx(inputClass, props.className)} />
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="text-muted">{icon}</div>
      <div className="font-semibold">{title}</div>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  )
}

export const nt = (n: number) => `NT$${Math.round(n).toLocaleString('en-US')}`
export const km = (n: number) => Math.round(n).toLocaleString('en-US')
