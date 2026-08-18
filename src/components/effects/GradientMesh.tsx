export default function GradientMesh() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-40 -left-40 h-[42rem] w-[42rem] rounded-full bg-cyan-brand/12 blur-[140px]" />
      <div className="absolute top-1/3 -right-48 h-[38rem] w-[38rem] rounded-full bg-purple-brand/14 blur-[150px]" />
      <div className="absolute -bottom-56 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[#0066ff]/10 blur-[160px]" />
      <div className="absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
    </div>
  )
}
