import Reveal from './Reveal'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  highlight: string
  description?: string
  align?: 'left' | 'center'
}

export default function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = 'center',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left'
  return (
    <Reveal className={`flex flex-col ${alignment} gap-4`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-brand/30 bg-cyan-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-brand">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-brand animate-pulse" />
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl font-bold leading-tight text-softwhite sm:text-4xl lg:text-5xl">
        {title} <span className="text-gradient-animated">{highlight}</span>
      </h2>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-slate-400">
          {description}
        </p>
      )}
    </Reveal>
  )
}
