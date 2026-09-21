import { Archive, Home, Settings, Sparkles, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SliderControl, SwitchControl } from '@/components/page/control'
import CircularGallery from '@/components/react-bits/CircularGallery'
import Dock from '@/components/react-bits/Dock'
import FlowingMenu from '@/components/react-bits/FlowingMenu'
import Masonry from '@/components/react-bits/Masonry'
import SpotlightCard from '@/components/react-bits/SpotlightCard'
import Stack from '@/components/react-bits/Stack'
import TiltedCard from '@/components/react-bits/TiltedCard'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { toHex } from '@/lib/colors'
import { fakeProfiles, fakeWith } from '@/lib/fake'
import { picsum, picsumSet } from '@/lib/picsum'
import { Showcase } from '../showcase'
import { WebGLStage } from '@/components/webgl-stage'
import { usage } from '../usage'

const CATEGORY = 'React Bits · Components'

export function DockShowcase() {
  const [magnification, setMagnification] = useState(70)
  const [size, setSize] = useState(50)
  const [clicked, setClicked] = useState('none yet')
  const items = [
    {
      icon: <Home size={18} />,
      label: 'Home',
      onClick: () => setClicked('Home'),
    },
    {
      icon: <Archive size={18} />,
      label: 'Archive',
      onClick: () => setClicked('Archive'),
    },
    {
      icon: <User size={18} />,
      label: 'Profile',
      onClick: () => setClicked('Profile'),
    },
    {
      icon: <Sparkles size={18} />,
      label: 'Magic',
      onClick: () => setClicked('Magic'),
    },
    {
      icon: <Settings size={18} />,
      label: 'Settings',
      onClick: () => setClicked('Settings'),
    },
  ]
  const props = {
    magnification,
    baseItemSize: size,
    panelHeight: size + 18,
    distance: 180,
  }
  return (
    <Showcase
      id="dock"
      title="Dock"
      category={CATEGORY}
      description="A macOS-style dock: items magnify with a spring based on pointer distance, with hover labels."
      code={usage('Dock', { items: [] as unknown[], ...props }).replace(
        'items={[]}',
        'items={items}',
      )}
      previewClassName="h-64 p-0"
      controls={
        <>
          <SliderControl
            label="magnification"
            value={magnification}
            min={50}
            max={110}
            onChange={setMagnification}
          />
          <SliderControl
            label="baseItemSize"
            value={size}
            min={36}
            max={64}
            onChange={setSize}
          />
          <span className="text-xs text-muted-foreground">
            Clicked: {clicked}
          </span>
        </>
      }
    >
      <Dock items={items} {...props} />
    </Showcase>
  )
}

const MASONRY_ITEMS = picsumSet('bits-masonry', 14, 600, 800).map((p, i) => ({
  id: p.id,
  img: picsum({ seed: p.seed, w: 600, h: [520, 800, 640, 900, 560][i % 5] }),
  url: picsum({ seed: p.seed, w: 1600, h: 1200 }),
  height: [520, 800, 640, 900, 560][i % 5],
}))

export function MasonryShowcase() {
  const [animateFrom, setAnimateFrom] = useState<
    'bottom' | 'center' | 'random'
  >('bottom')
  const [blur, setBlur] = useState(true)
  const [run, setRun] = useState(0)
  const props = {
    animateFrom,
    blurToFocus: blur,
    scaleOnHover: true,
    hoverScale: 0.95,
    colorShiftOnHover: false,
    stagger: 0.05,
  }
  return (
    <Showcase
      id="masonry"
      title="Masonry"
      category={CATEGORY}
      description="A responsive masonry grid of picsum photos laid out in JS and animated in with GSAP from a chosen origin, blurring into focus."
      code={usage('Masonry', { items: [] as unknown[], ...props }).replace(
        'items={[]}',
        'items={items}',
      )}
      previewClassName="block h-[34rem] overflow-y-auto p-3"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={animateFrom}
            onValueChange={(v) => {
              if (!v) return
              setAnimateFrom(v as typeof animateFrom)
              setRun((r) => r + 1)
            }}
          >
            <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="random">Random</ToggleGroupItem>
          </ToggleGroup>
          <SwitchControl
            label="blurToFocus"
            checked={blur}
            onChange={setBlur}
          />
        </>
      }
    >
      <div className="h-[56rem]">
        <Masonry key={`${run}-${blur}`} items={MASONRY_ITEMS} {...props} />
      </div>
    </Showcase>
  )
}

const GALLERY = fakeWith('bits-gallery', (f) =>
  Array.from({ length: 8 }, (_, i) => ({
    image: picsum({ seed: `bits-gallery-${i}`, w: 800, h: 600, webp: false }),
    text: f.location.city(),
  })),
)

export function CircularGalleryShowcase() {
  const theme = useChartTheme()
  const [bend, setBend] = useState(3)
  const [radius, setRadius] = useState(0.05)
  const props = {
    bend,
    borderRadius: radius,
    scrollSpeed: 2,
    scrollEase: 0.05,
    textColor: toHex(theme.foreground),
    font: "bold 28px 'Geist Variable'",
  }
  return (
    <Showcase
      id="circular-gallery"
      title="CircularGallery"
      category={CATEGORY}
      description="An ogl WebGL carousel of picsum photos bent along an arc; drag or scroll to spin it. Runs only while it owns the WebGL slot."
      code={usage('CircularGallery', {
        items: [] as unknown[],
        ...props,
      }).replace('items={[]}', 'items={items}')}
      previewClassName="h-96 p-0 place-items-stretch"
      controls={
        <>
          <SliderControl
            label="bend"
            value={bend}
            min={-6}
            max={6}
            step={0.5}
            onChange={setBend}
          />
          <SliderControl
            label="borderRadius"
            value={radius}
            min={0}
            max={0.3}
            step={0.01}
            onChange={setRadius}
            format={(v) => v.toFixed(2)}
          />
        </>
      }
    >
      <WebGLStage id="bits-circular-gallery">
        <CircularGallery
          key={`${bend}-${radius}-${theme.mode}`}
          items={GALLERY}
          {...props}
        />
      </WebGLStage>
    </Showcase>
  )
}

const TILT = fakeWith('bits-tilted', (f) => ({
  title: f.music.songName(),
  artist: f.music.artist(),
}))

export function TiltedCardShowcase() {
  const [amp, setAmp] = useState(12)
  const [scale, setScale] = useState(1.08)
  const props = {
    imageSrc: picsum({ seed: 'bits-tilted', w: 600, h: 600 }),
    altText: `${TILT.title} by ${TILT.artist}`,
    captionText: `${TILT.title} · ${TILT.artist}`,
    containerHeight: '300px',
    containerWidth: '300px',
    imageHeight: '300px',
    imageWidth: '300px',
    rotateAmplitude: amp,
    scaleOnHover: scale,
    showMobileWarning: false,
    showTooltip: true,
    displayOverlayContent: true,
  }
  return (
    <Showcase
      id="tilted-card"
      title="TiltedCard"
      category={CATEGORY}
      description="A spring-tilted image card with a pointer-following caption tooltip and overlay content."
      code={usage('TiltedCard', props)}
      controls={
        <>
          <SliderControl
            label="rotateAmplitude"
            value={amp}
            min={2}
            max={30}
            onChange={setAmp}
            format={(v) => `${v}°`}
          />
          <SliderControl
            label="scaleOnHover"
            value={scale}
            min={1}
            max={1.3}
            step={0.01}
            onChange={setScale}
            format={(v) => v.toFixed(2)}
          />
        </>
      }
    >
      <TiltedCard
        {...props}
        overlayContent={
          <p className="m-4 rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
            {TILT.title}
          </p>
        }
      />
    </Showcase>
  )
}

const STACK_PEOPLE = fakeProfiles('bits-stack', 4)

export function StackShowcase() {
  const [random, setRandom] = useState(true)
  const [sensitivity, setSensitivity] = useState(180)
  const [autoplay, setAutoplay] = useState(false)
  const cards = useMemo(
    () =>
      STACK_PEOPLE.map((p, i) => (
        <img
          key={p.id}
          // Fixed seeds, vetted by eye: the profile-derived seed landed on a flag photo.
          src={picsum({ seed: `bits-stack-card-${i}`, w: 500, h: 500 })}
          alt={`Portrait for ${p.name}`}
          width={500}
          height={500}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="pointer-events-none size-full object-cover"
        />
      )),
    [],
  )
  const props = {
    randomRotation: random,
    sensitivity,
    sendToBackOnClick: true,
    autoplay,
    autoplayDelay: 2500,
    pauseOnHover: true,
  }
  return (
    <Showcase
      id="stack"
      title="Stack"
      category={CATEGORY}
      description="A draggable card stack (Motion): fling the top card past the sensitivity threshold, or click, to send it to the back."
      code={usage('Stack', { cards: [] as unknown[], ...props }).replace(
        'cards={[]}',
        'cards={cards}',
      )}
      controls={
        <>
          <SwitchControl
            label="randomRotation"
            checked={random}
            onChange={setRandom}
          />
          <SwitchControl
            label="autoplay"
            checked={autoplay}
            onChange={setAutoplay}
          />
          <SliderControl
            label="sensitivity"
            value={sensitivity}
            min={60}
            max={300}
            step={10}
            onChange={setSensitivity}
          />
        </>
      }
    >
      <div className="size-56">
        <Stack cards={cards} {...props} />
      </div>
    </Showcase>
  )
}

const SPOT = fakeWith('bits-spotlight', (f) =>
  Array.from({ length: 2 }, () => ({
    title: f.commerce.productName(),
    body: f.commerce.productDescription(),
  })),
)

export function SpotlightCardShowcase() {
  const [opacity, setOpacity] = useState(0.25)
  const theme = useChartTheme()
  const [r, g, b] = (theme.accent.match(/\d+/g) ?? ['139', '127', '255']).map(
    Number,
  )
  const spotlightColor = `rgba(${r}, ${g}, ${b}, ${opacity})` as const
  return (
    <Showcase
      id="spotlight-card"
      title="SpotlightCard"
      category={CATEGORY}
      description="A card with a radial spotlight that follows the pointer (color and strength are props)."
      code={usage('SpotlightCard', { spotlightColor }, '{children}')}
      controls={
        <SliderControl
          label="spotlight alpha"
          value={opacity}
          min={0.05}
          max={0.6}
          step={0.05}
          onChange={setOpacity}
          format={(v) => v.toFixed(2)}
        />
      }
    >
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {SPOT.map((s) => (
          <SpotlightCard
            key={s.title}
            spotlightColor={spotlightColor}
            className="p-6"
          >
            <Sparkles className="size-5 text-page-accent" />
            <p className="mt-3 font-semibold">{s.title}</p>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {s.body}
            </p>
          </SpotlightCard>
        ))}
      </div>
    </Showcase>
  )
}

const MENU = fakeWith('bits-flowing', (f) =>
  Array.from({ length: 4 }, (_, i) => ({
    link: `#flowing-menu`,
    text: f.location.city(),
    image: picsum({ seed: `bits-flowing-${i}`, w: 600, h: 400 }),
  })),
)

export function FlowingMenuShowcase() {
  const theme = useChartTheme()
  const [speed, setSpeed] = useState(15)
  const props = {
    items: MENU,
    speed,
    textColor: toHex(theme.foreground),
    bgColor: toHex(theme.card),
    marqueeBgColor: toHex(theme.accent),
    marqueeTextColor: toHex(theme.background),
    borderColor: toHex(theme.border),
  }
  return (
    <Showcase
      id="flowing-menu"
      title="FlowingMenu"
      category={CATEGORY}
      description="Hover a row and a marquee of text and picsum images flows in from the edge you entered (GSAP)."
      code={usage('FlowingMenu', { ...props, items: [] as unknown[] }).replace(
        'items={[]}',
        'items={items}',
      )}
      previewClassName="h-96 p-0 place-items-stretch"
      controls={
        <SliderControl
          label="speed"
          value={speed}
          min={5}
          max={40}
          onChange={setSpeed}
          format={(v) => `${v}s`}
        />
      }
    >
      <FlowingMenu {...props} />
    </Showcase>
  )
}
