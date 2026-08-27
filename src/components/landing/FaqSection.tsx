import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FAQ_ITEMS = [
  {
    id: 'item-1',
    question: 'Preciso ter certificado digital para usar o hub?',
    answer:
      'Sim, o certificado A1 é necessário para emitir NF-e com validade jurídica na SEFAZ. Você pode fazer o upload do seu arquivo .pfx ou .p12 diretamente na plataforma de forma 100% segura e criptografada.',
  },
  {
    id: 'item-2',
    question: 'Quais marketplaces vocês integram?',
    answer:
      'Atualmente oferecemos conexões diretas com Mercado Livre, Shopee, Amazon Brasil, Magalu, Netshoes e Shein. Novos portais e canais são adicionados constantemente à nossa grade.',
  },
  {
    id: 'item-3',
    question: 'Como funciona o teste grátis de 5 dias?',
    answer:
      'Você tem acesso completo a todas as funcionalidades por 5 dias, sem cobrança. Não pedimos cartão de crédito no momento do cadastro. Ao final do período, você escolhe se deseja migrar para um plano pago.',
  },
  {
    id: 'item-4',
    question: 'Posso trocar de plano depois?',
    answer:
      'Sim, você pode fazer upgrade ou downgrade a qualquer momento no seu painel de configurações. A diferença de valores é calculada e ajustada proporcionalmente e de forma automática.',
  },
  {
    id: 'item-5',
    question: 'Meus dados ficam seguros?',
    answer:
      'Totalmente. Seus dados são isolados por empresa (arquitetura multi-tenant) e trafegam exclusivamente sob conexão segura com criptografia SSL/TLS e padrão AES-256. Seguimos as melhores práticas de segurança e LGPD.',
  },
  {
    id: 'item-6',
    question: 'Preciso instalar alguma coisa no meu computador?',
    answer:
      'Nada! O Hub Vendas é 100% web — acesse de qualquer navegador moderno, seja no desktop, notebook, tablet ou celular, onde quer que você esteja.',
  },
  {
    id: 'item-7',
    question: 'Como funciona o cancelamento?',
    answer:
      'Você pode cancelar a sua assinatura a qualquer momento, sem nenhuma multa rescisória ou fidelidade. Seus dados e arquivos XML/DANFE ficam disponíveis para exportação por 30 dias após o encerramento.',
  },
  {
    id: 'item-8',
    question: 'Tem suporte para dúvidas fiscais?',
    answer:
      'Damos suporte técnico integral para o uso e configuração da plataforma e do módulo fiscal. Para dúvidas específicas sobre alíquotas tributárias do seu estado ou enquadramento de produtos, sempre recomendamos consultar o seu contador de confiança.',
  },
]

interface FaqSectionProps {
  onContactClick: () => void
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onContactClick }) => {
  return (
    <section id="faq" className="py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200/60">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tire Suas Dúvidas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Perguntas e Dúvidas Frequentes
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Tudo o que você precisa saber antes de conectar seus marketplaces e emitir notas
            fiscais.
          </p>
        </div>

        {/* Accordion List */}
        <div className="bg-slate-50/50 rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-10">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="bg-white rounded-xl border border-slate-200/70 px-5 shadow-2xs data-[state=open]:border-emerald-500/40"
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-600 hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 leading-relaxed pb-4 pt-1">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center bg-emerald-50 border border-emerald-200/60 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Ainda tem alguma pergunta específica?
              </h3>
              <p className="text-xs text-slate-600">
                Nossa equipe comercial e técnica está pronta para responder.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={onContactClick}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 h-10 rounded-xl shrink-0"
          >
            Falar com especialista
          </Button>
        </div>
      </div>
    </section>
  )
}
