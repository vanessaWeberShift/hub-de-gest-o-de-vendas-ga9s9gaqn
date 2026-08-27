import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  KeyRound,
  Download,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Upload,
  Search,
  ExternalLink,
  RefreshCw,
  FileCheck,
  Building2,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  invoicesService,
  certificatesService,
  ordersService,
  settingsService,
} from '@/services/api'
import { formatCurrency, formatDate, NFE_STATUS_MAP } from '@/lib/formatters'
import { InvoiceRecord, CertificateRecord, OrderRecord, NfeSettingsRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export const Nfe: React.FC = () => {
  const { tenant } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [nfeSettings, setNfeSettings] = useState<NfeSettingsRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [uploadCertModalOpen, setUploadCertModalOpen] = useState(false)
  const [emitModalOpen, setEmitModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)
  const [cancelJustification, setCancelJustification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Certificate Form
  const [certLabel, setCertLabel] = useState('')
  const [certPassword, setCertPassword] = useState('')
  const [certValidFrom, setCertValidFrom] = useState('')
  const [certValidUntil, setCertValidUntil] = useState('')
  const [certFile, setCertFile] = useState<File | null>(null)

  // Emit Form Order selection
  const [selectedOrderId, setSelectedOrderId] = useState('')

  useRealtime('invoices', () => loadData())
  useRealtime('certificates', () => loadData())
  useRealtime('orders', () => loadData())

  const loadData = async () => {
    if (!tenant?.id) return
    try {
      const [invsRes, certsRes, ordsRes, settRes] = await Promise.all([
        invoicesService.list(tenant.id),
        certificatesService.list(tenant.id),
        ordersService.list(tenant.id, '', '-created', 1, 100),
        settingsService.getNfeSettings(tenant.id),
      ])

      setInvoices(invsRes)
      setCertificates(certsRes)
      setOrders(ordsRes.items)
      setNfeSettings(settRes)
    } catch (err) {
      console.error('Erro ao carregar dados de NF-e', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tenant?.id])

  const activeCert = certificates[0] || null

  // Invoice KPI Summary
  const invoiceMetrics = useMemo(() => {
    const issued = invoices.filter(
      (i) => i.status === 'issued' || i.status === 'homologation',
    ).length
    const pending = invoices.filter((i) => i.status === 'pending').length
    const canceled = invoices.filter((i) => i.status === 'canceled').length
    const totalIssuedValue = invoices
      .filter((i) => i.status === 'issued' || i.status === 'homologation')
      .reduce((acc, i) => acc + (i.amount || 0), 0)

    return { issued, pending, canceled, totalIssuedValue }
  }, [invoices])

  // Cert status chip
  const getCertStatusChip = (cert: CertificateRecord | null) => {
    if (!cert) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          Não importado
        </span>
      )
    }

    if (cert.status === 'valid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Certificado A1 Válido
        </span>
      )
    }

    if (cert.status === 'expiring') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          Expira em breve
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="h-3.5 w-3.5" />
        Certificado Vencido
      </span>
    )
  }

  // Upload Certificate
  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('tenant', tenant.id)
      formData.append('label', certLabel || 'Certificado Digital A1 e-CNPJ')
      formData.append('password', certPassword)
      if (certValidFrom) formData.append('valid_from', new Date(certValidFrom).toISOString())
      if (certValidUntil) formData.append('valid_until', new Date(certValidUntil).toISOString())

      const isExpired = certValidUntil && new Date(certValidUntil) < new Date()
      formData.append('status', isExpired ? 'expired' : 'valid')

      if (certFile) {
        formData.append('file', certFile)
      }

      await certificatesService.create(formData)
      toast({
        title: 'Certificado Digital A1 importado!',
        description: 'Chave e assinatura digital configuradas para emissão junto à SEFAZ.',
      })

      setUploadCertModalOpen(false)
      setCertLabel('')
      setCertPassword('')
      setCertValidFrom('')
      setCertValidUntil('')
      setCertFile(null)
      await loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao importar certificado',
        description: err?.message || 'Falha na validação do arquivo .pfx ou senha.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit emission from modal
  const handleEmitFromModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderId) {
      toast({ variant: 'destructive', title: 'Selecione um pedido para emitir a NF-e.' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await invoicesService.issueNfe(selectedOrderId)
      toast({
        title: 'Nota Fiscal Emitida!',
        description: res.message || `NF-e autorizada com sucesso na SEFAZ.`,
      })
      setEmitModalOpen(false)
      setSelectedOrderId('')
      await loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha na emissão',
        description: err?.message || 'Erro ao comunicar com a SEFAZ.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel NF-e
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return

    if (cancelJustification.length < 15) {
      toast({
        variant: 'destructive',
        title: 'Justificativa muito curta',
        description:
          'A justificativa deve conter no mínimo 15 caracteres conforme exigido pela SEFAZ.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await invoicesService.cancelNfe(selectedInvoice.id, cancelJustification)
      toast({
        title: 'NF-e Cancelada!',
        description: res.message || 'O cancelamento foi homologado com sucesso na SEFAZ.',
      })
      setCancelModalOpen(false)
      setSelectedInvoice(null)
      setCancelJustification('')
      await loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no cancelamento',
        description: err?.message || 'Não foi possível cancelar o documento fiscal.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock download of XML / DANFE
  const handleDownloadXml = (inv: InvoiceRecord) => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${inv.key || '352500000000000000'}" versao="4.00">
      <ide>
        <nNF>${inv.number || '101'}</nNF>
        <serie>${inv.series || '1'}</serie>
        <dhEmi>${inv.issued_at || new Date().toISOString()}</dhEmi>
        <tpAmb>${inv.environment === 'producao' ? '1' : '2'}</tpAmb>
      </ide>
      <emit>
        <CNPJ>${tenant?.cnpj?.replace(/\D/g, '') || '12345678000190'}</CNPJ>
        <xNome>${tenant?.name || 'WShift'}</xNome>
      </emit>
      <total>
        <ICMSTot>
          <vNF>${inv.amount?.toFixed(2) || '0.00'}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${inv.environment === 'producao' ? '1' : '2'}</tpAmb>
      <chNFe>${inv.key || '352500000000000000'}</chNFe>
      <nProt>${inv.protocol || '13525000000000'}</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `NFe_${inv.number || inv.id}.xml`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadDanfe = (inv: InvoiceRecord) => {
    // Generate simple printable HTML window as DANFE
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: 'Permita popups no navegador para visualizar o DANFE.',
      })
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>DANFE - NF-e ${inv.number}</title>
          <style>
            body { font-family: monospace; padding: 24px; color: #111; max-width: 800px; margin: 0 auto; }
            .header { border: 2px solid #000; padding: 12px; margin-bottom: 12px; }
            .box { border: 1px solid #000; padding: 8px; margin-bottom: 8px; }
            .title { font-size: 16px; font-weight: bold; text-align: center; }
            .mono { font-size: 11px; word-break: break-all; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DANFE - DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
            <div style="text-align: center; font-size: 12px; margin-top: 4px;">Ambiente de ${inv.environment === 'producao' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'} - SEFAZ</div>
          </div>
          <div class="box">
            <div class="row"><b>EMISSOR:</b> ${tenant?.name || 'Empresa'}</div>
            <div class="row"><b>CNPJ:</b> ${tenant?.cnpj || '–'} &nbsp;&nbsp; <b>IE:</b> ${tenant?.ie || '–'}</div>
            <div class="row"><b>ENDEREÇO:</b> ${tenant?.address || '–'}</div>
          </div>
          <div class="box">
            <div class="row"><b>NÚMERO:</b> ${inv.number} &nbsp;&nbsp; <b>SÉRIE:</b> ${inv.series || '1'}</div>
            <div class="row"><b>CHAVE DE ACESSO:</b></div>
            <div class="mono"><b>${inv.key || '–'}</b></div>
            <div class="row" style="margin-top: 6px;"><b>PROTOCOLO DE AUTORIZAÇÃO:</b> ${inv.protocol || '–'}</div>
            <div class="row"><b>DATA DE EMISSÃO:</b> ${formatDate(inv.issued_at, true)}</div>
            <div class="row"><b>VALOR TOTAL DA NOTA:</b> ${formatCurrency(inv.amount)}</div>
          </div>
          <p style="text-align: center; font-size: 10px; color: #666; margin-top: 24px;">Documento fiscal gerado via Hub de Gestão de Vendas WShift.</p>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const eligibleOrdersForNfe = orders.filter(
    (o) => o.status === 'paid' && o.nfe_status !== 'issued',
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Emissor de NF-e Nacional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão fiscal completa, transmissão de notas de produtos para SEFAZ e Certificado
            Digital A1
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadCertModalOpen(true)}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
            <span>Certificado Digital A1</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setEmitModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Emissão NF-e</span>
          </Button>
        </div>
      </div>

      {/* Top Banner & KPI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Certificate Status Card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-[#E7EAEF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Certificado Digital
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            {getCertStatusChip(activeCert)}
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p className="font-semibold text-slate-900 truncate">
                {activeCert?.label || 'Nenhum certificado A1'}
              </p>
              <p className="text-[11px] text-slate-400">
                Validade: {activeCert?.valid_until ? formatDate(activeCert.valid_until) : '–'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setUploadCertModalOpen(true)}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              {activeCert ? 'Renovar / Substituir' : 'Fazer Upload .pfx'}
            </button>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              Tipo A1 (.pfx)
            </span>
          </div>
        </div>

        {/* KPI 1: Emitidas */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7EAEF] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Notas Emitidas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{invoiceMetrics.issued}</div>
          <div className="mt-2 text-xs text-slate-500">
            Total faturado:{' '}
            <b className="font-mono text-emerald-700">
              {formatCurrency(invoiceMetrics.totalIssuedValue)}
            </b>
          </div>
        </div>

        {/* KPI 2: Pendentes */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7EAEF] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Aguardando SEFAZ</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {invoiceMetrics.pending}
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">Em fila de autorização</div>
        </div>

        {/* KPI 3: Ambiente Fiscal */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7EAEF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ambiente Fiscal
              </span>
              <Building2 className="h-4 w-4 text-sky-600" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                  nfeSettings?.environment === 'producao'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {nfeSettings?.environment === 'producao'
                  ? 'Produção Nacional'
                  : 'Homologação (Testes)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Provedor:{' '}
              <span className="font-semibold text-slate-700">
                {nfeSettings?.provider || 'Nuvem Fiscal'}
              </span>{' '}
              • Série: {nfeSettings?.series || '1'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/settings')}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              Configurar Provedor & Chaves →
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Histórico de Notas Fiscais Emitidas
            </h2>
            <p className="text-xs text-slate-500">
              Documentos fiscais eletrônicos protocolados e transmitidos
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Número / Série</th>
                <th className="py-3.5 px-4">Chave de Acesso</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Ambiente</th>
                <th className="py-3.5 px-4">Status SEFAZ</th>
                <th className="py-3.5 px-4">Data Emissão</th>
                <th className="py-3.5 px-4 text-right">Downloads & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {invoices.length > 0 ? (
                invoices.map((inv) => {
                  const statusMeta = NFE_STATUS_MAP[inv.status] || NFE_STATUS_MAP.issued
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          Nº {inv.number || '000000'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Série {inv.series || '1'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {inv.key
                            ? `${inv.key.slice(0, 12)}...${inv.key.slice(-8)}`
                            : 'Chave em geração'}
                        </span>
                        {inv.protocol && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Prot: {inv.protocol}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {inv.environment}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(inv.issued_at || inv.created, true)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadXml(inv)}
                            className="h-7 text-[11px] font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 px-2 flex items-center gap-1"
                          >
                            <Download className="h-3 w-3 text-emerald-600" />
                            <span>XML</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDanfe(inv)}
                            className="h-7 text-[11px] font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 px-2 flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3 text-sky-600" />
                            <span>DANFE (PDF)</span>
                          </Button>
                          {inv.status !== 'canceled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(inv)
                                setCancelModalOpen(true)
                              }}
                              className="h-7 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 px-2"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Nenhuma nota fiscal emitida até o momento. Clique em "Nova Emissão NF-e" para
                    faturar um pedido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload Certificado Digital A1 */}
      {uploadCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Importar Certificado A1 (.pfx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Necessário para assinatura digital junto à SEFAZ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadCertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Identificação / Rótulo
                </label>
                <input
                  type="text"
                  required
                  value={certLabel}
                  onChange={(e) => setCertLabel(e.target.value)}
                  placeholder="Ex: Certificado e-CNPJ 2025"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Arquivo do Certificado (.pfx / .p12) *
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Senha do Certificado *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                    placeholder="Senha definida na emissão do certificado"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Válido A Partir De
                  </label>
                  <input
                    type="date"
                    value={certValidFrom}
                    onChange={(e) => setCertValidFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Válido Até (Vencimento) *
                  </label>
                  <input
                    type="date"
                    required
                    value={certValidUntil}
                    onChange={(e) => setCertValidUntil(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                🔒 O arquivo e a chave privada são criptografados e armazenados com segurança no
                tenant do vendedor.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadCertModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Certificado'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Emissão NF-e */}
      {emitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Transmitir NF-e para a SEFAZ</h3>
              <button
                onClick={() => setEmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEmitFromModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Selecione o Pedido Aprovado *
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="">Selecione um pedido pendente de NF-e...</option>
                  {eligibleOrdersForNfe.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.marketplace_order_id || `#${ord.id.slice(0, 8)}`} • {ord.customer_name} •{' '}
                      {formatCurrency(ord.total)} ({ord.marketplace})
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary of Emission */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Empresa Emissora:</span>
                  <span className="font-semibold text-slate-900">{tenant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>CNPJ Emissor:</span>
                  <span className="font-mono text-slate-800">
                    {tenant?.cnpj || '12.345.678/0001-90'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ambiente de Transmissão:</span>
                  <span className="font-bold text-sky-700 uppercase">
                    {nfeSettings?.environment || 'Homologação'} (Série {nfeSettings?.series || '1'})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                ⚠️ Esta nota fiscal será transmitida ao provedor configurado (
                {nfeSettings?.provider || 'Nuvem Fiscal'}) e assinada digitalmente com o Certificado
                A1 do tenant.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEmitModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !selectedOrderId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Transmitindo SEFAZ...' : 'Emitir e Transmitir'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cancelamento NF-e */}
      {cancelModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700">Cancelar / Estornar NF-e</h3>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Você está prestes a registrar o cancelamento da{' '}
                <b>NF-e Nº {selectedInvoice.number}</b> junto à SEFAZ.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Justificativa de Cancelamento (Mín. 15 caracteres) *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={15}
                  value={cancelJustification}
                  onChange={(e) => setCancelJustification(e.target.value)}
                  placeholder="Ex: Cancelamento de pedido solicitado pelo cliente antes da saída do produto..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(false)}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || cancelJustification.length < 15}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
