import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

// Only the canvas renderer is registered globally. Each demo registers the
// chart and component modules it uses with `echarts.use([...])`.
echarts.use([CanvasRenderer])

export { echarts }
export type EChartsInstance = echarts.ECharts
export type { ComposeOption, ECElementEvent, EChartsCoreOption } from 'echarts/core'
export type EChartsEventHandler = (params: echarts.ECElementEvent) => void
