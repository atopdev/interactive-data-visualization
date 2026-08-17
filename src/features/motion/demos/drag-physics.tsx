import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { SliderControl, SwitchControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'

export function DragPhysicsDemo() {
  const bounds = useRef<HTMLDivElement>(null)
  const [elastic, setElastic] = useState(0.35)
  const [power, setPower] = useState(0.3)
  const [momentum, setMomentum] = useState(true)

  const tile =
    'grid size-24 place-items-center rounded-2xl text-center text-xs font-semibold text-white shadow-lg select-none sm:size-28'

  return (
    <DemoSection
      id="drag"
      index={5}
      title="Drag: constraints, elastic, momentum, snap-to-origin"
      description="All three tiles are constrained to the box. dragElastic sets how far they stretch past the edge, dragTransition's power sets how far momentum carries them after release, and the last tile uses dragSnapToOrigin to spring home."
      source="generated"
      controls={
        <>
          <SliderControl
            label="dragElastic"
            value={elastic}
            min={0}
            max={1}
            step={0.05}
            onChange={setElastic}
            format={(v) => v.toFixed(2)}
          />
          <SliderControl
            label="momentum power"
            value={power}
            min={0.05}
            max={0.8}
            step={0.05}
            onChange={setPower}
            format={(v) => v.toFixed(2)}
          />
          <SwitchControl label="Momentum" checked={momentum} onChange={setMomentum} />
        </>
      }
    >
      <div
        ref={bounds}
        className="bg-dot-grid relative flex h-80 items-center justify-around overflow-hidden rounded-xl border border-dashed bg-surface-2"
      >
        <motion.div
          drag
          dragConstraints={bounds}
          dragElastic={elastic}
          dragMomentum={momentum}
          dragTransition={{ power, timeConstant: 280 }}
          whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
          className={`${tile} cursor-grab bg-[var(--series-1)]`}
        >
          Constrained
          <br />+ elastic
        </motion.div>
        <motion.div
          drag="x"
          dragConstraints={bounds}
          dragElastic={elastic}
          dragMomentum={momentum}
          dragTransition={{ power, bounceStiffness: 400, bounceDamping: 12 }}
          whileDrag={{ scale: 1.08 }}
          className={`${tile} cursor-ew-resize bg-[var(--series-3)]`}
        >
          X axis
          <br />+ bounce
        </motion.div>
        <motion.div
          drag
          dragConstraints={bounds}
          dragElastic={elastic}
          dragSnapToOrigin
          whileDrag={{ scale: 1.08, rotate: 6 }}
          className={`${tile} cursor-grab bg-[var(--series-7)]`}
        >
          Snap to
          <br />
          origin
        </motion.div>
      </div>
    </DemoSection>
  )
}
