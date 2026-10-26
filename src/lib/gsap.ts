import { useGSAP } from '@gsap/react'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

export { DrawSVGPlugin, gsap, ScrollTrigger, SplitText, useGSAP }
