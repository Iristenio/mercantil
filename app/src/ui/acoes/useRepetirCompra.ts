// D4 — "Repetir compra" com as perguntas certas (R2) quando já existe uma lista com itens.
import { compraAtiva, itensDaCompra } from '../../dominio/compras';
import { listarTodos } from '../../dados/repositorio';
import { useEstado } from '../estado';
import { irPara } from '../rotas';
import { repetirCompra } from './lista';

export function useRepetirCompra() {
  const { avisar, perguntar, fecharPainel } = useEstado();

  return async (origemId: string) => {
    const [compras, itens] = await Promise.all([listarTodos('compras'), listarTodos('itens_compra')]);
    const ativa = compraAtiva(compras);
    let modo: 'adicionar' | 'substituir' = 'adicionar';
    if (ativa && itensDaCompra(itens, ativa.id).length) {
      if (ativa.status === 'em_andamento') {
        const r = await perguntar('Você está no meio de uma compra', [{ valor: 'adicionar', rotulo: 'Adicionar os itens a ela', estilo: 'primario' }]);
        if (!r) return;
      } else {
        const r = await perguntar(
          'Você já tem uma lista',
          [
            { valor: 'adicionar', rotulo: 'Adicionar à lista atual', estilo: 'primario' },
            { valor: 'substituir', rotulo: 'Trocar pela lista repetida', estilo: 'perigo' },
          ],
          'Ao trocar, a lista atual fica guardada como cancelada.',
        );
        if (!r) return;
        modo = r;
      }
    }
    const { desfazer, quantos } = await repetirCompra(origemId, modo);
    fecharPainel();
    irPara('lista');
    avisar({ texto: quantos === 1 ? '1 item na lista' : `${quantos} itens na lista`, desfazer });
  };
}
