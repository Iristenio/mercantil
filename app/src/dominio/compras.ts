// Regras da lista de compras (funções puras — testadas em compras.test.ts).
import type { Categoria, Compra, Id, ItemCompra, Produto } from './tipos';
import { ordenarCategorias } from './catalogo';

export function novaCompra(campos: Partial<Compra> & { id: Id }, agora = new Date()): Compra {
  const carimbo = agora.toISOString();
  return {
    status: 'planejada',
    data_inicio: null,
    data_finalizacao: null,
    valor_previsto: 0,
    valor_real: 0,
    criado_em: carimbo,
    atualizado_em: carimbo,
    ...campos,
  };
}

/** R3 — o item já nasce com o último preço conhecido do produto. */
export function novoItemCompra(id: Id, compra_id: Id, produto: Produto, quantidade = 1, agora = new Date()): ItemCompra {
  const carimbo = agora.toISOString();
  return {
    id,
    compra_id,
    produto_id: produto.id,
    quantidade,
    preco: produto.ultimo_preco,
    status: 'pendente',
    criado_em: carimbo,
    atualizado_em: carimbo,
  };
}

export const estaAtiva = (c: Compra) => c.status === 'planejada' || c.status === 'em_andamento';

/** R1 — a compra ativa (se, por sincronização, houver mais de uma, vale a mais recente). */
export function compraAtiva(compras: Compra[]): Compra | undefined {
  return compras.filter(estaAtiva).sort((a, b) => b.criado_em.localeCompare(a.criado_em))[0];
}

/** Itens (não excluídos) de uma compra. */
export function itensDaCompra(itens: ItemCompra[], compraId: Id | undefined): ItemCompra[] {
  if (!compraId) return [];
  return itens.filter((i) => i.compra_id === compraId && i.status !== 'excluido');
}

const arred = (n: number) => Math.round(n * 100) / 100;
export const subtotal = (i: ItemCompra) => arred(i.quantidade * (i.preco ?? 0));

/** R4 — soma de quantidade × preço de todos os itens (sem preço contam 0; indisponíveis também contam). */
export function valorPrevisto(itens: ItemCompra[]): number {
  return arred(itens.filter((i) => i.status !== 'excluido').reduce((s, i) => s + subtotal(i), 0));
}

/** R5 — soma só dos itens comprados. */
export function valorReal(itens: ItemCompra[]): number {
  return arred(itens.filter((i) => i.status === 'comprado').reduce((s, i) => s + subtotal(i), 0));
}

/** Quantos itens sem preço (o previsto fica incompleto). */
export const semPreco = (itens: ItemCompra[]) => itens.filter((i) => i.preco === null).length;

/** D2 — quantas linhas de cada produto já estão na lista (selo no catálogo). */
export function contagemNaLista(itens: ItemCompra[]): Map<Id, number> {
  const mapa = new Map<Id, number>();
  for (const i of itens) if (i.status !== 'excluido') mapa.set(i.produto_id, (mapa.get(i.produto_id) ?? 0) + 1);
  return mapa;
}

/** Passo dos botões − / + : meio quilo/litro para produtos a granel, 1 para o resto. */
export function passoQuantidade(unidade: string): number {
  return unidade === 'Kg' || unidade === 'L' ? 0.5 : 1;
}

/** Nova quantidade ao tocar em − / + (nunca abaixo de um passo; arredonda para o passo). */
export function ajustarQuantidade(atual: number, direcao: -1 | 1, unidade: string): number {
  const passo = passoQuantidade(unidade);
  const base = direcao > 0 ? Math.floor(atual / passo + 1e-9) * passo : Math.ceil(atual / passo - 1e-9) * passo;
  return Math.max(passo, Math.round((base + direcao * passo) * 1000) / 1000);
}

export interface LinhaLista {
  item: ItemCompra;
  produto: Produto | undefined;
}

export interface GrupoLista {
  categoria: Categoria;
  linhas: LinhaLista[];
}

/** R12 — itens por categoria (na ordem dos corredores) e por nome do produto. */
export function agruparLista(itens: ItemCompra[], produtos: Produto[], categorias: Categoria[]): GrupoLista[] {
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const ordenadas = ordenarCategorias(categorias);
  const conhecidas = new Set(ordenadas.map((c) => c.id));
  const outros: Categoria = { id: '', nome: 'Outros', ordem: Infinity, status: 'ativo', criado_em: '', atualizado_em: '' };
  const linhas = itens.filter((i) => i.status !== 'excluido').map((item) => ({ item, produto: porId.get(item.produto_id) }));
  const nome = (l: LinhaLista) => l.produto?.nome ?? '';

  return [...ordenadas, outros]
    .map((categoria) => ({
      categoria,
      linhas: linhas
        .filter((l) => (categoria.id ? l.produto?.categoria_id === categoria.id : !conhecidas.has(l.produto?.categoria_id ?? '')))
        .sort((a, b) => nome(a).localeCompare(nome(b), 'pt-BR') || a.item.criado_em.localeCompare(b.item.criado_em)),
    }))
    .filter((g) => g.linhas.length > 0);
}

/** Lista de erros do item (vazia = válido). */
export function validarItemCompra(i: Pick<ItemCompra, 'quantidade' | 'preco'>): string[] {
  const erros: string[] = [];
  if (!(i.quantidade > 0)) erros.push('A quantidade precisa ser maior que zero.');
  if (i.preco !== null && i.preco < 0) erros.push('Preço inválido.');
  return erros;
}

/* ---------------- No mercado ---------------- */

/** "Ir às compras": a lista passa a em andamento e o previsto fica congelado (R4). */
export function iniciarCompra(compra: Compra, itens: ItemCompra[], agora = new Date()): Compra {
  return { ...compra, status: 'em_andamento', data_inicio: agora.toISOString(), valor_previsto: valorPrevisto(itens) };
}

/** Previsto exibido: calculado na hora durante a montagem; congelado depois de ir às compras. */
export function previstoDaCompra(compra: Compra, itens: ItemCompra[]): number {
  return compra.status === 'planejada' ? valorPrevisto(itens) : compra.valor_previsto;
}

/** Itens que ainda não foram resolvidos (nem comprados, nem indisponíveis). */
export const pendentes = (itens: ItemCompra[]) => itens.filter((i) => i.status === 'pendente');

/** Marca/desmarca comprado (indisponível vira comprado se tocado). */
export function alternarComprado(item: ItemCompra): ItemCompra {
  return { ...item, status: item.status === 'comprado' ? 'pendente' : 'comprado' };
}

/** R7 — alterna "não encontrei" (fica tachado, não entra no total). */
export function alternarIndisponivel(item: ItemCompra): ItemCompra {
  return { ...item, status: item.status === 'indisponivel' ? 'pendente' : 'indisponivel' };
}

/**
 * R9 — encerrar: a compra vira finalizada com o valor real, e cada produto comprado com preço
 * ganha esse preço como "último preço". Devolve só os produtos que mudaram.
 */
export function encerrarCompra(compra: Compra, itens: ItemCompra[], produtos: Produto[], agora = new Date()): { compra: Compra; produtos: Produto[] } {
  const hoje = agora.toISOString().slice(0, 10);
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const novos = new Map<Id, Produto>();
  const comprados = itens
    .filter((i) => i.status === 'comprado' && i.preco !== null)
    .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em)); // o último marcado vence
  for (const i of comprados) {
    const p = porId.get(i.produto_id);
    if (p) novos.set(p.id, { ...p, ultimo_preco: i.preco, data_ultimo_preco: hoje });
  }
  const mudaram = [...novos.values()].filter((p) => {
    const antes = porId.get(p.id)!;
    return antes.ultimo_preco !== p.ultimo_preco || antes.data_ultimo_preco !== p.data_ultimo_preco;
  });
  return {
    compra: { ...compra, status: 'finalizada', data_finalizacao: agora.toISOString(), valor_real: valorReal(itens) },
    produtos: mudaram,
  };
}

const ORDEM_STATUS: Record<string, number> = { pendente: 0, comprado: 1, indisponivel: 2 };

/** No mercado: dentro de cada categoria, o que falta pegar vem primeiro. Com busca, filtra pelo nome. */
export function organizarNoMercado(grupos: GrupoLista[], busca: string, chave: (t: string) => string): GrupoLista[] {
  const termo = chave(busca);
  return grupos
    .map((g) => ({
      ...g,
      linhas: g.linhas
        .filter((l) => !termo || chave(l.produto?.nome ?? '').includes(termo))
        .sort((a, b) => ORDEM_STATUS[a.item.status] - ORDEM_STATUS[b.item.status]),
    }))
    .filter((g) => g.linhas.length > 0);
}
