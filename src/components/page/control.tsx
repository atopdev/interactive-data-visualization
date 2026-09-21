import { useId, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

/** Labeled shadcn slider with a live value readout. */
export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
  className,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div
      className={cn('flex w-full min-w-40 flex-col gap-2 sm:w-48', className)}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <Label
          htmlFor={id}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}
        </Label>
        <span className="font-mono text-xs tabular-nums">{format(value)}</span>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      />
    </div>
  )
}

export function SwitchControl({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
    </div>
  )
}
