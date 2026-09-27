// Detalhe de uma compra encerrada: totais, itens por categoria e "Repetir esta compra" (D4).
import { agruparLista, itensDaCompra, subtotal } from '../../dominio/compras';
import { formatarNumero, formatarReais } from '../../dominio/dinheiro';
import { useEntidade } from '../../dados/ganchos';
import { useRepetirCompra } from '../acoes/useRepetirCompra';
import { IconeRepetir } from '../icones';
import { dataDaCompra } from '../telas/TelaHistorico';

const fmtCompleta = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function DetalheCompra({ id }: { id: string }) {
  const repetir = useRepetirCompra();
  const compra = useEntidade('compras').find((c) => c.id === id);
  const itens = itensDaCompra(useEntidade('itens_compra'), id);
  const grupos = agruparLista(itens, useEntidade('produtos'), useEntidade('categorias'));
  if (!compra) return null;
  const naoAchados = itens.filter((i) => i.status === 'indisponivel').length;
  const diferenca = Math.round((compra.valor_real - compra.valor_previsto) * 100) / 100;

  return (
    <div class="formulario detalhe-compra">
      <p class="dica primeira-maiuscula">{fmtCompleta.format(dataDaCompra(compra))}</p>

      <div class="placar estatico">
        <div>
          <span>Total</span>
          <strong>{formatarReais(compra.valor_real)}</strong>
        </div>
        <div class="placar-previsto">
          <span>Previsto</span>
          <strong>{formatarReais(compra.valor_previsto)}</strong>
        </div>
        {compra.valor_previsto > 0 && diferenca !== 0 && (
          <small class={`placar-diferenca ${diferenca > 0 ? 'subiu' : 'caiu'}`}>
            {diferenca > 0 ? `${formatarReais(diferenca)} acima do previsto` : `${formatarReais(-diferenca)} abaixo do previsto`}
          </small>
        )}
      </div>
      {naoAchados > 0 && <p class="dica">{naoAchados === 1 ? '1 item não foi achado.' : `${naoAchados} itens não foram achados.`}</p>}

      {grupos.map(({ categoria, linhas }) => (
        <section key={categoria.id}>
          <h2 class="grupo-titulo">{categoria.nome}</h2>
          <ul class="itens-compra">
            {linhas.map(({ item, produto }) => (
              <li key={item.id} class={item.status}>
                <span>
                  {formatarNumero(item.quantidade)} {produto?.unidade} · {produto?.nome ?? '(produto removido)'}
                  {item.status === 'indisponivel' && <small> não achei</small>}
                  {item.status === 'pendente' && <small> não comprado</small>}
                </span>
                <strong>{item.status === 'comprado' && item.preco !== null ? formatarReais(subtotal(item)) : '—'}</strong>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div class="acoes-form">
        <button type="button" class="botao primario" onClick={() => repetir(compra.id)}>
          <IconeRepetir /> Repetir esta compra
        </button>
      </div>
    </div>
  );
}
