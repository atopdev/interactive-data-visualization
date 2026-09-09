import { useEffect, useRef, type CSSProperties } from 'react'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import type { ChartTheme } from '@/lib/colors'
import {
  echarts,
  type EChartsCoreOption,
  type EChartsEventHandler,
  type EChartsInstance,
} from '@/lib/echarts'
import { cn } from '@/lib/utils'

export interface EChartProps {
  option: EChartsCoreOption
  className?: string
  style?: CSSProperties
  /** Replace instead of merging when the option changes (default false). */
  notMerge?: boolean
  /** Component types replaced wholesale on update, e.g. ['series']. */
  replaceMerge?: string[]
  /** Called with the instance after each (re)initialization. */
  onReady?: (chart: EChartsInstance) => void
  onEvents?: Record<string, EChartsEventHandler>
  ariaLabel: string
}

function axisTheme(t: ChartTheme) {
  return {
    axisLine: { lineStyle: { color: t.border } },
    axisTick: { lineStyle: { color: t.border } },
    axisLabel: { color: t.muted },
    splitLine: { lineStyle: { color: t.grid } },
    nameTextStyle: { color: t.muted },
  }
}

/** Build an ECharts theme object from the app's CSS variables. */
function buildTheme(t: ChartTheme) {
  return {
    color: t.series,
    backgroundColor: 'transparent',
    textStyle: { color: t.foreground, fontFamily: t.font },
    title: { textStyle: { color: t.foreground }, subtextStyle: { color: t.muted } },
    legend: { textStyle: { color: t.muted }, inactiveColor: t.grid },
    tooltip: {
      backgroundColor: t.card,
      borderColor: t.border,
      textStyle: { color: t.foreground },
      extraCssText: 'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);',
    },
    categoryAxis: axisTheme(t),
    valueAxis: axisTheme(t),
    timeAxis: axisTheme(t),
    logAxis: axisTheme(t),
    dataZoom: {
      textStyle: { color: t.muted },
      borderColor: t.border,
      fillerColor: 'rgba(128,128,128,0.15)',
      handleStyle: { color: t.card, borderColor: t.muted },
      moveHandleStyle: { color: t.muted },
      dataBackground: { lineStyle: { color: t.muted }, areaStyle: { color: t.grid } },
    },
    visualMap: { textStyle: { color: t.muted } },
    radar: {
      axisName: { color: t.muted },
      splitLine: { lineStyle: { color: t.grid } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: t.grid } },
    },
    calendar: {
      itemStyle: { color: 'transparent', borderColor: t.background },
      dayLabel: { color: t.muted },
      monthLabel: { color: t.muted },
      yearLabel: { color: t.muted },
      splitLine: { lineStyle: { color: t.border } },
    },
  }
}

/**
 * Thin typed wrapper around `echarts.init`.
 *
 * - Each demo registers the chart/component modules it uses via
 *   `echarts.use` (see src/lib/echarts.ts), keeping bundles tree-shaken.
 * - A theme generated from CSS variables is registered per light/dark +
 *   accent combination; switching the app theme re-initializes the chart.
 * - ResizeObserver keeps it responsive; the instance is disposed on unmount.
 */
export function EChart({
  option,
  className,
  style,
  notMerge = false,
  replaceMerge,
  onReady,
  onEvents,
  ariaLabel,
}: EChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsInstance | null>(null)
  const theme = useChartTheme()
  const reduced = usePrefersReducedMotion()
  const themeName = `atlas-${theme.mode}-${theme.accent.replace(/\W+/g, '')}`

  // Keep the latest option/handlers available to the init effect without re-running it.
  const latest = useRef({ option, onReady, onEvents, ariaLabel, replaceMerge })
  useEffect(() => {
    latest.current = { option, onReady, onEvents, ariaLabel, replaceMerge }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    echarts.registerTheme(themeName, buildTheme(theme))
    const chart = echarts.init(el, themeName, { renderer: 'canvas' })
    chartRef.current = chart
    chart.setOption({
      aria: { enabled: true, label: { description: latest.current.ariaLabel } },
    })
    chart.setOption(
      reduced ? { ...latest.current.option, animation: false } : latest.current.option,
    )
    for (const [name, handler] of Object.entries(latest.current.onEvents ?? {})) {
      chart.on(name, (params: unknown) =>
        handler(params as Parameters<EChartsEventHandler>[0]),
      )
    }
    latest.current.onReady?.(chart)

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [themeName, theme, reduced])

  // The description can change with the data (e.g. a gauge value); update it in
  // place instead of re-initializing, which would restart every animation.
  useEffect(() => {
    chartRef.current?.setOption({ aria: { label: { description: ariaLabel } } })
  }, [ariaLabel])

  // Subsequent option updates are applied in place, so ECharts animates between states.
  const isFirst = useRef(true)
  // Keyed by content so inline arrays (new identity each render) don't re-apply.
  const replaceKey = replaceMerge?.join(',')
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    chartRef.current?.setOption(reduced ? { ...option, animation: false } : option, {
      notMerge,
      replaceMerge: latest.current.replaceMerge,
    })
  }, [option, notMerge, replaceKey, reduced])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className={cn('h-80 w-full', className)}
      style={style}
    />
  )
}
