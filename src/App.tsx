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
            <PowerBI />
          </Suspense>
          <Impact />
        </main>
        <Footer />
      </div>
    </div>
  )
}
