import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calendar, ArrowRight, TrendingUp, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BLOG_POSTS = [
  {
    id: 1,
    title: 'Como emitir NF-e em lote para o Mercado Livre e Shopee sem erros',
    excerpt:
      'Descubra o passo a passo para automatizar a emissão fiscal de produtos e evitar atrasos na postagem dos pedidos.',
    date: '14 de Abril, 2025',
    category: 'Gestão Fiscal',
    readTime: '4 min de leitura',
    icon: FileText,
  },
  {
    id: 2,
    title: 'Certificado Digital A1 vs A3: Por que o modelo A1 é obrigatório para automação',
    excerpt:
      'Entenda as diferenças técnicas e práticas entre certificados digitais e saiba por que a nuvem exige o modelo A1.',
    date: '02 de Abril, 2025',
    category: 'Segurança & Certificados',
    readTime: '3 min de leitura',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: '5 estratégias para escalar vendas em múltiplos marketplaces sem perder o controle',
    excerpt:
      'Como sincronizar estoques, preços e unificar a visualização do faturamento real da sua empresa.',
    date: '28 de Março, 2025',
    category: 'E-commerce & Escala',
    readTime: '5 min de leitura',
    icon: TrendingUp,
  },
]

export const BlogSection: React.FC = () => {
  return (
    <section id="blog" className="py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200/60">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>Conteúdo & Dicas Práticas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Blog Hub Vendas
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Artigos, guias e novidades sobre legislação fiscal, e-commerce e gestão
              multi-marketplace.
            </p>
          </div>

          <Link to="/register">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:text-emerald-600 font-semibold text-xs"
            >
              <span>Ver todos os artigos</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => {
            const Icon = post.icon
            return (
              <article
                key={post.id}
                className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/80 hover:border-emerald-500/40 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5 group-hover:text-emerald-700 transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-emerald-700">
                  <span>{post.readTime}</span>
                  <span className="flex items-center gap-1">
                    Ler artigo
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
