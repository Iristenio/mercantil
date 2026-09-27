// Ações da interface sobre o catálogo: gravam localmente e devolvem a função "Desfazer".
import type { Categoria, Produto } from '../../dominio/tipos';
import { acharCategoria, limparNome, moverCategoria, novaCategoria, proximaOrdem } from '../../dominio/catalogo';
import { gravar, novoId, type Alteracao } from '../../dados/repositorio';

export type Desfazer = () => Promise<void>;

/** Grava as alterações e devolve o "Desfazer": volta cada registro à versão anterior (ou o exclui, se era novo). */
export async function gravarComDesfazer(alteracoes: Alteracao[]): Promise<Desfazer> {
  const anteriores = await gravar(alteracoes);
  return async () => {
    await gravar(
      alteracoes.map(({ entidade, registro }, i) => {
        const anterior = anteriores[i];
        return (anterior
          ? { entidade, registro: anterior }
          : { entidade, registro: { ...registro, status: 'excluido' }, operacao: 'excluir' }) as Alteracao;
      }),
    );
  };
}

/** Salva o produto; se foi digitada uma categoria nova (R10), cria a categoria junto (ou reaproveita a de mesmo nome). */
export async function salvarProduto(produto: Produto, nomeCategoriaNova: string, categorias: Categoria[]): Promise<Desfazer> {
  const alteracoes: Alteracao[] = [];
  let categoria_id = produto.categoria_id;
  const nomeNova = limparNome(nomeCategoriaNova);
  if (nomeNova) {
    const existente = acharCategoria(categorias, nomeNova);
    if (existente) categoria_id = existente.id;
    else {
      const nova = novaCategoria({ id: novoId(), nome: nomeNova, ordem: proximaOrdem(categorias) });
      alteracoes.push({ entidade: 'categorias', registro: nova });
      categoria_id = nova.id;
    }
  }
  alteracoes.push({ entidade: 'produtos', registro: { ...produto, nome: limparNome(produto.nome), categoria_id } });
  return gravarComDesfazer(alteracoes);
}

/** Exclusão lógica (R11). */
export function excluirProduto(produto: Produto): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'produtos', registro: { ...produto, status: 'excluido' }, operacao: 'excluir' }]);
}

export function salvarCategoria(categoria: Categoria): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'categorias', registro: { ...categoria, nome: limparNome(categoria.nome) } }]);
}

export async function reordenarCategoria(categorias: Categoria[], id: string, direcao: -1 | 1): Promise<void> {
  const alteradas = moverCategoria(categorias, id, direcao);
  if (alteradas.length) await gravar(alteradas.map((registro) => ({ entidade: 'categorias', registro })));
}

export function excluirCategoria(categoria: Categoria): Promise<Desfazer> {
  return gravarComDesfazer([{ entidade: 'categorias', registro: { ...categoria, status: 'excluido' }, operacao: 'excluir' }]);
}
