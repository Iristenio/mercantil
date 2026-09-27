// Ações da lista de compras: gravam localmente e devolvem a função "Desfazer".
import type { Compra, ItemCompra, Produto } from '../../dominio/tipos';
import { compraAtiva, encerrarCompra, iniciarCompra, novaCompra, novoItemCompra } from '../../dominio/compras';
import { listarTodos, novoId, type Alteracao } from '../../dados/repositorio';
import { itensParaRepetir } from '../../dominio/historico';
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

/** "Ir às compras": congela o previsto (R4). */
export function irAsCompras(compra: Compra, itens: ItemCompra[]): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'compras', registro: iniciarCompra(compra, itens) }]);
}

/** R9 — encerra a compra e atualiza o último preço dos produtos comprados (tudo numa gravação, com Desfazer). */
export function encerrar(compra: Compra, itens: ItemCompra[], produtos: Produto[]): Promise<Desfazer> {
  const r = encerrarCompra(compra, itens, produtos);
  return gravarComDesfazer([
    { entidade: 'compras', registro: r.compra },
    ...r.produtos.map((registro) => ({ entidade: 'produtos', registro }) as Alteracao),
  ]);
}

/**
 * D4 — repete uma compra do histórico. Sem lista ativa, cria uma. Com lista ativa: "adicionar" junta os
 * itens a ela; "substituir" cancela a atual (R2) e começa outra só com os itens repetidos.
 */
export function repetirCompra(origemId: string, modo: 'adicionar' | 'substituir' = 'adicionar'): Promise<{ desfazer: Desfazer; quantos: number }> {
  return emOrdem(async () => {
    const [compras, itens, produtos] = await Promise.all([listarTodos('compras'), listarTodos('itens_compra'), listarTodos('produtos')]);
    const alteracoes: Alteracao[] = [];
    let destino = compraAtiva(compras);
    if (destino && modo === 'substituir') {
      alteracoes.push({ entidade: 'compras', registro: { ...destino, status: 'cancelada' } });
      destino = undefined;
    }
    if (!destino) {
      destino = novaCompra({ id: novoId() });
      alteracoes.push({ entidade: 'compras', registro: destino });
    }
    const novos = itensParaRepetir(origemId, itens, produtos, destino.id, novoId);
    alteracoes.push(...novos.map((registro) => ({ entidade: 'itens_compra', registro }) as Alteracao));
    return { desfazer: await gravarComDesfazer(alteracoes), quantos: novos.length };
  });
}
