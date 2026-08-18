import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, GitBranch, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const links = [
  { label: 'Overview', href: '#overview' },
  { label: 'Cohort Analysis', href: '#cohort' },
  { label: 'RFM Segmentation', href: '#rfm' },
  { label: 'Churn Insights', href: '#churn' },
  { label: 'Power BI', href: '#powerbi' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/10 bg-navy/70 backdrop-blur-xl shadow-lg shadow-black/30'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#overview" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-brand to-purple-brand shadow-glow-cyan">
            <BarChart3 className="h-5 w-5 text-navy" strokeWidth={2.5} />
          </span>
          <span className="font-display text-sm font-bold tracking-wide text-softwhite sm:text-base">
            Churn<span className="text-gradient-animated">IQ</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="group relative rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors duration-300 hover:text-cyan-brand"
              >
                {link.label}
                <span className="absolute inset-x-3 -bottom-0.5 h-px scale-x-0 bg-gradient-to-r from-cyan-brand to-purple-brand transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-softwhite transition-all duration-300 hover:border-cyan-brand/50 hover:bg-cyan-brand/10 hover:shadow-glow-cyan"
          >
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="#contact"
            className="rounded-xl bg-gradient-to-r from-cyan-brand to-purple-brand px-4 py-2 text-sm font-semibold text-navy transition-all duration-300 hover:shadow-glow-cyan hover:brightness-110"
          >
            Contact
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-softwhite lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/10 bg-navy/90 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-cyan-brand/10 hover:text-cyan-brand"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-softwhite"
                >
                  <GitBranch className="h-4 w-4" /> GitHub
                </a>
                <a
                  href="#contact"
                  onClick={() => setOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-brand to-purple-brand px-4 py-2.5 text-sm font-semibold text-navy"
                >
                  Contact
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
