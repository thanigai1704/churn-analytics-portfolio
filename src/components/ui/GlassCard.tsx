import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  gradient = true,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl ${
        gradient ? 'gradient-border' : 'glass'
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-brand/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-0 pointer-events-none" />
      <div className="relative">{children}</div>
    </motion.div>
  )
}
