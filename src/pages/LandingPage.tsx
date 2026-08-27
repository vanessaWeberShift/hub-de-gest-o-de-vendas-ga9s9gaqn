import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { MarketplacesSection } from '@/components/landing/MarketplacesSection'
import { NfeSection } from '@/components/landing/NfeSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FaqSection } from '@/components/landing/FaqSection'
import { LeadCaptureSection } from '@/components/landing/LeadCaptureSection'
import { BlogSection } from '@/components/landing/BlogSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const LandingPage: React.FC = () => {
  const location = useLocation()

  // Handle hash or path-based scrolling (e.g. /planos, /faq, /contato or /#planos)
  useEffect(() => {
    let targetId = ''
    if (location.hash) {
      targetId = location.hash.replace('#', '')
    } else if (location.pathname === '/planos') {
      targetId = 'planos'
    } else if (location.pathname === '/faq') {
      targetId = 'faq'
    } else if (location.pathname === '/contato') {
      targetId = 'contato'
    }

    if (targetId) {
      const el = document.getElementById(targetId)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname, location.hash])

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header fixo com navegação */}
      <LandingHeader onNavigateSection={scrollToSection} />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection onContactClick={() => scrollToSection('contato')} />

        {/* 3. Seção Conecte todos os seus marketplaces */}
        <MarketplacesSection />

        {/* 4. Seção Emita NF-e sem complicação */}
        <NfeSection />

        {/* 5. Seção Como funciona (3 passos) */}
        <HowItWorksSection />

        {/* 6. Seção de Planos e Preços */}
        <PricingSection onContactClick={() => scrollToSection('contato')} />

        {/* 7. Seção de Dúvidas Frequentes (FAQ) */}
        <FaqSection onContactClick={() => scrollToSection('contato')} />

        {/* Blog Section */}
        <BlogSection />

        {/* 8. Seção de Captação de Leads */}
        <LeadCaptureSection />
      </main>

      {/* 9. Rodapé (Footer) */}
      <LandingFooter onNavigateSection={scrollToSection} />
    </div>
  )
}

export default LandingPage
