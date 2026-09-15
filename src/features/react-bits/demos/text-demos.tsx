import '@fontsource-variable/roboto-flex/full.css'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { SliderControl, SwitchControl } from '@/components/page/control'
import BlurText from '@/components/react-bits/BlurText'
import CircularText from '@/components/react-bits/CircularText'
import CountUp from '@/components/react-bits/CountUp'
import DecryptedText from '@/components/react-bits/DecryptedText'
import GradientText from '@/components/react-bits/GradientText'
import ScrollReveal from '@/components/react-bits/ScrollReveal'
import ShinyText from '@/components/react-bits/ShinyText'
import SplitText from '@/components/react-bits/SplitText'
import TextPressure from '@/components/react-bits/TextPressure'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { toHex } from '@/lib/colors'
import { fakeWith } from '@/lib/fake'
import type { BadgeState } from '@/components/page/source-badge'
import { ColorControl, Showcase } from '../showcase'
import { usage } from '../usage'

const TEXT = fakeWith('bits-text', (f) => ({
  split: f.company.catchPhrase(),
  blur: f.hacker.phrase(),
  shiny: f.company.buzzPhrase(),
  decrypt: f.internet.domainName(),
  gradient: f.company.name(),
  circular: `${f.word.adjective()} * ${f.word.noun()} * `.toUpperCase(),
  pressure: f.word.noun({ length: { min: 5, max: 8 } }),
  reveal: Array.from({ length: 2 }, () => f.company.catchPhrase()).join('. ') + '.',
}))

const CATEGORY = 'React Bits · Text Animations'

function Replay({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <RotateCcw /> Replay
    </Button>
  )
}

export function SplitTextShowcase() {
  const [split, setSplit] = useState<'chars' | 'words'>('chars')
  const [delay, setDelay] = useState(40)
  const [run, setRun] = useState(0)
  const props = {
    text: TEXT.split,
    splitType: split,
    delay,
    duration: 0.6,
    ease: 'power3.out',
    textAlign: 'center' as const,
  }
  return (
    <Showcase
      id="split-text"
      title="SplitText"
      category={CATEGORY}
      description="GSAP SplitText under the hood: characters or words rise in with a stagger when scrolled into view."
      code={usage('SplitText', props)}
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={split}
            onValueChange={(v) => v && setSplit(v as 'chars' | 'words')}
          >
            <ToggleGroupItem value="chars">Chars</ToggleGroupItem>
            <ToggleGroupItem value="words">Words</ToggleGroupItem>
          </ToggleGroup>
          <SliderControl
            label="delay (ms)"
            value={delay}
            min={10}
            max={150}
            step={5}
            onChange={setDelay}
          />
          <Replay onClick={() => setRun((r) => r + 1)} />
        </>
      }
    >
      <SplitText
        key={`${run}-${split}-${delay}`}
        {...props}
        className="text-3xl font-semibold tracking-tight sm:text-4xl"
      />
    </Showcase>
  )
}

export function BlurTextShowcase() {
  const [animateBy, setAnimateBy] = useState<'words' | 'letters'>('words')
  const [direction, setDirection] = useState<'top' | 'bottom'>('top')
  const [run, setRun] = useState(0)
  const props = { text: TEXT.blur, animateBy, direction, delay: 120 }
  return (
    <Showcase
      id="blur-text"
      title="BlurText"
      category={CATEGORY}
      description="Motion-powered: each word or letter animates from blurred and offset to sharp."
      code={usage('BlurText', props)}
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={animateBy}
            onValueChange={(v) => v && setAnimateBy(v as 'words' | 'letters')}
          >
            <ToggleGroupItem value="words">Words</ToggleGroupItem>
            <ToggleGroupItem value="letters">Letters</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={direction}
            onValueChange={(v) => v && setDirection(v as 'top' | 'bottom')}
          >
            <ToggleGroupItem value="top">From top</ToggleGroupItem>
            <ToggleGroupItem value="bottom">From bottom</ToggleGroupItem>
          </ToggleGroup>
          <Replay onClick={() => setRun((r) => r + 1)} />
        </>
      }
    >
      <BlurText
        key={`${run}-${animateBy}-${direction}`}
        {...props}
        className="justify-center text-center text-2xl font-semibold sm:text-3xl"
      />
    </Showcase>
  )
}

export function ShinyTextShowcase() {
  const theme = useChartTheme()
  const [speed, setSpeed] = useState(2)
  const [spread, setSpread] = useState(120)
  const props = {
    text: TEXT.shiny,
    speed,
    spread,
    color: toHex(theme.muted),
    shineColor: toHex(theme.foreground),
  }
  return (
    <Showcase
      id="shiny-text"
      title="ShinyText"
      category={CATEGORY}
      description="A highlight sweeps across the text via an animated background-clip gradient."
      code={usage('ShinyText', props)}
      controls={
        <>
          <SliderControl
            label="speed (s)"
            value={speed}
            min={0.5}
            max={6}
            step={0.25}
            onChange={setSpeed}
          />
          <SliderControl
            label="spread (°)"
            value={spread}
            min={30}
            max={180}
            step={5}
            onChange={setSpread}
          />
        </>
      }
    >
      <ShinyText {...props} className="text-center text-3xl font-semibold capitalize" />
    </Showcase>
  )
}

export function DecryptedTextShowcase() {
  const [animateOn, setAnimateOn] = useState<'hover' | 'view' | 'click'>('hover')
  const [sequential, setSequential] = useState(true)
  const [speed, setSpeed] = useState(50)
  const props = {
    text: TEXT.decrypt,
    animateOn,
    sequential,
    speed,
    revealDirection: 'start' as const,
  }
  return (
    <Showcase
      id="decrypted-text"
      title="DecryptedText"
      category={CATEGORY}
      description="Characters scramble through random glyphs before resolving, triggered by hover, view or click."
      code={usage('DecryptedText', props)}
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={animateOn}
            onValueChange={(v) => v && setAnimateOn(v as 'hover' | 'view' | 'click')}
          >
            <ToggleGroupItem value="hover">Hover</ToggleGroupItem>
            <ToggleGroupItem value="view">View</ToggleGroupItem>
            <ToggleGroupItem value="click">Click</ToggleGroupItem>
          </ToggleGroup>
          <SwitchControl
            label="Sequential"
            checked={sequential}
            onChange={setSequential}
          />
          <SliderControl
            label="speed (ms)"
            value={speed}
            min={10}
            max={150}
            step={5}
            onChange={setSpeed}
          />
        </>
      }
    >
      <DecryptedText
        key={`${animateOn}-${sequential}`}
        {...props}
        className="font-mono text-2xl sm:text-3xl"
        encryptedClassName="font-mono text-2xl text-page-accent sm:text-3xl"
        parentClassName="cursor-pointer"
      />
    </Showcase>
  )
}

export function GradientTextShowcase() {
  const theme = useChartTheme()
  const [speed, setSpeed] = useState(6)
  const [border, setBorder] = useState(false)
  const [a, setA] = useState<string | null>(null)
  const colors = [
    a ?? toHex(theme.accent),
    toHex(theme.series[0]),
    toHex(theme.series[4]),
    a ?? toHex(theme.accent),
  ]
  const props = { colors, animationSpeed: speed, showBorder: border }
  return (
    <Showcase
      id="gradient-text"
      title="GradientText"
      category={CATEGORY}
      description="An animated multi-stop gradient clipped to the text, with an optional matching border."
      code={usage('GradientText', props, TEXT.gradient)}
      controls={
        <>
          <SliderControl
            label="animationSpeed"
            value={speed}
            min={1}
            max={16}
            onChange={setSpeed}
            format={(v) => `${v}s`}
          />
          <SwitchControl label="Border" checked={border} onChange={setBorder} />
          <ColorControl label="Primary" value={colors[0]} onChange={setA} />
        </>
      }
    >
      <GradientText
        {...props}
        className="px-4 py-1 text-4xl font-semibold tracking-tight"
      >
        {TEXT.gradient}
      </GradientText>
    </Showcase>
  )
}

export function CircularTextShowcase() {
  const [spin, setSpin] = useState(20)
  const [onHover, setOnHover] = useState<'speedUp' | 'slowDown' | 'pause' | 'goBonkers'>(
    'speedUp',
  )
  const props = { text: TEXT.circular, spinDuration: spin, onHover }
  return (
    <Showcase
      id="circular-text"
      title="CircularText"
      category={CATEGORY}
      description="Letters laid out on a circle that spins continuously and reacts on hover."
      code={usage('CircularText', props)}
      controls={
        <>
          <SliderControl
            label="spinDuration"
            value={spin}
            min={4}
            max={40}
            onChange={setSpin}
            format={(v) => `${v}s`}
          />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={onHover}
            onValueChange={(v) => v && setOnHover(v as typeof onHover)}
            className="flex-wrap"
          >
            {(['speedUp', 'slowDown', 'pause', 'goBonkers'] as const).map((h) => (
              <ToggleGroupItem key={h} value={h} className="px-2 text-xs">
                {h}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      }
    >
      <CircularText {...props} className="font-semibold text-foreground" />
    </Showcase>
  )
}

export function TextPressureShowcase() {
  const theme = useChartTheme()
  const [width, setWidth] = useState(true)
  const [weight, setWeight] = useState(true)
  const [italic, setItalic] = useState(true)
  const props = {
    text: TEXT.pressure,
    fontFamily: 'Roboto Flex Variable',
    width,
    weight,
    italic,
    alpha: false,
    flex: true,
    textColor: toHex(theme.foreground),
    minFontSize: 36,
  }
  return (
    <Showcase
      id="text-pressure"
      title="TextPressure"
      category={CATEGORY}
      description="Each letter's variable-font axes (width, weight, slant) respond to pointer proximity. Uses a locally bundled Roboto Flex, so no font request leaves the app."
      code={usage('TextPressure', props)}
      previewClassName="h-64 place-items-stretch"
      controls={
        <>
          <SwitchControl label="Width" checked={width} onChange={setWidth} />
          <SwitchControl label="Weight" checked={weight} onChange={setWeight} />
          <SwitchControl label="Italic" checked={italic} onChange={setItalic} />
        </>
      }
    >
      <div className="relative size-full">
        <TextPressure {...props} />
      </div>
    </Showcase>
  )
}

export function ScrollRevealShowcase() {
  const [blur, setBlur] = useState(true)
  const [rotation, setRotation] = useState(3)
  const props = {
    enableBlur: blur,
    baseOpacity: 0.1,
    baseRotation: rotation,
    blurStrength: 4,
  }
  return (
    <Showcase
      id="scroll-reveal"
      title="ScrollReveal"
      category={CATEGORY}
      description="Words brighten, un-blur and straighten as the paragraph scrolls through the viewport (GSAP ScrollTrigger, scrubbed)."
      code={usage('ScrollReveal', props, TEXT.reveal)}
      controls={
        <>
          <SwitchControl label="Blur" checked={blur} onChange={setBlur} />
          <SliderControl
            label="baseRotation"
            value={rotation}
            min={0}
            max={10}
            onChange={setRotation}
            format={(v) => `${v}°`}
          />
        </>
      }
    >
      <ScrollReveal
        key={`${blur}-${rotation}`}
        {...props}
        textClassName="text-2xl! sm:text-3xl! leading-snug"
      >
        {TEXT.reveal}
      </ScrollReveal>
    </Showcase>
  )
}

export function CountUpShowcase({
  total,
  source,
  sourceReason,
}: {
  total: number
  source: BadgeState
  sourceReason?: string
}) {
  const [duration, setDuration] = useState(2)
  const [run, setRun] = useState(0)
  const props = { from: 0, to: total, separator: ',', duration }
  return (
    <Showcase
      id="count-up"
      source={source}
      sourceReason={sourceReason}
      title="CountUp"
      category={CATEGORY}
      description="A spring-driven counter that starts when in view. Here it counts to the combined npm downloads of the five libraries showcased on this site over the last year."
      code={usage('CountUp', props)}
      controls={
        <>
          <SliderControl
            label="duration"
            value={duration}
            min={0.5}
            max={6}
            step={0.5}
            onChange={setDuration}
            format={(v) => `${v}s`}
          />
          <Replay onClick={() => setRun((r) => r + 1)} />
        </>
      }
    >
      <div className="text-center">
        <CountUp
          key={`${run}-${duration}`}
          {...props}
          className="text-4xl font-semibold tabular-nums sm:text-5xl"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          npm downloads · last 12 months
        </p>
      </div>
    </Showcase>
  )
}
