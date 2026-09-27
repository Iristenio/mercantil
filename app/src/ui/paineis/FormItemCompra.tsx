// Ajustar um item da lista: quantidade exata (ex.: 0,3 kg), preço unitário e remover.
import { useEffect, useState } from 'preact/hooks';
import type { ItemCompra, Produto } from '../../dominio/tipos';
import { ajustarQuantidade, validarItemCompra } from '../../dominio/compras';
import { formatarNumero, formatarReais, lerValor } from '../../dominio/dinheiro';
import { buscar } from '../../dados/repositorio';
import { removerItemCompra, salvarItemCompra } from '../acoes/lista';
import { useEstado } from '../estado';

export function FormItemCompra({ id }: { id: string }) {
  const { fecharPainel, avisar } = useEstado();
  const [item, setItem] = useState<ItemCompra | null>(null);
  const [produto, setProduto] = useState<Produto | undefined>();
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const i = await buscar('itens_compra', id);
      if (!i) return;
      setItem(i);
      setProduto(await buscar('produtos', i.produto_id));
      setQuantidade(formatarNumero(i.quantidade));
      setPreco(i.preco !== null ? formatarNumero(i.preco) : '');
      setErros([]);
    })();
  }, [id]);

  if (!item) return null;
  const unidade = produto?.unidade ?? 'Un';
  const qtd = lerValor(quantidade) ?? 0;
  const valor = lerValor(preco);

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

      <fieldset>
        <legend>Quantidade</legend>
        <div class="linha">
          <button type="button" class="botao-icone grande" aria-label="Diminuir" onClick={() => passo(-1)}>−</button>
          <input class="campo campo-curto campo-qtd" inputMode="decimal" value={quantidade} onInput={(e) => setQuantidade(e.currentTarget.value)} />
          <button type="button" class="botao-icone grande" aria-label="Aumentar" onClick={() => passo(1)}>+</button>
          <span class="prefixo">{unidade}</span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Preço por {unidade}</legend>
        <div class="linha">
          <span class="prefixo">R$</span>
          <input class="campo campo-preco" inputMode="decimal" placeholder="0,00" value={preco} onInput={(e) => setPreco(e.currentTarget.value)} />
        </div>
        {valor !== null && qtd > 0 && <p class="dica">Total do item: {formatarReais(Math.round(qtd * valor * 100) / 100)}</p>}
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
