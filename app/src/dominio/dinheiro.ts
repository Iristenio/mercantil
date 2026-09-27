// Valores em reais e quantidades no padrão brasileiro (vírgula decimal).

const fmtReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNumero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

/** 1234.5 → "R$ 1.234,50" */
export function formatarReais(valor: number): string {
  return fmtReais.format(valor).replace(/ /g, ' ');
}

/** 0.5 → "0,5" */
export function formatarNumero(valor: number): string {
  return fmtNumero.format(valor);
}

/** Texto digitado ("1.234,50", "4,59", "4.59", "R$ 3") → número; vazio ou inválido → null. */
export function lerValor(texto: string): number | null {
  let t = texto.replace(/[R$\s]/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1000) / 1000 : null;
}
