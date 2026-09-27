// Lista de compras ativa: montagem em casa (quantidades, previsto) e modo "no mercado".
import { useState } from 'preact/hooks';
import {
  agruparLista, ajustarQuantidade, alternarComprado, compraAtiva, itensDaCompra, organizarNoMercado, pendentes,
  previstoDaCompra, semPreco, subtotal, valorReal,
} from '../../dominio/compras';
import { chaveNome } from '../../dominio/catalogo';
import { formatarNumero, formatarReais } from '../../dominio/dinheiro';
import type { Categoria, Compra, ItemCompra, Produto } from '../../dominio/tipos';
import { useEntidade } from '../../dados/ganchos';
import { salvar } from '../../dados/repositorio';
import { cancelarLista, comecarNovaLista, encerrar, irAsCompras } from '../acoes/lista';
import { useEstado } from '../estado';
import { irPara } from '../rotas';
import { IconeBusca, IconeFechar, IconeLista, IconeMais } from '../icones';

export function TelaLista() {
  const compras = useEntidade('compras');
  const produtos = useEntidade('produtos');
  const categorias = useEntidade('categorias');
  const todosItens = useEntidade('itens_compra');
  const compra = compraAtiva(compras);
  const itens = itensDaCompra(todosItens, compra?.id);

  if (!compra || itens.length === 0) return <ListaVazia compra={compra} />;
  const dados = { compra, compras, itens, produtos, categorias };
  return compra.status === 'em_andamento' ? <NoMercado {...dados} /> : <Montagem {...dados} />;
}

interface Dados {
  compra: Compra;
  compras: Compra[];
  itens: ItemCompra[];
  produtos: Produto[];
  categorias: Categoria[];
}

const textoPreco = (item: ItemCompra) =>
  item.preco === null ? null : `${formatarReais(item.preco)} × ${formatarNumero(item.quantidade)} = ${formatarReais(subtotal(item))}`;

function ListaVazia({ compra }: { compra?: Compra }) {
  return (
    <>
      <header class="cabecalho">
        <h1>Lista</h1>
      </header>
      <div class="conteudo lista">
        <div class="vazio grande">
          <IconeLista />
          <strong>{compra ? 'Sua lista está vazia' : 'Nenhuma lista em andamento'}</strong>
          Escolha os produtos no catálogo — cada toque coloca um na lista.
          <button class="botao primario" onClick={() => irPara('catalogo')}>
            <IconeMais /> Escolher produtos
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------------- Em casa: montagem ---------------- */

function Montagem({ compra, compras, itens, produtos, categorias }: Dados) {
  const { abrirPainel, avisar, perguntar } = useEstado();
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

  async function comecar() {
    const desfazer = await irAsCompras(compra, itens);
    avisar({ texto: 'Boas compras!', desfazer });
  }

  const mudarQuantidade = (item: ItemCompra, unidade: string, direcao: -1 | 1) =>
    salvar('itens_compra', { ...item, quantidade: ajustarQuantidade(item.quantidade, direcao, unidade) });

  return (
    <>
      <header class="cabecalho">
        <h1>Lista</h1>
        <span class="sub">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
        <button class="botao pequeno cabecalho-acao" onClick={novaLista}>
          Nova lista
        </button>
      </header>
      <div class="conteudo lista">
        <div class="resumo">
          <div class="resumo-valores">
            <span>Previsto</span>
            <strong>{formatarReais(previstoDaCompra(compra, itens))}</strong>
            {faltaPreco > 0 && <small>{faltaPreco === 1 ? '1 item sem preço' : `${faltaPreco} itens sem preço`}</small>}
          </div>
          <button class="botao primario" onClick={comecar}>
            Ir às compras
          </button>
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
                        <small>{textoPreco(item) ?? 'sem preço'}</small>
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
      </div>
    </>
  );
}

/* ---------------- No mercado ---------------- */

function NoMercado({ compra, itens, produtos, categorias }: Dados) {
  const { abrirPainel, avisar, perguntar } = useEstado();
  const [busca, setBusca] = useState('');
  const grupos = organizarNoMercado(agruparLista(itens, produtos, categorias), busca, chaveNome);
  const real = valorReal(itens);
  const previsto = previstoDaCompra(compra, itens);
  const faltam = pendentes(itens).length;
  const resolvidos = itens.length - faltam;
  const acima = real > previsto; // R6

  async function marcar(item: ItemCompra) {
    const novo = alternarComprado(item);
    await salvar('itens_compra', novo);
    // Comprado sem preço: já abre o painel para digitar o preço da etiqueta
    if (novo.status === 'comprado' && novo.preco === null) abrirPainel({ tipo: 'item', id: item.id, foco: 'preco' });
  }

  async function encerrarCompra() {
    const r = await perguntar(
      faltam ? `Ainda ${faltam === 1 ? 'falta 1 item' : `faltam ${faltam} itens`}` : 'Encerrar a compra?',
      [{ valor: 'sim', rotulo: faltam ? 'Encerrar mesmo assim' : 'Encerrar', estilo: 'primario' }],
      `Total: ${formatarReais(real)}. Os preços dos itens comprados viram o "último preço" dos produtos.`,
    );
    if (!r) return;
    const desfazer = await encerrar(compra, itens, produtos);
    avisar({ texto: `Compra encerrada: ${formatarReais(real)}`, desfazer });
  }

  async function cancelar() {
    const r = await perguntar('Cancelar esta compra?', [{ valor: 'sim', rotulo: 'Cancelar compra', estilo: 'perigo' }], 'Ela fica guardada como cancelada; os preços dos produtos não mudam.');
    if (!r) return;
    const desfazer = await cancelarLista(compra);
    avisar({ texto: 'Compra cancelada', desfazer });
  }

  return (
    <>
      <header class="cabecalho">
        <h1>No mercado</h1>
        <span class="sub">
          {resolvidos} de {itens.length}
        </span>
      </header>
      <div class="conteudo lista no-mercado">
        <div class={`placar${acima ? ' acima' : ''}`}>
          <div>
            <span>Total</span>
            <strong>{formatarReais(real)}</strong>
          </div>
          <div class="placar-previsto">
            <span>Previsto</span>
            <strong>{formatarReais(previsto)}</strong>
          </div>
          <div class="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={itens.length} aria-valuenow={resolvidos}>
            <span style={{ width: `${(resolvidos / itens.length) * 100}%` }} />
          </div>
        </div>

        <div class="busca">
          <IconeBusca />
          <input class="campo" type="search" placeholder="Procurar na lista" value={busca} onInput={(e) => setBusca(e.currentTarget.value)} />
          {busca && (
            <button class="botao-icone" aria-label="Limpar busca" onClick={() => setBusca('')}>
              <IconeFechar />
            </button>
          )}
        </div>

        {grupos.length === 0 && <p class="dica">Nada na lista com “{busca}”.</p>}
        {grupos.map(({ categoria, linhas }) => (
          <section key={categoria.id} class="grupo">
            <h2 class="grupo-titulo">
              {categoria.nome}
              <small>
                {linhas.filter((l) => l.item.status !== 'pendente').length}/{linhas.length}
              </small>
            </h2>
            <ul class="lista-itens">
              {linhas.map(({ item, produto }) => (
                <li key={item.id}>
                  <div class={`linha-item linha-mercado ${item.status}`} onClick={() => abrirPainel({ tipo: 'item', id: item.id })}>
                    <button
                      class="check"
                      aria-label={item.status === 'comprado' ? 'Desmarcar' : 'Marcar como comprado'}
                      aria-pressed={item.status === 'comprado'}
                      onClick={(e) => {
                        e.stopPropagation();
                        marcar(item);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.5 12.5l3.5 3.5 7.5-8" />
                      </svg>
                    </button>
                    <span class="linha-item-texto">
                      <strong>
                        {formatarNumero(item.quantidade)} {produto?.unidade ?? ''} · {produto?.nome ?? '(produto removido)'}
                      </strong>
                      <small>
                        {item.status === 'indisponivel' ? 'não achei' : (textoPreco(item) ?? 'toque para informar o preço')}
                      </small>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div class="acoes-lista">
          <button class="botao primario" onClick={encerrarCompra}>
            Encerrar compra
          </button>
          <button class="botao fantasma perigo" onClick={cancelar}>
            Cancelar compra
          </button>
        </div>
      </div>
    </>
  );
}
