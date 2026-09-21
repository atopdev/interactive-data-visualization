import { useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import Aurora from '@/components/react-bits/Aurora'
import Galaxy from '@/components/react-bits/Galaxy'
import GradientText from '@/components/react-bits/GradientText'
import Iridescence from '@/components/react-bits/Iridescence'
import Particles from '@/components/react-bits/Particles'
import Silk from '@/components/react-bits/Silk'
import Threads from '@/components/react-bits/Threads'
import Waves from '@/components/react-bits/Waves'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { toHex, toUnitRgb } from '@/lib/colors'
import { fakeWith } from '@/lib/fake'
import { BACKGROUNDS, type BackgroundId } from '../backgrounds'
import { CodeSnippet, ColorControl } from '../showcase'
import { WebGLStage } from '@/components/webgl-stage'
import { usage } from '../usage'

const LABELS: Record<BackgroundId, string> = {
  aurora: 'Aurora',
  particles: 'Particles',
  silk: 'Silk',
  threads: 'Threads',
  waves: 'Waves',
  iridescence: 'Iridescence',
  galaxy: 'Galaxy',
}

const COPY = fakeWith('bits-hero', (f) => ({
  kicker: f.company.buzzNoun(),
  line: f.company.catchPhrase(),
}))

export function BackgroundHero({
  background,
  onChange,
}: {
  background: BackgroundId
  onChange: (bg: BackgroundId) => void
}) {
  const theme = useChartTheme()
  const light = theme.mode === 'light'
  const [speed, setSpeed] = useState(1)
  const [custom, setCustom] = useState<string | null>(null)
  const color = custom ?? toHex(theme.accent)
  const second = toHex(theme.series[0])
  const third = toHex(theme.series[4])

  const { element, code } = (() => {
    switch (background) {
      case 'aurora': {
        const props = {
          colorStops: [color, second, third],
          amplitude: 1.1,
          blend: 0.55,
          speed,
          lightMode: light,
        }
        return { element: <Aurora {...props} />, code: usage('Aurora', props) }
      }
      case 'particles': {
        const props = {
          particleColors: [color, second, third],
          particleCount: 260,
          particleSpread: 10,
          speed: 0.15 * speed,
          particleBaseSize: 110,
          moveParticlesOnHover: true,
          alphaParticles: false,
        }
        return {
          element: <Particles {...props} />,
          code: usage('Particles', props),
        }
      }
      case 'silk': {
        const props = {
          color,
          speed: 5 * speed,
          scale: 1,
          noiseIntensity: 1.4,
          rotation: 0,
          lightMode: light,
        }
        return { element: <Silk {...props} />, code: usage('Silk', props) }
      }
      case 'threads': {
        const props = {
          color: toUnitRgb(color),
          amplitude: 1.2 * speed,
          distance: 0.1,
          enableMouseInteraction: true,
        }
        return {
          element: <Threads {...props} />,
          code: usage('Threads', props),
        }
      }
      case 'waves': {
        const props = {
          lineColor: color,
          backgroundColor: 'transparent',
          waveSpeedX: 0.0125 * speed,
          waveSpeedY: 0.01 * speed,
          waveAmpX: 40,
          waveAmpY: 20,
          xGap: 12,
          yGap: 36,
        }
        return { element: <Waves {...props} />, code: usage('Waves', props) }
      }
      case 'iridescence': {
        const props = {
          color: toUnitRgb(color),
          speed,
          amplitude: 0.1,
          mouseReact: true,
        }
        return {
          element: <Iridescence {...props} />,
          code: usage('Iridescence', props),
        }
      }
      case 'galaxy': {
        const props = {
          density: 1.2,
          glowIntensity: 0.4,
          saturation: 0.6,
          hueShift: 240,
          speed,
          mouseInteraction: true,
          mouseRepulsion: true,
          transparent: true,
          lightMode: light,
        }
        return { element: <Galaxy {...props} />, code: usage('Galaxy', props) }
      }
    }
  })()

  return (
    <DemoSection
      id="backgrounds"
      title="Background switcher"
      description="Seven animated backgrounds (six WebGL shaders via ogl or react-three-fiber, plus a canvas Waves field). Only the selected one is mounted, and only while this hero owns the page's single WebGL slot; switching unmounts and disposes the previous context. The choice is stored in the URL."
      source="generated"
      sourceLabel="React Bits · Backgrounds"
      reveal
      bodyClassName="p-0 sm:p-0"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={background}
            onValueChange={(v) => v && onChange(v as BackgroundId)}
            aria-label="Background"
            className="flex-wrap"
          >
            {BACKGROUNDS.map((b) => (
              <ToggleGroupItem key={b} value={b} className="px-3">
                {LABELS[b]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <SliderControl
            label="Speed"
            value={speed}
            min={0.2}
            max={3}
            step={0.1}
            onChange={setSpeed}
            format={(v) => `${v.toFixed(1)}×`}
          />
          {background !== 'galaxy' && (
            <ColorControl label="Color" value={color} onChange={setCustom} />
          )}
        </>
      }
    >
      <div className="relative h-[30rem] overflow-hidden bg-background">
        <WebGLStage
          id="bits-hero"
          poster={
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--page-accent),transparent_60%)] opacity-40" />
          }
        >
          <div key={background} className="absolute inset-0">
            {element}
          </div>
        </WebGLStage>
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
              {LABELS[background]} · {COPY.kicker}
            </p>
            <GradientText
              colors={[color, second, third, color]}
              animationSpeed={6}
              className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl"
            >
              {COPY.line}
            </GradientText>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <CodeSnippet code={code} />
      </div>
    </DemoSection>
  )
}
