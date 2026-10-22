import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ExecutiveOverview from './components/ExecutiveOverview'
import Impact from './components/Impact'
import Footer from './components/Footer'
import GradientMesh from './components/effects/GradientMesh'
import ParticleBackground from './components/effects/ParticleBackground'

const CohortAnalysis = lazy(() => import('./components/CohortAnalysis'))
const RFMSegmentation = lazy(() => import('./components/RFMSegmentation'))
const ChurnInsights = lazy(() => import('./components/ChurnInsights'))
const SqlAudit = lazy(() => import('./components/SqlAudit'))
const PowerBI = lazy(() => import('./components/PowerBI'))

function SectionFallback() {
  return (
    <div className="flex items-center justify-center py-40">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-brand/20 border-t-cyan-brand" />
    </div>
  )
}

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-navy text-softwhite antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-brand/14 blur-[170px]" />
        <div className="absolute top-1/3 -right-72 h-[36rem] w-[36rem] rounded-full bg-purple-brand/16 blur-[190px]" />
        <div className="absolute bottom-1/4 -left-72 h-[34rem] w-[34rem] rounded-full bg-pink-brand/12 blur-[180px]" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>
      <GradientMesh />
      <ParticleBackground />

      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <ExecutiveOverview />
          <Suspense fallback={<SectionFallback />}>
            <CohortAnalysis />
            <RFMSegmentation />
            <ChurnInsights />
            <SqlAudit />
            <PowerBI />
          </Suspense>
          <Impact />
        </main>
        <Footer />
      </div>
    </div>
  )
}
