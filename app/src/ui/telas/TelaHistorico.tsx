// Histórico: compras encerradas (mais recente primeiro) e o gasto do mês.
import { comprasFinalizadas } from '../../dominio/historico';
import { itensDaCompra } from '../../dominio/compras';
import { formatarReais } from '../../dominio/dinheiro';
import type { Compra } from '../../dominio/tipos';
import { useEntidade } from '../../dados/ganchos';
import { useEstado } from '../estado';
import { IconeRelogio } from '../icones';

const fmtDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
export const dataDaCompra = (c: Compra) => new Date(c.data_finalizacao ?? c.criado_em);
export const descreverDia = (c: Compra) => fmtDia.format(dataDaCompra(c)).replace(/\./g, '');

export function TelaHistorico() {
  const { abrirPainel } = useEstado();
  const compras = comprasFinalizadas(useEntidade('compras'));
  const itens = useEntidade('itens_compra');
  const agora = new Date();
  const doMes = compras.filter((c) => {
    const d = dataDaCompra(c);
    return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth();
  });
  const gastoMes = doMes.reduce((s, c) => s + c.valor_real, 0);

  return (
    <>
      <header class="cabecalho">
        <h1>Histórico</h1>
        {compras.length > 0 && <span class="sub">{compras.length} {compras.length === 1 ? 'compra' : 'compras'}</span>}
      </header>
      <div class="conteudo historico">
        {compras.length === 0 ? (
          <div class="vazio grande">
            <IconeRelogio />
            <strong>Nenhuma compra encerrada ainda</strong>
            Quando você encerrar uma compra, ela aparece aqui.
          </div>
        ) : (
          <>
            <div class="resumo">
              <div class="resumo-valores">
                <span>Gasto em {fmtMes.format(agora)}</span>
                <strong>{formatarReais(Math.round(gastoMes * 100) / 100)}</strong>
                <small class="neutro">
                  {doMes.length === 1 ? '1 compra' : `${doMes.length} compras`}
                </small>
              </div>
            </div>
            <ul class="lista-itens lista-historico">
              {compras.map((c) => {
                const n = itensDaCompra(itens, c.id).filter((i) => i.status === 'comprado').length;
                const acima = c.valor_real > c.valor_previsto && c.valor_previsto > 0;
                return (
                  <li key={c.id}>
                    <button class="linha-item" onClick={() => abrirPainel({ tipo: 'compra', id: c.id })}>
                      <span class="linha-item-texto">
                        <strong>{descreverDia(c)}</strong>
                        <small>
                          {n === 1 ? '1 item' : `${n} itens`} · previsto {formatarReais(c.valor_previsto)}
                        </small>
                      </span>
                      <span class={`preco-total${acima ? ' acima' : ''}`}>{formatarReais(c.valor_real)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
