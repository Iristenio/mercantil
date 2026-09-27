import { describe, expect, it } from 'vitest';
import { ajustarQuantidade, agruparLista, compraAtiva, contagemNaLista, novaCompra, novoItemCompra, valorPrevisto, valorReal } from './compras';
import { novaCategoria, novoProduto } from './catalogo';
import type { ItemCompra } from './tipos';

const arroz = novoProduto({ id: 'arroz', nome: 'Arroz', categoria_id: 'mer', unidade: 'Kg', ultimo_preco: 4.59 });
const feijao = novoProduto({ id: 'feijao', nome: 'Feijão', categoria_id: 'mer', unidade: 'Kg' });
const sabao = novoProduto({ id: 'sabao', nome: 'Sabão', categoria_id: 'lim', unidade: 'Un', ultimo_preco: 2.7 });
const categorias = [novaCategoria({ id: 'lim', nome: 'Limpeza', ordem: 1 }), novaCategoria({ id: 'mer', nome: 'Mercearia', ordem: 2 })];

const item = (id: string, produto = arroz, extra: Partial<ItemCompra> = {}) => ({ ...novoItemCompra(id, 'c1', produto, 2), ...extra });

describe('lista de compras', () => {
  it('R1 — compra ativa é a planejada/em andamento mais recente', () => {
    const velha = novaCompra({ id: 'a', status: 'finalizada' }, new Date('2026-09-01'));
    const planejada = novaCompra({ id: 'b' }, new Date('2026-09-02'));
    const outra = novaCompra({ id: 'c', status: 'em_andamento' }, new Date('2026-09-03'));
    expect(compraAtiva([velha, planejada, outra])?.id).toBe('c');
    expect(compraAtiva([velha])).toBeUndefined();
  });

  it('R3 — item nasce com o último preço do produto', () => {
    expect(novoItemCompra('i', 'c1', arroz).preco).toBe(4.59);
    expect(novoItemCompra('i', 'c1', feijao).preco).toBeNull();
  });

  it('R4/R5 — previsto soma tudo (menos excluídos); real só os comprados', () => {
    const itens = [
      item('1'), // 2 × 4,59
      item('2', sabao, { quantidade: 3, status: 'comprado' }), // 3 × 2,70
      item('3', feijao), // sem preço
      item('4', arroz, { status: 'excluido' }),
    ];
    expect(valorPrevisto(itens)).toBe(17.28);
    expect(valorReal(itens)).toBe(8.1);
  });

  it('D2 — conta quantas linhas de cada produto', () => {
    const mapa = contagemNaLista([item('1'), item('2'), item('3', sabao), item('4', sabao, { status: 'excluido' })]);
    expect(mapa.get('arroz')).toBe(2);
    expect(mapa.get('sabao')).toBe(1);
  });

  it('− / + usa meio quilo para Kg e 1 para unidades, sem passar do mínimo', () => {
    expect(ajustarQuantidade(1, 1, 'Kg')).toBe(1.5);
    expect(ajustarQuantidade(0.5, -1, 'Kg')).toBe(0.5);
    expect(ajustarQuantidade(0.1, 1, 'Kg')).toBe(0.5);
    expect(ajustarQuantidade(1.3, -1, 'Kg')).toBe(1);
    expect(ajustarQuantidade(2, -1, 'Un')).toBe(1);
    expect(ajustarQuantidade(1, -1, 'Un')).toBe(1);
  });

  it('R12 — agrupa pela ordem das categorias e pelo nome', () => {
    const grupos = agruparLista([item('1', sabao), item('2', feijao), item('3', arroz)], [arroz, feijao, sabao], categorias);
    expect(grupos.map((g) => g.categoria.nome)).toEqual(['Limpeza', 'Mercearia']);
    expect(grupos[1].linhas.map((l) => l.produto?.nome)).toEqual(['Arroz', 'Feijão']);
  });
});
