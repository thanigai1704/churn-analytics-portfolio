import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface CounterProps {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export default function Counter({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 2.2,
  className = '',
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const motionValue = useMotionValue(0)
  const formatted = useTransform(motionValue, (latest) => {
    const fixed = latest.toFixed(decimals)
    return `${prefix}${Number(fixed).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  })

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] })
      return controls.stop
    }
  }, [inView, value, duration, motionValue])

  return (
    <motion.span ref={ref} className={className}>
      <motion.span>{formatted}</motion.span>
    </motion.span>
  )
}
