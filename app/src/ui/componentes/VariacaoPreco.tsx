// D3 — "▲ R$ 0,60 (+13,1%)": quanto o preço mudou em relação ao anterior.
import { variacaoPreco } from '../../dominio/historico';
import { formatarNumero, formatarReais } from '../../dominio/dinheiro';

export function VariacaoPreco(props: { atual: number | null; anterior: number | null; sufixo?: string; mostrarIgual?: boolean }) {
  const { atual, anterior, sufixo, mostrarIgual = true } = props;
  const v = variacaoPreco(atual, anterior);
  if (!v) return null;
  if (v.sentido === 'igual') return !mostrarIgual ? null : <span class="variacao igual">= mesmo preço{sufixo ? ` ${sufixo}` : ''}</span>;
  const sinal = v.sentido === 'subiu' ? '+' : '−';
  return (
    <span class={`variacao ${v.sentido}`}>
      {v.sentido === 'subiu' ? '▲' : '▼'} {formatarReais(Math.abs(v.diferenca))} ({sinal}
      {formatarNumero(Math.abs(v.percentual))}%){sufixo ? ` ${sufixo}` : ''}
    </span>
  );
}
