// Histórico de compras, preços (D3) e "repetir a última compra" (D4) — funções puras, testadas em historico.test.ts.
import type { Compra, Id, ItemCompra, Produto } from './tipos';
import { novoItemCompra } from './compras';

/** Compras finalizadas, da mais recente para a mais antiga. */
export function comprasFinalizadas(compras: Compra[]): Compra[] {
  return compras
    .filter((c) => c.status === 'finalizada')
    .sort((a, b) => (b.data_finalizacao ?? b.criado_em).localeCompare(a.data_finalizacao ?? a.criado_em));
}

export interface PontoPreco {
  data: string; // AAAA-MM-DD
  preco: number;
}

/**
 * D3 — preços pagos por um produto nas compras finalizadas (mais recente primeiro, um por compra).
 * Sem nenhuma compra no app, usa o último preço guardado no produto (ex.: o importado da planilha antiga).
 */
export function historicoPrecos(produto: Produto, compras: Compra[], itens: ItemCompra[]): PontoPreco[] {
  const finalizadas = new Map(comprasFinalizadas(compras).map((c) => [c.id, c]));
  const porCompra = new Map<Id, PontoPreco>();
  for (const i of itens) {
    const c = finalizadas.get(i.compra_id);
    if (!c || i.produto_id !== produto.id || i.status !== 'comprado' || i.preco === null) continue;
    porCompra.set(c.id, { data: (c.data_finalizacao ?? c.criado_em).slice(0, 10), preco: i.preco });
  }
  const pontos = [...porCompra.values()].sort((a, b) => b.data.localeCompare(a.data));
  if (!pontos.length && produto.ultimo_preco !== null && produto.data_ultimo_preco)
    pontos.push({ data: produto.data_ultimo_preco, preco: produto.ultimo_preco });
  return pontos;
}

export interface Variacao {
  diferenca: number;
  percentual: number;
  sentido: 'subiu' | 'caiu' | 'igual';
}

/** D3 — quanto o preço mudou em relação ao anterior (null se não há o que comparar). */
export function variacaoPreco(atual: number | null, anterior: number | null): Variacao | null {
  if (atual === null || anterior === null || anterior <= 0) return null;
  const diferenca = Math.round((atual - anterior) * 100) / 100;
  const percentual = Math.round((diferenca / anterior) * 1000) / 10;
  return { diferenca, percentual, sentido: diferenca > 0 ? 'subiu' : diferenca < 0 ? 'caiu' : 'igual' };
}

/**
 * D4 — itens para repetir uma compra (normalmente a última finalizada): mesmos produtos e quantidades,
 * todos pendentes, com o preço atual de cada produto. Produtos excluídos do catálogo ficam de fora.
 */
export function itensParaRepetir(
  origemId: Id,
  itens: ItemCompra[],
  produtos: Produto[],
  compraDestino: Id,
  novoId: () => Id,
  agora = new Date(),
): ItemCompra[] {
  const porId = new Map(produtos.filter((p) => p.status !== 'excluido').map((p) => [p.id, p]));
  return itens
    .filter((i) => i.compra_id === origemId && i.status !== 'excluido' && porId.has(i.produto_id))
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
    .map((i) => novoItemCompra(novoId(), compraDestino, porId.get(i.produto_id)!, i.quantidade, agora));
}
