// Lista de compras ativa: montagem (quantidades, previsto). O modo "no mercado" vem na etapa 3.
import { agruparLista, ajustarQuantidade, compraAtiva, itensDaCompra, semPreco, subtotal, valorPrevisto } from '../../dominio/compras';
import { formatarNumero, formatarReais } from '../../dominio/dinheiro';
import type { ItemCompra } from '../../dominio/tipos';
import { useEntidade } from '../../dados/ganchos';
import { salvar } from '../../dados/repositorio';
import { comecarNovaLista } from '../acoes/lista';
import { useEstado } from '../estado';
import { irPara } from '../rotas';
import { IconeLista, IconeMais } from '../icones';

export function TelaLista() {
  const { abrirPainel, avisar, perguntar } = useEstado();
  const compras = useEntidade('compras');
  const produtos = useEntidade('produtos');
  const categorias = useEntidade('categorias');
  const todosItens = useEntidade('itens_compra');
  const compra = compraAtiva(compras);
  const itens = itensDaCompra(todosItens, compra?.id);
  const grupos = agruparLista(itens, produtos, categorias);
  const faltaPreco = semPreco(itens);

  async function novaLista() {
    const r = await perguntar(
      'Começar uma lista nova?',
      [{ valor: 'nova', rotulo: 'Começar do zero', estilo: 'perigo' }],
      'A lista atual será cancelada (fica guardada, mas sai da tela).',
    );
    if (!r) return;
    const desfazer = await comecarNovaLista(compras);
    avisar({ texto: 'Lista nova começada', desfazer });
  }

  const mudarQuantidade = (item: ItemCompra, unidade: string, direcao: -1 | 1) =>
    salvar('itens_compra', { ...item, quantidade: ajustarQuantidade(item.quantidade, direcao, unidade) });

  return (
    <>
      <header class="cabecalho">
        <h1>Lista</h1>
        {itens.length > 0 && <span class="sub">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>}
        {compra && itens.length > 0 && (
          <button class="botao pequeno cabecalho-acao" onClick={novaLista}>
            Nova lista
          </button>
        )}
      </header>
      <div class="conteudo lista">
        {itens.length === 0 ? (
          <div class="vazio grande">
            <IconeLista />
            <strong>{compra ? 'Sua lista está vazia' : 'Nenhuma lista em andamento'}</strong>
            Escolha os produtos no catálogo — cada toque coloca um na lista.
            <button class="botao primario" onClick={() => irPara('catalogo')}>
              <IconeMais /> Escolher produtos
            </button>
          </div>
        ) : (
          <>
            <div class="resumo">
              <span>Previsto</span>
              <strong>{formatarReais(valorPrevisto(itens))}</strong>
              {faltaPreco > 0 && <small>{faltaPreco === 1 ? '1 item sem preço' : `${faltaPreco} itens sem preço`}</small>}
            </div>

            {grupos.map(({ categoria, linhas }) => (
              <section key={categoria.id} class="grupo">
                <h2 class="grupo-titulo">
                  {categoria.nome}
                  <small>{linhas.length}</small>
                </h2>
                <ul class="lista-itens">
                  {linhas.map(({ item, produto }) => {
                    const unidade = produto?.unidade ?? 'Un';
                    return (
                      <li key={item.id}>
                        <div class="linha-item linha-lista" onClick={() => abrirPainel({ tipo: 'item', id: item.id })}>
                          <span class="linha-item-texto">
                            <strong>{produto?.nome ?? '(produto removido)'}</strong>
                            <small>
                              {item.preco === null
                                ? 'sem preço'
                                : `${formatarReais(item.preco)} × ${formatarNumero(item.quantidade)} = ${formatarReais(subtotal(item))}`}
                            </small>
                          </span>
                          <span class="quantidade" onClick={(e) => e.stopPropagation()}>
                            <button class="botao-icone" aria-label="Diminuir" onClick={() => mudarQuantidade(item, unidade, -1)}>
                              −
                            </button>
                            <span class="quantidade-valor">
                              {formatarNumero(item.quantidade)}
                              <small>{unidade}</small>
                            </span>
                            <button class="botao-icone" aria-label="Aumentar" onClick={() => mudarQuantidade(item, unidade, 1)}>
                              +
                            </button>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </>
  );
}
