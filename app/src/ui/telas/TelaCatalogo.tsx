// Catálogo: todos os produtos por categoria (na ordem dos corredores), com busca.
import { useState } from 'preact/hooks';
import { agruparCatalogo, ativos, limparNome } from '../../dominio/catalogo';
import { formatarReais } from '../../dominio/dinheiro';
import { compraAtiva, contagemNaLista, itensDaCompra } from '../../dominio/compras';
import type { Produto } from '../../dominio/tipos';
import { useEntidade } from '../../dados/ganchos';
import { adicionarNaLista } from '../acoes/lista';
import { useEstado } from '../estado';
import { IconeBusca, IconeCesta, IconeFechar, IconeLapis, IconeMais } from '../icones';

export function TelaCatalogo() {
  const { abrirPainel, avisar } = useEstado();
  const produtos = useEntidade('produtos');
  const categorias = useEntidade('categorias');
  const compras = useEntidade('compras');
  const itens = useEntidade('itens_compra');
  const naLista = contagemNaLista(itensDaCompra(itens, compraAtiva(compras)?.id));
  const [busca, setBusca] = useState('');
  const grupos = agruparCatalogo(produtos, categorias, busca);
  const total = ativos(produtos).length;

  async function adicionar(p: Produto) {
    const desfazer = await adicionarNaLista(p);
    avisar({ texto: `${p.nome} na lista`, desfazer });
  }

  return (
    <>
      <header class="cabecalho">
        <h1>Catálogo</h1>
        <span class="sub">{total} {total === 1 ? 'produto' : 'produtos'}</span>
      </header>
      <p class="dica catalogo-dica">Toque num produto para colocá-lo na lista.</p>
      <div class="conteudo catalogo">
        <div class="busca">
          <IconeBusca />
          <input
            class="campo"
            type="search"
            placeholder="Buscar produto"
            value={busca}
            onInput={(e) => setBusca(e.currentTarget.value)}
            enterKeyHint="search"
          />
          {busca && (
            <button class="botao-icone" aria-label="Limpar busca" onClick={() => setBusca('')}>
              <IconeFechar />
            </button>
          )}
        </div>

        {grupos.length === 0 ? (
          <div class="vazio">
            <IconeCesta />
            {busca ? (
              <>
                <strong>Nenhum produto com “{limparNome(busca)}”</strong>
                <button class="botao primario" onClick={() => abrirPainel({ tipo: 'produto', nome: limparNome(busca) })}>
                  <IconeMais /> Cadastrar “{limparNome(busca)}”
                </button>
              </>
            ) : (
              <>
                <strong>Nenhum produto ainda</strong>
                Toque no + para cadastrar.
              </>
            )}
          </div>
        ) : (
          grupos.map(({ categoria, produtos: lista }) => (
            <section key={categoria.id} class="grupo">
              <h2 class="grupo-titulo">
                {categoria.nome}
                <small>{lista.length}</small>
              </h2>
              <ul class="lista-itens">
                {lista.map((p) => (
                  <li key={p.id}>
                    <div class={`linha-item linha-produto${naLista.has(p.id) ? ' na-lista' : ''}`} onClick={() => adicionar(p)}>
                      <span class="linha-item-texto">
                        <strong>{p.nome}</strong>
                        <small>
                          {p.unidade}
                          {p.ultimo_preco !== null && ` · ${formatarReais(p.ultimo_preco)}`}
                        </small>
                      </span>
                      {naLista.has(p.id) && (
                        <span class="selo" aria-label={`${naLista.get(p.id)} na lista`}>
                          {naLista.get(p.id)}
                        </span>
                      )}
                      <button
                        class="botao-icone"
                        aria-label={`Editar ${p.nome}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirPainel({ tipo: 'produto', id: p.id });
                        }}
                      >
                        <IconeLapis />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
