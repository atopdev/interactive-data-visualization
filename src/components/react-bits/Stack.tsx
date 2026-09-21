import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'motion/react'
import { useState, useEffect } from 'react'

interface CardRotateProps {
  children: React.ReactNode
  onSendToBack: () => void
  sensitivity: number
  disableDrag?: boolean
}

function CardRotate({
  children,
  onSendToBack,
  sensitivity,
  disableDrag = false,
}: CardRotateProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-100, 100], [60, -60])
  const rotateY = useTransform(x, [-100, 100], [-60, 60])

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    if (
      Math.abs(info.offset.x) > sensitivity ||
      Math.abs(info.offset.y) > sensitivity
    ) {
      onSendToBack()
    } else {
      x.set(0)
      y.set(0)
    }
  }

  if (disableDrag) {
    return (
      <motion.div
        className="absolute inset-0 cursor-pointer"
        style={{ x: 0, y: 0 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}

interface StackProps {
  randomRotation?: boolean
  sensitivity?: number
  sendToBackOnClick?: boolean
  cards?: React.ReactNode[]
  animationConfig?: { stiffness: number; damping: number }
  autoplay?: boolean
  autoplayDelay?: number
  pauseOnHover?: boolean
  mobileClickOnly?: boolean
  mobileBreakpoint?: number
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
}: StackProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])

  const shouldDisableDrag = mobileClickOnly && isMobile
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag

  const [stack, setStack] = useState<
    { id: number; content: React.ReactNode }[]
  >(() => {
    if (cards.length) {
      return cards.map((content, index) => ({ id: index + 1, content }))
    } else {
      return [
        {
          id: 1,
          content: (
            <img
              src="https://picsum.photos/seed/rb-stack-0/500/500.webp"
              alt="card-1"
              className="pointer-events-none h-full w-full object-cover"
            />
          ),
        },
        {
          id: 2,
          content: (
            <img
              src="https://picsum.photos/seed/rb-stack-1/500/500.webp"
              alt="card-2"
              className="pointer-events-none h-full w-full object-cover"
            />
          ),
        },
        {
          id: 3,
          content: (
            <img
              src="https://picsum.photos/seed/rb-stack-2/500/500.webp"
              alt="card-3"
              className="pointer-events-none h-full w-full object-cover"
            />
          ),
        },
        {
          id: 4,
          content: (
            <img
              src="https://picsum.photos/seed/rb-stack-3/500/500.webp"
              alt="card-4"
              className="pointer-events-none h-full w-full object-cover"
            />
          ),
        },
      ]
    }
  })

  // Re-derive the stack when the cards prop changes (render-phase update instead of an effect).
  const [prevCards, setPrevCards] = useState(cards)
  if (cards !== prevCards) {
    setPrevCards(cards)
    if (cards.length) {
      setStack(cards.map((content, index) => ({ id: index + 1, content })))
    }
  }

  const sendToBack = (id: number) => {
    setStack((prev) => {
      const newStack = [...prev]
      const index = newStack.findIndex((card) => card.id === id)
      const [card] = newStack.splice(index, 1)
      newStack.unshift(card)
      return newStack
    })
  }

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id
        sendToBack(topCardId)
      }, autoplayDelay)

      return () => clearInterval(interval)
    }
  }, [autoplay, autoplayDelay, stack, isPaused])

  return (
    <div
      className="relative h-full w-full"
      style={{
        perspective: 600,
      }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        // Deterministic per-card jitter keeps render pure (no Math.random during render).
        const randomRotate = randomRotation
          ? (((card.id * 9301 + 49297) % 233280) / 233280) * 10 - 5
          : 0
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="h-full w-full overflow-hidden rounded-2xl"
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: '90% 90%',
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        )
      })}
    </div>
  )
}
