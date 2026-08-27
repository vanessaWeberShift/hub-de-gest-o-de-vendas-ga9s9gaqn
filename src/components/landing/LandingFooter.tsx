import React from 'react'
import { Link } from 'react-router-dom'
import {
  Receipt,
  Heart,
  ShieldCheck,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react'

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void
}

export const LandingFooter: React.FC<FooterProps> = ({ onNavigateSection }) => {
  const handleScrollTo = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault()
    if (onNavigateSection) {
      onNavigateSection(sectionId)
    } else {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Description (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 focus:outline-none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  Hub <span className="text-emerald-400">Vendas</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                  WShift Tecnologia
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              A plataforma definitiva para lojistas e marcas que vendem em múltiplos marketplaces e
              precisam emitir notas fiscais em lote com certificado digital A1.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-500">Siga-nos:</span>
              <div className="flex items-center gap-2 text-slate-400">
                <a
                  href="#social"
                  className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#social"
                  className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#social"
                  className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Col 1: Produto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Produto</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="#funcionalidades"
                  onClick={(e) => handleScrollTo(e, 'funcionalidades')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <a
                  href="#marketplaces"
                  onClick={(e) => handleScrollTo(e, 'marketplaces')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Marketplaces Homologados
                </a>
              </li>
              <li>
                <a
                  href="#como-funciona"
                  onClick={(e) => handleScrollTo(e, 'como-funciona')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Como Funciona
                </a>
              </li>
              <li>
                <a
                  href="#planos"
                  onClick={(e) => handleScrollTo(e, 'planos')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Planos e Preços
                </a>
              </li>
              <li>
                <a
                  href="#blog"
                  onClick={(e) => handleScrollTo(e, 'blog')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Blog & Artigos
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Suporte e Integrações */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Suporte & Ajuda
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleScrollTo(e, 'faq')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Central de Dúvidas (FAQ)
                </a>
              </li>
              <li>
                <a
                  href="#contato"
                  onClick={(e) => handleScrollTo(e, 'contato')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Falar com Especialista
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Acessar Painel / Login
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Status dos Sistemas: 100% Online
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Segurança */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal & Segurança
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <span className="hover:text-slate-300 cursor-pointer">Termos de Uso</span>
              </li>
              <li>
                <span className="hover:text-slate-300 cursor-pointer">Política de Privacidade</span>
              </li>
              <li>
                <span className="hover:text-slate-300 cursor-pointer">Segurança & LGPD</span>
              </li>
              <li className="pt-2">
                <div className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>SEFAZ & Certificado A1</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2025 WShift Tecnologia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span>Desenvolvido com tecnologia de alta performance</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
