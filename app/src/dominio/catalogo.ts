// Regras do catálogo: categorias e produtos (funções puras — testadas em catalogo.test.ts).
import type { Categoria, Id, Produto } from './tipos';

/** Chave para comparar nomes: sem espaços extras, sem acentos, sem diferenciar maiúsculas. */
export function chaveNome(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export const limparNome = (nome: string) => nome.replace(/\s+/g, ' ').trim();

export function novaCategoria(campos: Partial<Categoria> & { id: Id }, agora = new Date()): Categoria {
  const carimbo = agora.toISOString();
  return { nome: '', ordem: 1, status: 'ativo', criado_em: carimbo, atualizado_em: carimbo, ...campos };
}

export function novoProduto(campos: Partial<Produto> & { id: Id }, agora = new Date()): Produto {
  const carimbo = agora.toISOString();
  return {
    nome: '',
    categoria_id: '',
    unidade: 'Un',
    ultimo_preco: null,
    data_ultimo_preco: null,
    status: 'ativo',
    criado_em: carimbo,
    atualizado_em: carimbo,
    ...campos,
  };
}

export const ativos = <T extends { status: string }>(lista: T[]) => lista.filter((x) => x.status !== 'excluido');

/** Categorias ativas na ordem de exibição (empate: por nome). */
export function ordenarCategorias(categorias: Categoria[]): Categoria[] {
  return ativos(categorias).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function proximaOrdem(categorias: Categoria[]): number {
  return ativos(categorias).reduce((max, c) => Math.max(max, c.ordem), 0) + 1;
}

/** R10 — categoria com o mesmo nome (sem diferenciar maiúsculas/acentos). */
export function acharCategoria(categorias: Categoria[], nome: string): Categoria | undefined {
  const chave = chaveNome(nome);
  return ativos(categorias).find((c) => chaveNome(c.nome) === chave);
}

/** Lista de erros do produto (vazia = válido). R10: nome único. */
export function validarProduto(p: Pick<Produto, 'id' | 'nome' | 'categoria_id' | 'unidade'>, produtos: Produto[], nomeCategoriaNova = ''): string[] {
  const erros: string[] = [];
  const nome = limparNome(p.nome);
  if (!nome) erros.push('Informe o nome do produto.');
  else if (ativos(produtos).some((x) => x.id !== p.id && chaveNome(x.nome) === chaveNome(nome)))
    erros.push(`Já existe um produto chamado "${nome}".`);
  if (!p.categoria_id && !limparNome(nomeCategoriaNova)) erros.push('Escolha a categoria.');
  if (!p.unidade) erros.push('Escolha a unidade.');
  return erros;
}

export function validarCategoria(c: Pick<Categoria, 'id' | 'nome'>, categorias: Categoria[]): string[] {
  const nome = limparNome(c.nome);
  if (!nome) return ['Informe o nome da categoria.'];
  const igual = acharCategoria(categorias, nome);
  return igual && igual.id !== c.id ? [`Já existe a categoria "${igual.nome}".`] : [];
}

export interface GrupoCatalogo {
  categoria: Categoria;
  produtos: Produto[];
}

/**
 * R12 — produtos ativos agrupados por categoria (na ordem das categorias), por nome dentro do grupo.
 * Com busca, mostra só os produtos cujo nome contém o texto (sem acentos). Grupos vazios não aparecem.
 */
export function agruparCatalogo(produtos: Produto[], categorias: Categoria[], busca = ''): GrupoCatalogo[] {
  const termo = chaveNome(busca);
  const visiveis = ativos(produtos).filter((p) => !termo || chaveNome(p.nome).includes(termo));
  const ordenadas = ordenarCategorias(categorias);
  const conhecidas = new Set(ordenadas.map((c) => c.id));
  const semCategoria = novaCategoria({ id: '', nome: 'Sem categoria', ordem: Infinity });

  return [...ordenadas, semCategoria]
    .map((categoria) => ({
      categoria,
      produtos: visiveis
        .filter((p) => (categoria.id ? p.categoria_id === categoria.id : !conhecidas.has(p.categoria_id)))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    }))
    .filter((g) => g.produtos.length > 0);
}

/** Troca a ordem de uma categoria com a vizinha (sobe = -1, desce = +1). Devolve as categorias alteradas. */
export function moverCategoria(categorias: Categoria[], id: Id, direcao: -1 | 1): Categoria[] {
  const lista = ordenarCategorias(categorias).map((c, i) => ({ ...c, ordem: i + 1 }));
  const i = lista.findIndex((c) => c.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= lista.length) return [];
  [lista[i], lista[j]] = [lista[j], lista[i]];
  const antes = new Map(categorias.map((c) => [c.id, c.ordem]));
  return lista.map((c, k) => ({ ...c, ordem: k + 1 })).filter((c) => antes.get(c.id) !== c.ordem);
}
