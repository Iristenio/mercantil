import { describe, expect, it } from 'vitest';
import { comprasFinalizadas, historicoPrecos, itensParaRepetir, variacaoPreco } from './historico';
import { novaCompra, novoItemCompra } from './compras';
import { novoProduto } from './catalogo';
import type { ItemCompra } from './tipos';

const arroz = novoProduto({ id: 'arroz', nome: 'Arroz', unidade: 'Kg', ultimo_preco: 5.19, data_ultimo_preco: '2026-09-20' });
const feijao = novoProduto({ id: 'feijao', nome: 'Feijão', unidade: 'Kg', status: 'excluido' });
const leite = novoProduto({ id: 'leite', nome: 'Leite', unidade: 'L', ultimo_preco: 8, data_ultimo_preco: '2026-08-31' });

const c1 = novaCompra({ id: 'c1', status: 'finalizada', data_finalizacao: '2026-09-01T12:00:00.000Z' });
const c2 = novaCompra({ id: 'c2', status: 'finalizada', data_finalizacao: '2026-09-20T12:00:00.000Z' });
const c3 = novaCompra({ id: 'c3', status: 'cancelada' });
const item = (id: string, compra: string, produto = arroz, extra: Partial<ItemCompra> = {}): ItemCompra => ({
  ...novoItemCompra(id, compra, produto, 2, new Date(`2026-09-0${id.length}T10:00:00Z`)),
  status: 'comprado',
  ...extra,
});

const itens = [
  item('a', 'c1', arroz, { preco: 4.59 }),
  item('b', 'c2', arroz, { preco: 5.19 }),
  item('cc', 'c2', feijao, { preco: 9 }),
  item('d', 'c3', arroz, { preco: 1 }),
  item('ee', 'c2', leite, { status: 'indisponivel', quantidade: 3 }),
];

describe('histórico', () => {
  it('compras finalizadas da mais recente para a mais antiga', () => {
    expect(comprasFinalizadas([c1, c3, c2]).map((c) => c.id)).toEqual(['c2', 'c1']);
  });

  it('D3 — preços pagos só em compras finalizadas e itens comprados', () => {
    expect(historicoPrecos(arroz, [c1, c2, c3], itens)).toEqual([
      { data: '2026-09-20', preco: 5.19 },
      { data: '2026-09-01', preco: 4.59 },
    ]);
  });

  it('D3 — sem compras no app, usa o último preço guardado no produto', () => {
    expect(historicoPrecos(leite, [c1, c2], itens)).toEqual([{ data: '2026-08-31', preco: 8 }]);
  });

  it('D3 — variação em R$ e %', () => {
    expect(variacaoPreco(5.19, 4.59)).toEqual({ diferenca: 0.6, percentual: 13.1, sentido: 'subiu' });
    expect(variacaoPreco(4, 5)).toEqual({ diferenca: -1, percentual: -20, sentido: 'caiu' });
    expect(variacaoPreco(5, 5)?.sentido).toBe('igual');
    expect(variacaoPreco(null, 5)).toBeNull();
    expect(variacaoPreco(5, null)).toBeNull();
  });

  it('D4 — repete a última compra: mesmos produtos e quantidades, pendentes, preço atual, sem excluídos', () => {
    let n = 0;
    const ultima = comprasFinalizadas([c1, c2, c3])[0];
    const novos = itensParaRepetir(ultima.id, itens, [arroz, feijao, leite], 'nova', () => `n${++n}`);
    expect(novos.map((i) => [i.produto_id, i.quantidade, i.preco, i.status, i.compra_id])).toEqual([
      ['arroz', 2, 5.19, 'pendente', 'nova'],
      ['leite', 3, 8, 'pendente', 'nova'],
    ]);
  });
});
