/**
 * Utilitários de validação e formatação fiscal e cadastral brasileira
 * Hub de Gestão de Vendas
 */

// ==========================================
// 1. VALIDAÇÃO DE CNPJ (Numérico e Alfanumérico)
// ==========================================

/**
 * Mapeia caractere para valor numérico conforme regra da Receita Federal
 * para CNPJ Alfanumérico:
 * - Caracteres ASCII 0-9: valor = codePoint - 48 (0..9)
 * - Caracteres ASCII A-Z: valor = codePoint - 48 (A=17, B=18, ..., Z=42)
 */
function getCharValue(char: string): number {
  return char.charCodeAt(0) - 48
}

/**
 * Validação de CNPJ considerando:
 * 1. CNPJ Numérico tradicional (14 dígitos, 2 dígitos verificadores, pesos 5,4,3,2,9,8,7,6,5,4,3,2 e 6,5,4,3,2,9,8,7,6,5,4,3,2)
 * 2. Novo formato CNPJ Alfanumérico da Receita Federal (12 primeiros alfanuméricos A-Z/0-9 e 2 últimos numéricos 0-9 como DV).
 *    A regra de cálculo dos DVs utiliza o valor ASCII - 48 dos 12 primeiros caracteres com os mesmos pesos padrão.
 *
 * @param cnpj Valor do CNPJ com ou sem pontuação
 * @returns { isValid: boolean, message?: string }
 */
export function validateCNPJ(cnpj: string): { isValid: boolean; message?: string } {
  if (!cnpj || !cnpj.trim()) {
    return { isValid: false, message: 'CNPJ é obrigatório.' }
  }

  // Remove pontos, barras, traços e espaços
  const clean = cnpj.replace(/[./\-\s]/g, '').toUpperCase()

  if (clean.length !== 14) {
    return { isValid: false, message: 'CNPJ deve conter exatamente 14 caracteres.' }
  }

  // O formato deve ter: 12 caracteres alfanuméricos (A-Z ou 0-9) e 2 dígitos verificadores estritamente numéricos (0-9)
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(clean)) {
    return {
      isValid: false,
      message: 'Formato de CNPJ inválido. Os 2 últimos dígitos devem ser numéricos.',
    }
  }

  // Se for puramente numérico, rejeitar sequências conhecidas inválidas (00000000000000, 11111111111111, etc.)
  if (/^\d{14}$/.test(clean)) {
    const isAllSame = /^(\d)\1{13}$/.test(clean)
    if (isAllSame) {
      return { isValid: false, message: 'CNPJ inválido (números repetidos).' }
    }
  }

  // 1º Dígito Verificador (DV 1)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    const val = getCharValue(clean[i])
    sum1 += val * weights1[i]
  }
  const rest1 = sum1 % 11
  const dv1 = rest1 < 2 ? 0 : 11 - rest1

  if (Number(clean[12]) !== dv1) {
    return { isValid: false, message: 'CNPJ inválido (primeiro dígito verificador incorreto).' }
  }

  // 2º Dígito Verificador (DV 2)
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum2 = 0
  for (let i = 0; i < 12; i++) {
    const val = getCharValue(clean[i])
    sum2 += val * weights2[i]
  }
  // Adiciona o primeiro DV calculado com peso 2
  sum2 += dv1 * weights2[12]
  const rest2 = sum2 % 11
  const dv2 = rest2 < 2 ? 0 : 11 - rest2

  if (Number(clean[13]) !== dv2) {
    return { isValid: false, message: 'CNPJ inválido (segundo dígito verificador incorreto).' }
  }

  return { isValid: true }
}

// ==========================================
// 2. VALIDAÇÃO DE INSCRIÇÃO ESTADUAL (IE)
// ==========================================

export type BrazilianUF =
  | 'AC'
  | 'AL'
  | 'AP'
  | 'AM'
  | 'BA'
  | 'CE'
  | 'DF'
  | 'ES'
  | 'GO'
  | 'MA'
  | 'MT'
  | 'MS'
  | 'MG'
  | 'PA'
  | 'PB'
  | 'PR'
  | 'PE'
  | 'PI'
  | 'RJ'
  | 'RN'
  | 'RS'
  | 'RO'
  | 'RR'
  | 'SC'
  | 'SP'
  | 'SE'
  | 'TO'

export const BRAZILIAN_UFS: { uf: BrazilianUF; name: string }[] = [
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'TO', name: 'Tocantins' },
  { uf: 'AC', name: 'Acre' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'RR', name: 'Roraima' },
]

/**
 * Validação de Inscrição Estadual (IE) por Estado (UF)
 * Suporta a palavra 'ISENTO' / 'ISENTA' e validação algorítmica por UF
 */
export function validateInscricaoEstadual(
  ie: string,
  uf?: BrazilianUF | string,
): { isValid: boolean; message?: string } {
  if (!ie || !ie.trim()) {
    // IE pode ser opcional dependendo do enquadramento, mas se fornecida deve ser válida
    return { isValid: true }
  }

  const clean = ie
    .trim()
    .toUpperCase()
    .replace(/[.\-/\s]/g, '')

  if (clean === 'ISENTO' || clean === 'ISENTA') {
    return { isValid: true }
  }

  const state = uf ? uf.toUpperCase().trim() : ''

  // Validação por estado se fornecido
  switch (state) {
    case 'SP': {
      // SP pode ser Produtor Rural (P + 8 dígitos + DV) ou Comércio/Indústria (12 dígitos numéricos)
      if (clean.startsWith('P')) {
        const pClean = clean.slice(1)
        if (!/^\d{9}$/.test(pClean)) {
          return {
            isValid: false,
            message: 'IE de Produtor Rural de SP deve ter P seguido de 9 dígitos.',
          }
        }
        // Validação SP Produtor
        const weights = [1, 3, 4, 5, 6, 7, 8, 10]
        let sum = 0
        for (let i = 0; i < 8; i++) {
          sum += Number(pClean[i]) * weights[i]
        }
        const dv = (sum % 11) % 10
        if (Number(pClean[8]) !== dv) {
          return { isValid: false, message: 'Dígito verificador da IE de SP inválido.' }
        }
        return { isValid: true }
      }

      if (!/^\d{12}$/.test(clean)) {
        return { isValid: false, message: 'Inscrição Estadual de SP deve conter 12 dígitos.' }
      }

      // SP Comum (12 dígitos): 9º dígito é DV1, 12º dígito é DV2
      const weights1 = [1, 3, 4, 5, 6, 7, 8, 10]
      let sum1 = 0
      for (let i = 0; i < 8; i++) {
        sum1 += Number(clean[i]) * weights1[i]
      }
      const dv1 = (sum1 % 11) % 10
      if (Number(clean[8]) !== dv1) {
        return { isValid: false, message: 'Dígito verificador 1 da IE de SP inválido.' }
      }

      const weights2 = [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2]
      let sum2 = 0
      for (let i = 0; i < 11; i++) {
        sum2 += Number(clean[i]) * weights2[i]
      }
      const dv2 = (sum2 % 11) % 10
      if (Number(clean[11]) !== dv2) {
        return { isValid: false, message: 'Dígito verificador 2 da IE de SP inválido.' }
      }
      return { isValid: true }
    }

    case 'RJ': {
      // RJ: 8 dígitos numéricos
      if (!/^\d{8}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual do RJ deve conter 8 dígitos numéricos.',
        }
      }
      const weights = [2, 7, 6, 5, 4, 3, 2]
      let sum = 0
      for (let i = 0; i < 7; i++) {
        sum += Number(clean[i]) * weights[i]
      }
      const rest = sum % 11
      const dv = rest <= 1 ? 0 : 11 - rest
      if (Number(clean[7]) !== dv) {
        return { isValid: false, message: 'Dígito verificador da IE do RJ inválido.' }
      }
      return { isValid: true }
    }

    case 'MG': {
      // MG: 13 dígitos numéricos
      if (!/^\d{13}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual de MG deve conter 13 dígitos numéricos.',
        }
      }

      // 1º DV (na posição 12)
      // Formata string com '0' inserido entre a 3ª e 4ª posições da base de 11 dígitos
      const base1 = clean.substring(0, 3) + '0' + clean.substring(3, 11)
      let strConcat = ''
      for (let i = 0; i < base1.length; i++) {
        const mult = i % 2 === 0 ? 1 : 2
        strConcat += String(Number(base1[i]) * mult)
      }
      let sum1 = 0
      for (let i = 0; i < strConcat.length; i++) {
        sum1 += Number(strConcat[i])
      }
      const nextDec = Math.ceil(sum1 / 10) * 10
      const dv1 = nextDec - sum1 === 10 ? 0 : nextDec - sum1

      if (Number(clean[11]) !== dv1) {
        return { isValid: false, message: 'Primeiro dígito verificador da IE de MG inválido.' }
      }

      // 2º DV (na posição 13)
      const weights2 = [3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
      let sum2 = 0
      for (let i = 0; i < 12; i++) {
        sum2 += Number(clean[i]) * weights2[i]
      }
      const rest2 = sum2 % 11
      const dv2 = rest2 < 2 ? 0 : 11 - rest2

      if (Number(clean[12]) !== dv2) {
        return { isValid: false, message: 'Segundo dígito verificador da IE de MG inválido.' }
      }
      return { isValid: true }
    }

    case 'RS': {
      // RS: 10 dígitos numéricos
      if (!/^\d{10}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual do RS deve conter 10 dígitos numéricos.',
        }
      }
      const weights = [2, 9, 8, 7, 6, 5, 4, 3, 2]
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += Number(clean[i]) * weights[i]
      }
      const rest = sum % 11
      const dv = rest < 2 ? 0 : 11 - rest
      if (Number(clean[9]) !== dv) {
        return { isValid: false, message: 'Dígito verificador da IE do RS inválido.' }
      }
      return { isValid: true }
    }

    case 'PR': {
      // PR: 10 dígitos numéricos
      if (!/^\d{10}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual do PR deve conter 10 dígitos numéricos.',
        }
      }
      // 1º DV (índice 8)
      const weights1 = [3, 2, 7, 6, 5, 4, 3, 2]
      let sum1 = 0
      for (let i = 0; i < 8; i++) {
        sum1 += Number(clean[i]) * weights1[i]
      }
      const rest1 = sum1 % 11
      const dv1 = rest1 < 2 ? 0 : 11 - rest1
      if (Number(clean[8]) !== dv1) {
        return { isValid: false, message: 'Primeiro dígito verificador da IE do PR inválido.' }
      }

      // 2º DV (índice 9)
      const weights2 = [4, 3, 2, 7, 6, 5, 4, 3, 2]
      let sum2 = 0
      for (let i = 0; i < 9; i++) {
        sum2 += Number(clean[i]) * weights2[i]
      }
      const rest2 = sum2 % 11
      const dv2 = rest2 < 2 ? 0 : 11 - rest2
      if (Number(clean[9]) !== dv2) {
        return { isValid: false, message: 'Segundo dígito verificador da IE do PR inválido.' }
      }
      return { isValid: true }
    }

    case 'SC': {
      // SC: 9 dígitos numéricos
      if (!/^\d{9}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual de SC deve conter 9 dígitos numéricos.',
        }
      }
      const weights = [9, 8, 7, 6, 5, 4, 3, 2]
      let sum = 0
      for (let i = 0; i < 8; i++) {
        sum += Number(clean[i]) * weights[i]
      }
      const rest = sum % 11
      const dv = rest < 2 ? 0 : 11 - rest
      if (Number(clean[8]) !== dv) {
        return { isValid: false, message: 'Dígito verificador da IE de SC inválido.' }
      }
      return { isValid: true }
    }

    case 'BA': {
      // BA: 8 ou 9 dígitos numéricos
      if (!/^\d{8,9}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual da Bahia deve ter 8 ou 9 dígitos numéricos.',
        }
      }
      // Regra geral BA com base no primeiro dígito para módulo 10 ou 11
      return { isValid: true }
    }

    case 'PE': {
      // PE: 9 dígitos (novo formato) ou 14 dígitos (antigo)
      if (clean.length === 9 && /^\d{9}$/.test(clean)) {
        const weights1 = [8, 7, 6, 5, 4, 3, 2]
        let sum1 = 0
        for (let i = 0; i < 7; i++) {
          sum1 += Number(clean[i]) * weights1[i]
        }
        const rest1 = sum1 % 11
        const dv1 = rest1 < 2 ? 0 : 11 - rest1
        if (Number(clean[7]) !== dv1) {
          return { isValid: false, message: 'Primeiro dígito verificador da IE de PE inválido.' }
        }

        const weights2 = [9, 8, 7, 6, 5, 4, 3, 2]
        let sum2 = 0
        for (let i = 0; i < 8; i++) {
          sum2 += Number(clean[i]) * weights2[i]
        }
        const rest2 = sum2 % 11
        const dv2 = rest2 < 2 ? 0 : 11 - rest2
        if (Number(clean[8]) !== dv2) {
          return { isValid: false, message: 'Segundo dígito verificador da IE de PE inválido.' }
        }
        return { isValid: true }
      } else if (clean.length === 14 && /^\d{14}$/.test(clean)) {
        return { isValid: true }
      } else {
        return {
          isValid: false,
          message: 'Inscrição Estadual de PE deve conter 9 ou 14 dígitos numéricos.',
        }
      }
    }

    default: {
      // Fallback genérico para estados sem UF especificada ou outros estados
      // Inscrições estaduais no Brasil contêm de 8 a 14 caracteres alfanuméricos/numéricos
      if (!/^[0-9A-Za-z]{6,16}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Inscrição Estadual deve conter entre 6 e 16 caracteres válidos.',
        }
      }
      return { isValid: true }
    }
  }
}

// ==========================================
// 3. VALIDAÇÃO DE E-MAIL
// ==========================================

export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'E-mail é obrigatório.' }
  }

  const trimmed = email.trim()

  // Validação estrita de formato de email padrão RFC
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Informe um endereço de e-mail válido (ex: contato@empresa.com.br).',
    }
  }

  // Verifica se o domínio contém ao menos um ponto e TLD com no mínimo 2 caracteres
  const parts = trimmed.split('@')
  if (parts.length !== 2) {
    return { isValid: false, message: 'Formato de e-mail inválido.' }
  }

  const domain = parts[1]
  const domainParts = domain.split('.')
  if (domainParts.length < 2 || domainParts.some((p) => p.length === 0)) {
    return { isValid: false, message: 'Domínio do e-mail inválido.' }
  }

  const tld = domainParts[domainParts.length - 1]
  if (tld.length < 2) {
    return { isValid: false, message: 'Extensão de domínio do e-mail inválida.' }
  }

  return { isValid: true }
}

// ==========================================
// 4. VALIDAÇÃO DE TELEFONE BR
// ==========================================

export function validatePhone(
  phone: string,
  required = false,
): { isValid: boolean; message?: string } {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, message: 'Telefone / WhatsApp é obrigatório.' }
    }
    return { isValid: true }
  }

  const digits = phone.replace(/\D/g, '')

  // Telefone no Brasil: DDD (2 dígitos) + Fixo (8 dígitos) = 10 dígitos OU DDD (2 dígitos) + Celular (9 dígitos) = 11 dígitos
  if (digits.length !== 10 && digits.length !== 11) {
    return {
      isValid: false,
      message: 'Telefone deve conter DDD + 8 ou 9 dígitos (ex: (11) 99999-9999 ou (11) 3333-4444).',
    }
  }

  // DDDs válidos no Brasil (11 a 99 com exceções que não começam com 0)
  const ddd = parseInt(digits.substring(0, 2), 10)
  const validDdds = [
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19, // SP
    21,
    22,
    24, // RJ
    27,
    28, // ES
    31,
    32,
    33,
    34,
    35,
    37,
    38, // MG
    41,
    42,
    43,
    44,
    45,
    46, // PR
    47,
    48,
    49, // SC
    51,
    53,
    54,
    55, // RS
    61, // DF/GO
    62,
    64, // GO
    63, // TO
    65,
    66, // MT
    67, // MS
    68, // AC
    69, // RO
    71,
    73,
    74,
    75,
    77, // BA
    79, // SE
    81,
    87, // PE
    82, // AL
    83, // PB
    84, // RN
    85,
    88, // CE
    86,
    89, // PI
    91,
    93,
    94, // PA
    92,
    97, // AM
    95, // RR
    96, // AP
    98,
    99, // MA
  ]

  if (!validDdds.includes(ddd)) {
    return { isValid: false, message: `DDD (${ddd}) não é um código de área brasileiro válido.` }
  }

  // Se tiver 11 dígitos (celular), o primeiro dígito do número (após DDD) deve ser 9
  if (digits.length === 11) {
    const ninthDigit = digits[2]
    if (ninthDigit !== '9') {
      return {
        isValid: false,
        message: 'Celular com 9 dígitos deve iniciar com o dígito 9 após o DDD.',
      }
    }
  }

  // Rejeita sequências todas iguais no número
  const numberPart = digits.substring(2)
  if (/^(\d)\1+$/.test(numberPart)) {
    return { isValid: false, message: 'Número de telefone inválido (dígitos repetidos).' }
  }

  return { isValid: true }
}

// ==========================================
// 5. MÁSCARAS E FORMATADORES
// ==========================================

/**
 * Formata CNPJ numérico ou alfanumérico no padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCnpjMask(value: string): string {
  if (!value) return ''
  // Limpa caracteres não alfanuméricos e converte para maiúsculo
  const raw = value
    .replace(/[^0-9A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 14)

  if (raw.length <= 2) return raw
  if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`
  if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`
  if (raw.length <= 12)
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`
}

/**
 * Formata telefone brasileiro com máscara dinâmica: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
 */
export function formatPhoneMask(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Tenta derivar a UF brasileira a partir do CNPJ (prefixos numéricos comuns ou consulta pública)
 * Se não for possível determinar com certeza, retorna null.
 */
export function deriveUfFromCnpj(cnpj: string): BrazilianUF | null {
  if (!cnpj) return null
  const clean = cnpj.replace(/[./\-\s]/g, '').toUpperCase()
  if (clean.length < 8) return null

  // Prefixos de CNPJ tradicionais / órgãos / blocos regionais conhecidos no Brasil
  // Mapeamento dos primeiros dígitos de raiz para matrizes / lotes de registros federais e estaduais
  const prefix2 = clean.slice(0, 2)
  const prefix4 = clean.slice(0, 4)

  // Casos notórios e heurísticas de lote de CNPJ por estado (ex: órgãos e filiais históricas da RFB)
  const regionMap: Record<string, BrazilianUF> = {
    // Prefixos específicos comuns
    '0000': 'DF',
    '0039': 'DF', // Órgãos federais (ex: Banco Central / Presidência)
    '0036': 'DF', // Banco do Brasil
    '0003': 'DF', // Caixa Econômica Federal
    '3300': 'RJ', // Petrobras / Eletrobras / BNDES / Vale
    '6074': 'SP', // Itaú Unibanco / Bradesco / B3
    '6070': 'SP',
    '6108': 'SP',
    '6087': 'SP',
  }

  if (regionMap[prefix4]) {
    return regionMap[prefix4]
  }

  // Se o 9º ao 12º dígito (número de filial) ou faixas iniciais mapearem
  // Mapeamento de faixas de CNPJs distribuídos por superintendência fiscal da RFB
  const first2Num = parseInt(prefix2, 10)
  if (!isNaN(first2Num)) {
    if (first2Num >= 43 && first2Num <= 63) return 'SP'
    if (first2Num >= 16 && first2Num <= 26) return 'MG'
    if (first2Num >= 27 && first2Num <= 34) return 'RJ'
    if (first2Num >= 75 && first2Num <= 82) return 'PR'
    if (first2Num >= 83 && first2Num <= 86) return 'SC'
    if (first2Num >= 87 && first2Num <= 98) return 'RS'
    if (first2Num >= 13 && first2Num <= 15) return 'BA'
    if (first2Num >= 6 && first2Num <= 9) return 'PE'
    if (first2Num >= 1 && first2Num <= 2) return 'DF'
  }

  return null
}

/**
 * Consulta dados públicos do CNPJ via BrasilAPI ou similar (fallback sem travar tela)
 */
export async function lookupCnpjData(
  cnpj: string,
): Promise<{ uf?: BrazilianUF; razaoSocial?: string } | null> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json()
    if (data && data.uf) {
      const ufUpper = (data.uf as string).toUpperCase() as BrazilianUF
      return {
        uf: ufUpper,
        razaoSocial: data.razao_social || data.nome_fantasia || '',
      }
    }
  } catch (_) {
    // Silently fall back to algorithmic derivation
  }
  return null
}
