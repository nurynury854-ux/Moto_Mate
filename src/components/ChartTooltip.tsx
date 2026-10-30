interface Props {
  active?: boolean
  label?: string | number
  payload?: { value?: number | string }[]
  format: (v: number) => string
  labelFormat?: (l: string) => string
}

export function ChartTooltip({ active, payload, label, format, labelFormat }: Props) {
  if (!active || !payload?.length) return null
  const v = Number(payload[0].value)
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-xl">
      <div className="text-muted">{labelFormat ? labelFormat(String(label)) : label}</div>
      <div className="num mt-0.5 text-sm font-bold text-ink">{format(v)}</div>
    </div>
  )
}
