// Ajustar um item da lista: quantidade exata (ex.: 0,3 kg), preço unitário, situação no mercado e remover.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Compra, ItemCompra, Produto, StatusItemCompra } from '../../dominio/tipos';
import { ajustarQuantidade, validarItemCompra } from '../../dominio/compras';
import { formatarNumero, formatarReais, lerValor } from '../../dominio/dinheiro';
import { buscar } from '../../dados/repositorio';
import { removerItemCompra, salvarItemCompra } from '../acoes/lista';
import { useEstado } from '../estado';

const SITUACOES: { valor: StatusItemCompra; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Falta pegar' },
  { valor: 'comprado', rotulo: 'Comprado' },
  { valor: 'indisponivel', rotulo: 'Não achei' },
];

export function FormItemCompra({ id, foco }: { id: string; foco?: 'preco' }) {
  const { fecharPainel, avisar } = useEstado();
  const [item, setItem] = useState<ItemCompra | null>(null);
  const [produto, setProduto] = useState<Produto | undefined>();
  const [compra, setCompra] = useState<Compra | undefined>();
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const campoPreco = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const i = await buscar('itens_compra', id);
      if (!i) return;
      setItem(i);
      setProduto(await buscar('produtos', i.produto_id));
      setCompra(await buscar('compras', i.compra_id));
      setQuantidade(formatarNumero(i.quantidade));
      setPreco(i.preco !== null ? formatarNumero(i.preco) : '');
      setErros([]);
      if (foco === 'preco') setTimeout(() => campoPreco.current?.focus(), 80);
    })();
  }, [id]);

  if (!item) return null;
  const unidade = produto?.unidade ?? 'Un';
  const qtd = lerValor(quantidade) ?? 0;
  const valor = lerValor(preco);
  const noMercado = compra?.status === 'em_andamento';

  function passo(direcao: -1 | 1) {
    setQuantidade(formatarNumero(ajustarQuantidade(qtd, direcao, unidade)));
  }

  async function salvar(e: Event) {
    e.preventDefault();
    const final: ItemCompra = { ...item!, quantidade: qtd, preco: valor };
    const problemas = validarItemCompra(final);
    if (preco.trim() && valor === null) problemas.push('Preço inválido.');
    setErros(problemas);
    if (problemas.length) return;
    const desfazer = await salvarItemCompra(final);
    fecharPainel();
    avisar({ texto: 'Item salvo', desfazer });
  }

  async function remover() {
    const desfazer = await removerItemCompra(item!);
    fecharPainel();
    avisar({ texto: `${produto?.nome ?? 'Item'} saiu da lista`, desfazer });
  }

  return (
    <form class="formulario" onSubmit={salvar}>
      <div>
        <h3 class="item-nome">{produto?.nome ?? '(produto removido)'}</h3>
        {produto?.ultimo_preco != null && <p class="dica">Último preço: {formatarReais(produto.ultimo_preco)}</p>}
      </div>

      {noMercado && (
        <div class="segmentado" role="radiogroup" aria-label="Situação">
          {SITUACOES.map((s) => (
            <button key={s.valor} type="button" role="radio" aria-checked={item.status === s.valor} onClick={() => setItem({ ...item, status: s.valor })}>
              {s.rotulo}
            </button>
          ))}
        </div>
      )}

      <fieldset>
        <legend>Preço por {unidade}</legend>
        <div class="linha">
          <span class="prefixo">R$</span>
          <input
            ref={campoPreco}
            class="campo campo-preco"
            inputMode="decimal"
            placeholder="0,00"
            value={preco}
            onInput={(e) => setPreco(e.currentTarget.value)}
            enterKeyHint="done"
          />
        </div>
        {valor !== null && qtd > 0 && <p class="dica">Total do item: {formatarReais(Math.round(qtd * valor * 100) / 100)}</p>}
      </fieldset>

      <fieldset>
        <legend>Quantidade</legend>
        <div class="linha">
          <button type="button" class="botao-icone grande" aria-label="Diminuir" onClick={() => passo(-1)}>−</button>
          <input class="campo campo-curto campo-qtd" inputMode="decimal" value={quantidade} onInput={(e) => setQuantidade(e.currentTarget.value)} />
          <button type="button" class="botao-icone grande" aria-label="Aumentar" onClick={() => passo(1)}>+</button>
          <span class="prefixo">{unidade}</span>
        </div>
      </fieldset>

      {erros.length > 0 && (
        <ul class="erros" role="alert">
          {erros.map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}

      <div class="acoes-form">
        <button type="submit" class="botao primario">Salvar</button>
        <button type="button" class="botao perigo" onClick={remover}>Tirar da lista</button>
      </div>
    </form>
  );
}
