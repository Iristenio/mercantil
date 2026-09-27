// Ações da lista de compras: gravam localmente e devolvem a função "Desfazer".
import type { Compra, ItemCompra, Produto } from '../../dominio/tipos';
import { compraAtiva, novaCompra, novoItemCompra } from '../../dominio/compras';
import { listarTodos, novoId, type Alteracao } from '../../dados/repositorio';
import { gravarComDesfazer, type Desfazer } from './catalogo';

/** Toques seguidos são gravados um de cada vez (evita criar duas listas com dois toques rápidos). */
let emSequencia: Promise<unknown> = Promise.resolve();
function emOrdem<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = emSequencia.then(tarefa, tarefa);
  emSequencia = resultado.catch(() => undefined);
  return resultado;
}

/** Adiciona o produto à lista ativa; se não houver lista, cria uma (R1). D2: sempre uma linha nova. */
export function adicionarNaLista(produto: Produto): Promise<Desfazer> {
  return emOrdem(async () => {
    const alteracoes: Alteracao[] = [];
    let compra = compraAtiva(await listarTodos('compras'));
    if (!compra) {
      compra = novaCompra({ id: novoId() });
      alteracoes.push({ entidade: 'compras', registro: compra });
    }
    alteracoes.push({ entidade: 'itens_compra', registro: novoItemCompra(novoId(), compra.id, produto) });
    return gravarComDesfazer(alteracoes);
  });
}

/** R2 — começa uma lista nova vazia; a ativa (se houver) vira "cancelada", sem apagar nada. */
export function comecarNovaLista(compras: Compra[]): Promise<Desfazer> {
  const alteracoes: Alteracao[] = [];
  const atual = compraAtiva(compras);
  if (atual) alteracoes.push({ entidade: 'compras', registro: { ...atual, status: 'cancelada' } });
  alteracoes.push({ entidade: 'compras', registro: novaCompra({ id: novoId() }) });
  return gravarComDesfazer(alteracoes);
}

export function cancelarLista(compra: Compra): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'compras', registro: { ...compra, status: 'cancelada' } }]);
}

export function salvarItemCompra(item: ItemCompra): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'itens_compra', registro: item }]);
}

/** Exclusão lógica (R11). */
export function removerItemCompra(item: ItemCompra): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'itens_compra', registro: { ...item, status: 'excluido' }, operacao: 'excluir' }]);
}
