import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { Flip } from 'gsap/Flip'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { Observer } from 'gsap/Observer'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

// Every GSAP plugin is free since 3.13; register the ones this page uses once.
gsap.registerPlugin(
  useGSAP,
  Draggable,
  DrawSVGPlugin,
  Flip,
  InertiaPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  Observer,
  ScrambleTextPlugin,
  ScrollTrigger,
  SplitText,
)

export const NO_MOTION = '(prefers-reduced-motion: reduce)'
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export {
  Draggable,
  Flip,
  gsap,
  InertiaPlugin,
  MorphSVGPlugin,
  Observer,
  ScrollTrigger,
  SplitText,
  useGSAP,
}
