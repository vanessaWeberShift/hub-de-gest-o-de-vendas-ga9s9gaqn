import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Receipt, Menu, X, ArrowRight, LogIn, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onNavigateSection?: (sectionId: string) => void
}

export const LandingHeader: React.FC<HeaderProps> = ({ onNavigateSection }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLinkClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    if (location.pathname !== '/') {
      navigate('/#' + sectionId)
      return
    }

    if (onNavigateSection) {
      onNavigateSection(sectionId)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Hub <span className="text-emerald-600">Vendas</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase mt-0.5">
                Multi-Marketplace & NF-e
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#funcionalidades"
              onClick={(e) => handleLinkClick(e, 'funcionalidades')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#marketplaces"
              onClick={(e) => handleLinkClick(e, 'marketplaces')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Marketplaces
            </a>
            <a
              href="#como-funciona"
              onClick={(e) => handleLinkClick(e, 'como-funciona')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#planos"
              onClick={(e) => handleLinkClick(e, 'planos')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Planos
            </a>
            <a
              href="#faq"
              onClick={(e) => handleLinkClick(e, 'faq')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Dúvidas Frequentes
            </a>
            <a
              href="#blog"
              onClick={(e) => handleLinkClick(e, 'blog')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Blog
            </a>
          </nav>

          {/* Desktop Auth & Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm flex items-center gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                <span>Acessar Hub</span>
              </Button>
            </Link>

            <Link to="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all rounded-lg px-4 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span>Teste Grátis</span>
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/login" className="mr-1">
              <Button variant="ghost" size="sm" className="text-slate-700 px-2">
                Entrar
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-3">
            <a
              href="#funcionalidades"
              onClick={(e) => handleLinkClick(e, 'funcionalidades')}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              Funcionalidades
            </a>
            <a
              href="#marketplaces"
              onClick={(e) => handleLinkClick(e, 'marketplaces')}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              Marketplaces
            </a>
            <a
              href="#como-funciona"
              onClick={(e) => handleLinkClick(e, 'como-funciona')}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              Como Funciona
            </a>
            <a
              href="#planos"
              onClick={(e) => handleLinkClick(e, 'planos')}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              Planos e Preços
            </a>
            <a
              href="#faq"
              onClick={(e) => handleLinkClick(e, 'faq')}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              Dúvidas Frequentes (FAQ)
            </a>
            <a
              href="#contato"
              onClick={(e) => handleLinkClick(e, 'contato')}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              Falar com Especialista
            </a>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Acessar Hub (Login)
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white justify-center flex items-center gap-2">
                  <span>Começar Teste Grátis — 5 dias</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
