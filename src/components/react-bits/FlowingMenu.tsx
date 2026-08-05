import React, { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'

interface MenuItemData {
  link: string
  text: string
  image: string
}

interface FlowingMenuProps {
  items?: MenuItemData[]
  speed?: number
  textColor?: string
  bgColor?: string
  marqueeBgColor?: string
  marqueeTextColor?: string
  borderColor?: string
}

interface MenuItemProps extends MenuItemData {
  speed: number
  textColor: string
  marqueeBgColor: string
  marqueeTextColor: string
  borderColor: string
  isFirst: boolean
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({
  items = [],
  speed = 15,
  textColor = '#fff',
  bgColor = '#120F17',
  marqueeBgColor = '#fff',
  marqueeTextColor = '#120F17',
  borderColor = '#fff',
}) => {
  return (
    <div className="h-full w-full overflow-hidden" style={{ backgroundColor: bgColor }}>
      <nav className="m-0 flex h-full flex-col p-0">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            isFirst={idx === 0}
          />
        ))}
      </nav>
    </div>
  )
}

const MenuItem: React.FC<MenuItemProps> = ({
  link,
  text,
  image,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  isFirst,
}) => {
  const itemRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const marqueeInnerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const [repetitions, setRepetitions] = useState(4)

  const animationDefaults = { duration: 0.6, ease: 'expo' }

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number,
  ): 'top' | 'bottom' => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2)
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2)
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom'
  }

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return
      const marqueeContent = marqueeInnerRef.current.querySelector(
        '.marquee-part',
      ) as HTMLElement
      if (!marqueeContent) return
      const contentWidth = marqueeContent.offsetWidth
      const viewportWidth = window.innerWidth
      const needed = Math.ceil(viewportWidth / contentWidth) + 2
      setRepetitions(Math.max(4, needed))
    }

    calculateRepetitions()
    window.addEventListener('resize', calculateRepetitions)
    return () => window.removeEventListener('resize', calculateRepetitions)
  }, [text, image])

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return
      const marqueeContent = marqueeInnerRef.current.querySelector(
        '.marquee-part',
      ) as HTMLElement
      if (!marqueeContent) return
      const contentWidth = marqueeContent.offsetWidth
      if (contentWidth === 0) return

      if (animationRef.current) {
        animationRef.current.kill()
      }

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: 'none',
        repeat: -1,
      })
    }

    const timer = setTimeout(setupMarquee, 50)
    return () => {
      clearTimeout(timer)
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [text, image, repetitions, speed])

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    )

    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0)
  }

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    )

    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
  }

  return (
    <div
      className="relative flex-1 overflow-hidden text-center"
      ref={itemRef}
      style={{ borderTop: isFirst ? 'none' : `1px solid ${borderColor}` }}
    >
      <a
        className="relative flex h-full cursor-pointer items-center justify-center text-[4vh] font-semibold uppercase no-underline"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ color: textColor }}
      >
        {text}
      </a>
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-full translate-y-[101%] overflow-hidden"
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
      >
        <div className="flex h-full w-fit" ref={marqueeInnerRef}>
          {[...Array(repetitions)].map((_, idx) => (
            <div
              className="marquee-part flex flex-shrink-0 items-center"
              key={idx}
              style={{ color: marqueeTextColor }}
            >
              <span className="px-[1vw] text-[4vh] leading-[1] font-normal whitespace-nowrap uppercase">
                {text}
              </span>
              <div
                className="mx-[2vw] my-[2em] h-[7vh] w-[200px] rounded-[50px] bg-cover bg-center py-[1em]"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FlowingMenu
