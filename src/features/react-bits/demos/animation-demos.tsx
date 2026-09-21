import { MousePointer2, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { SliderControl, SwitchControl } from '@/components/page/control'
import ClickSpark from '@/components/react-bits/ClickSpark'
import Magnet from '@/components/react-bits/Magnet'
import PixelTrail from '@/components/react-bits/PixelTrail'
import SplashCursor from '@/components/react-bits/SplashCursor'
import StarBorder from '@/components/react-bits/StarBorder'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { toHex } from '@/lib/colors'
import { useWebGLSlot } from '@/lib/webgl-slot'
import { ColorControl, Showcase } from '../showcase'
import { WebGLStage } from '@/components/webgl-stage'
import { usage } from '../usage'

const CATEGORY = 'React Bits · Animations'

export function ClickSparkShowcase() {
  const theme = useChartTheme()
  const [count, setCount] = useState(10)
  const [radius, setRadius] = useState(24)
  const [custom, setCustom] = useState<string | null>(null)
  const sparkColor = custom ?? toHex(theme.accent)
  const props = {
    sparkColor,
    sparkSize: 12,
    sparkRadius: radius,
    sparkCount: count,
    duration: 450,
  }
  return (
    <Showcase
      id="click-spark"
      title="ClickSpark"
      category={CATEGORY}
      description="Wrap anything and every click bursts into canvas-drawn sparks at the pointer."
      code={usage('ClickSpark', props, '{children}')}
      previewClassName="p-0 place-items-stretch"
      controls={
        <>
          <SliderControl
            label="sparkCount"
            value={count}
            min={4}
            max={24}
            onChange={setCount}
          />
          <SliderControl
            label="sparkRadius"
            value={radius}
            min={8}
            max={80}
            onChange={setRadius}
          />
          <ColorControl label="Color" value={sparkColor} onChange={setCustom} />
        </>
      }
    >
      <ClickSpark {...props}>
        <div className="grid h-64 w-full cursor-crosshair place-items-center text-sm text-muted-foreground select-none">
          <span className="flex items-center gap-2">
            <MousePointer2 className="size-4" /> Click anywhere in here
          </span>
        </div>
      </ClickSpark>
    </Showcase>
  )
}

export function MagnetShowcase() {
  const [padding, setPadding] = useState(100)
  const [strength, setStrength] = useState(3)
  const props = { padding, magnetStrength: strength, disabled: false }
  return (
    <Showcase
      id="magnet"
      title="Magnet"
      category={CATEGORY}
      description="Children drift towards the pointer once it enters the padded field around them."
      code={usage('Magnet', props, '{children}')}
      controls={
        <>
          <SliderControl
            label="padding"
            value={padding}
            min={20}
            max={200}
            step={10}
            onChange={setPadding}
          />
          <SliderControl
            label="magnetStrength"
            value={strength}
            min={1}
            max={10}
            onChange={setStrength}
            format={(v) => `÷${v}`}
          />
        </>
      }
    >
      <Magnet {...props}>
        <div className="rounded-2xl border bg-card px-8 py-5 text-sm font-medium shadow-lg">
          Come closer
        </div>
      </Magnet>
    </Showcase>
  )
}

export function StarBorderShowcase() {
  const theme = useChartTheme()
  const [speed, setSpeed] = useState(5)
  const [thickness, setThickness] = useState(2)
  const props = { color: toHex(theme.accent), speed: `${speed}s`, thickness }
  return (
    <Showcase
      id="star-border"
      title="StarBorder"
      category={CATEGORY}
      description="Two blurred light spots orbit the border of any element (a button by default)."
      code={usage('StarBorder', props, 'Star border')}
      controls={
        <>
          <SliderControl
            label="speed"
            value={speed}
            min={1}
            max={12}
            onChange={setSpeed}
            format={(v) => `${v}s`}
          />
          <SliderControl
            label="thickness"
            value={thickness}
            min={1}
            max={6}
            onChange={setThickness}
            format={(v) => `${v}px`}
          />
        </>
      }
    >
      <StarBorder
        {...props}
        backgroundColor={toHex(theme.card)}
        textColor={toHex(theme.foreground)}
        borderColor={toHex(theme.border)}
        className="text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="size-4" /> Star border
        </span>
      </StarBorder>
    </Showcase>
  )
}

export function PixelTrailShowcase() {
  const theme = useChartTheme()
  const [enabled, setEnabled] = useState(false)
  const [gridSize, setGridSize] = useState(40)
  const [trailSize, setTrailSize] = useState(0.1)
  const props = {
    gridSize,
    trailSize,
    maxAge: 250,
    interpolate: 5,
    color: toHex(theme.accent),
    gooeyFilter: { id: 'bits-goo', strength: 2 },
  }
  return (
    <Showcase
      id="pixel-trail"
      title="PixelTrail"
      category={CATEGORY}
      description="A react-three-fiber shader lights up grid cells along the pointer's path. WebGL, so it is off by default and only runs while it holds the page's WebGL slot."
      code={usage('PixelTrail', props)}
      previewClassName="p-0 h-72 place-items-stretch"
      controls={
        <>
          <SwitchControl
            label="Enable (WebGL)"
            checked={enabled}
            onChange={setEnabled}
          />
          <SliderControl
            label="gridSize"
            value={gridSize}
            min={10}
            max={80}
            step={5}
            onChange={setGridSize}
          />
          <SliderControl
            label="trailSize"
            value={trailSize}
            min={0.02}
            max={0.3}
            step={0.01}
            onChange={setTrailSize}
            format={(v) => v.toFixed(2)}
          />
        </>
      }
    >
      {enabled ? (
        <WebGLStage id="bits-pixel-trail" priority={1}>
          <PixelTrail key={gridSize} {...props} />
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Move your pointer across
          </p>
        </WebGLStage>
      ) : (
        <p className="grid place-items-center text-sm text-muted-foreground">
          Enable the toggle to start the effect
        </p>
      )}
    </Showcase>
  )
}

export function SplashCursorShowcase() {
  const [enabled, setEnabled] = useState(false)
  const [rainbow, setRainbow] = useState(true)
  const [curl, setCurl] = useState(3)
  const ref = useRef<HTMLDivElement>(null)
  // Full-screen fluid simulation: top priority, so every other WebGL demo pauses while it runs.
  const active = useWebGLSlot('bits-splash', ref, {
    fullscreen: true,
    priority: 10,
    enabled,
  })
  const props = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CURL: curl,
    SPLAT_RADIUS: 0.2,
    RAINBOW_MODE: rainbow,
    TRANSPARENT: true,
  }
  return (
    <Showcase
      id="splash-cursor"
      title="SplashCursor"
      category={CATEGORY}
      description="A full-screen WebGL fluid simulation that splashes color behind the cursor. Off by default; turning it on takes the page's single WebGL slot, pausing every other WebGL demo until you turn it off."
      code={usage('SplashCursor', props)}
      controls={
        <>
          <SwitchControl
            label="Enable (full-screen WebGL)"
            checked={enabled}
            onChange={setEnabled}
          />
          <SwitchControl
            label="Rainbow"
            checked={rainbow}
            onChange={setRainbow}
          />
          <SliderControl
            label="CURL"
            value={curl}
            min={0}
            max={30}
            onChange={setCurl}
          />
        </>
      }
    >
      <div ref={ref} className="text-center text-sm text-muted-foreground">
        {enabled
          ? active
            ? 'Move the pointer anywhere on the page'
            : 'Waiting for the WebGL slot…'
          : 'Disabled'}
      </div>
      {active && <SplashCursor key={`${rainbow}-${curl}`} {...props} />}
    </Showcase>
  )
}
