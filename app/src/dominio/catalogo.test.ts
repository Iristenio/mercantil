import { describe, expect, it } from 'vitest';
import { agruparCatalogo, chaveNome, moverCategoria, novaCategoria, novoProduto, validarCategoria, validarProduto } from './catalogo';
import { lerValor, formatarReais } from './dinheiro';

const cat = (id: string, nome: string, ordem: number) => novaCategoria({ id, nome, ordem });
const prod = (id: string, nome: string, categoria_id: string, extra = {}) => novoProduto({ id, nome, categoria_id, ...extra });

const categorias = [cat('lim', 'Limpeza', 2), cat('mer', 'Mercearia', 1), cat('lat', 'Laticínios', 3)];
const produtos = [
  prod('p1', 'Feijão', 'mer'),
  prod('p2', 'Arroz', 'mer'),
  prod('p3', 'Detergente', 'lim'),
  prod('p4', 'Apagado', 'mer', { status: 'excluido' }),
  prod('p5', 'Órfão', 'xxx'),
];

describe('catálogo', () => {
  it('compara nomes sem acentos, maiúsculas e espaços extras', () => {
    expect(chaveNome('  Feijão   Preto ')).toBe(chaveNome('feijao preto'));
  });

  it('R10 — nome de produto único', () => {
    expect(validarProduto({ id: 'n', nome: ' FEIJAO ', categoria_id: 'mer', unidade: 'Kg' }, produtos)).toHaveLength(1);
    expect(validarProduto({ id: 'p1', nome: 'Feijão', categoria_id: 'mer', unidade: 'Kg' }, produtos)).toHaveLength(0);
    expect(validarProduto({ id: 'n', nome: 'Apagado', categoria_id: 'mer', unidade: 'Kg' }, produtos)).toHaveLength(0);
    expect(validarProduto({ id: 'n', nome: '', categoria_id: '', unidade: 'Kg' }, produtos)).toHaveLength(2);
    expect(validarProduto({ id: 'n', nome: 'Pão', categoria_id: '', unidade: 'Un' }, produtos, 'Padaria')).toHaveLength(0);
  });

  it('R10 — nome de categoria único', () => {
    expect(validarCategoria({ id: 'n', nome: 'limpeza' }, categorias)).toHaveLength(1);
    expect(validarCategoria({ id: 'lim', nome: 'Limpeza' }, categorias)).toHaveLength(0);
  });

  it('R12 — agrupa por ordem da categoria e por nome; sem categoria no fim; excluídos fora', () => {
    const grupos = agruparCatalogo(produtos, categorias);
    expect(grupos.map((g) => g.categoria.nome)).toEqual(['Mercearia', 'Limpeza', 'Sem categoria']);
    expect(grupos[0].produtos.map((p) => p.nome)).toEqual(['Arroz', 'Feijão']);
  });

  it('busca ignora acentos', () => {
    const grupos = agruparCatalogo(produtos, categorias, 'feijao');
    expect(grupos.flatMap((g) => g.produtos.map((p) => p.id))).toEqual(['p1']);
  });

  it('move categoria e devolve só as alteradas', () => {
    const alteradas = moverCategoria(categorias, 'lim', -1);
    expect(alteradas.map((c) => [c.id, c.ordem])).toEqual([['lim', 1], ['mer', 2]]);
    expect(moverCategoria(categorias, 'mer', -1)).toEqual([]);
  });
});

describe('dinheiro', () => {
  it('lê valores digitados', () => {
    expect(lerValor('4,59')).toBe(4.59);
    expect(lerValor('R$ 1.234,50')).toBe(1234.5);
    expect(lerValor('4.59')).toBe(4.59);
    expect(lerValor('')).toBeNull();
    expect(lerValor('abc')).toBeNull();
  });
  it('formata em reais', () => {
    expect(formatarReais(1234.5)).toBe('R$ 1.234,50');
  });
});
