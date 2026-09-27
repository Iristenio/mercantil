// Catálogo: todos os produtos por categoria (na ordem dos corredores), com busca.
import { useState } from 'preact/hooks';
import { agruparCatalogo, ativos, limparNome } from '../../dominio/catalogo';
import { formatarReais } from '../../dominio/dinheiro';
import { useEntidade } from '../../dados/ganchos';
import { useEstado } from '../estado';
import { IconeBusca, IconeCesta, IconeFechar, IconeMais } from '../icones';

export function TelaCatalogo() {
  const { abrirPainel } = useEstado();
  const produtos = useEntidade('produtos');
  const categorias = useEntidade('categorias');
  const [busca, setBusca] = useState('');
  const grupos = agruparCatalogo(produtos, categorias, busca);
  const total = ativos(produtos).length;

  return (
    <>
      <header class="cabecalho">
        <h1>Catálogo</h1>
        <span class="sub">{total} {total === 1 ? 'produto' : 'produtos'}</span>
      </header>
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
                    <button class="linha-item linha-produto" onClick={() => abrirPainel({ tipo: 'produto', id: p.id })}>
                      <span class="linha-item-texto">
                        <strong>{p.nome}</strong>
                        <small>{p.unidade}</small>
                      </span>
                      {p.ultimo_preco !== null && <span class="preco">{formatarReais(p.ultimo_preco)}</span>}
                    </button>
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
