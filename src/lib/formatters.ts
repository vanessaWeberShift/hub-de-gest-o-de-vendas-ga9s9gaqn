export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(dateString?: string | null, includeTime = false): string {
  if (!dateString) return '–'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '–'

    if (includeTime) {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch (_) {
    return '–'
  }
}

export function formatCNPJ(cnpj?: string): string {
  if (!cnpj) return ''
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatCPF(cpf?: string): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

export function formatDoc(doc?: string): string {
  if (!doc) return '–'
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 11) return formatCPF(digits)
  if (digits.length === 14) return formatCNPJ(digits)
  return doc
}

export const MARKETPLACE_LABELS: Record<string, { name: string; color: string; badgeBg: string }> =
  {
    mercadolivre: {
      name: 'Mercado Livre',
      color: '#FFE600',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    shopee: {
      name: 'Shopee',
      color: '#EE4D2D',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    amazon: {
      name: 'Amazon',
      color: '#FF9900',
      badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    },
    magalu: {
      name: 'Magalu',
      color: '#0086FF',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    netshoes: {
      name: 'Netshoes',
      color: '#5A1B8C',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    shein: {
      name: 'Shein',
      color: '#000000',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    manual: {
      name: 'Venda Direta / Balcão',
      color: '#10B981',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    outros: {
      name: 'Outros Canais',
      color: '#64748B',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    },
  }

export const ORDER_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  new: { label: 'Novo', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  paid: {
    label: 'Pago',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  preparing: {
    label: 'Em Separação',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  shipped: { label: 'Enviado', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' },
  delivered: {
    label: 'Entregue',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  canceled: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
  },
  refunded: {
    label: 'Reembolsado',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
}

export const NFE_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  none: {
    label: 'Sem Nota',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  pending: {
    label: 'Em Processamento',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
  issued: {
    label: 'Emitida / Autorizada',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  homologation: {
    label: 'Homologação',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-300',
  },
  canceled: {
    label: 'Cancelada',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
  },
  error: {
    label: 'Rejeição / Erro',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
  },
}
