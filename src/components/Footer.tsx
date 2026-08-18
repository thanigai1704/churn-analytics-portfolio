import { motion } from 'framer-motion'
import {
  AtSign,
  BarChart3,
  GitBranch,
  Mail,
  MapPin,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import { source } from '../data/analytics'

export default function Footer() {
  const [sent, setSent] = useState(false)

  return (
    <footer id="contact" className="relative border-t border-white/10 px-5 pb-10 pt-20 sm:px-8">
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-brand/50 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a href="#overview" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-brand to-purple-brand shadow-glow-cyan">
                <BarChart3 className="h-5 w-5 text-navy" strokeWidth={2.5} />
              </span>
              <span className="font-display text-base font-bold text-softwhite">
                Churn<span className="text-gradient-animated">IQ</span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A portfolio project in customer retention and churn analytics — built to show how
              SQL, Python and analytics translate into business decisions.
            </p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
              All figures computed from the public{' '}
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-brand transition-colors hover:text-softwhite"
              >
                UCI Online Retail dataset
              </a>{' '}
              ({source.rows.toLocaleString()} transactions · {source.period} · {source.currency}).
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-cyan-brand" />
              Remote · Open to Data Analyst & BI roles
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="glass rounded-2xl p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold text-softwhite">
                Let's talk data <span className="text-gradient-animated">— and retention.</span>
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Hiring for a Data Analyst or BI role? I'd love to walk you through this pipeline.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
                className="mt-5 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="w-full flex-1 rounded-xl border border-white/10 bg-navy/60 px-4 py-3 text-sm text-softwhite placeholder-slate-500 outline-none transition-all duration-300 focus:border-cyan-brand/60 focus:shadow-glow-cyan"
                />
                <button
                  type="submit"
                  className={`group relative overflow-hidden rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 ${
                    sent
                      ? 'bg-emerald-brand text-navy'
                      : 'bg-gradient-to-r from-cyan-brand to-purple-brand text-navy hover:shadow-glow-cyan'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    {sent ? 'Message sent!' : 'Get in touch'}
                  </span>
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                {[
                  { icon: GitBranch, label: 'GitHub', href: 'https://github.com' },
                  { icon: AtSign, label: 'LinkedIn', href: 'https://linkedin.com' },
                  { icon: Mail, label: 'Email', href: 'mailto:hello@churniq.dev' },
                ].map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-cyan-brand/40 hover:text-cyan-brand hover:shadow-glow-cyan"
                  >
                    <social.icon className="h-4 w-4" />
                    {social.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ChurnIQ — Customer Retention & Churn Analysis Portfolio.
          </p>
          <p className="text-xs text-slate-600">
            Built with <span className="text-cyan-brand">React</span>,{' '}
            <span className="text-purple-brand">TypeScript</span>,{' '}
            <span className="text-emerald-brand">Tailwind CSS</span> & Framer Motion.
          </p>
        </div>
      </div>
    </footer>
  )
}
