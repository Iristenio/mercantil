// Cadastro/edição de produto (painel). Categoria nova pode ser digitada aqui mesmo (R10).
import { useEffect, useRef, useState } from 'preact/hooks';
import { UNIDADES, type Produto } from '../../dominio/tipos';
import { novoProduto, ordenarCategorias, validarProduto } from '../../dominio/catalogo';
import { formatarNumero, formatarReais, lerValor } from '../../dominio/dinheiro';
import { historicoPrecos } from '../../dominio/historico';
import { hojeISO } from '../../dominio/datas';
import { buscar, novoId } from '../../dados/repositorio';
import { useEntidade } from '../../dados/ganchos';
import { excluirProduto, salvarProduto } from '../acoes/catalogo';
import { useEstado } from '../estado';
import { IconeMais } from '../icones';
import { VariacaoPreco } from '../componentes/VariacaoPreco';

const fmtData = (iso: string) => iso.split('-').reverse().join('/');

export function FormProduto({ id, nome }: { id?: string; nome?: string }) {
  const { fecharPainel, avisar, perguntar } = useEstado();
  const produtos = useEntidade('produtos');
  const categorias = ordenarCategorias(useEntidade('categorias'));
  const compras = useEntidade('compras');
  const itens = useEntidade('itens_compra');
  const [produto, setProduto] = useState<Produto | null>(null);
  const [categoriaNova, setCategoriaNova] = useState<string | null>(null);
  const [preco, setPreco] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const campoNome = useRef<HTMLInputElement>(null);
  const campoCategoria = useRef<HTMLInputElement>(null);
  const novo = !id;

  useEffect(() => {
    (async () => {
      const existente = id ? await buscar('produtos', id) : undefined;
      const p = existente ?? novoProduto({ id: novoId(), nome: nome ? nome.charAt(0).toUpperCase() + nome.slice(1) : '' });
      setProduto(p);
      setPreco(p.ultimo_preco !== null ? formatarNumero(p.ultimo_preco) : '');
      setCategoriaNova(null);
      setErros([]);
      if (!existente) setTimeout(() => campoNome.current?.focus(), 50);
    })();
  }, [id]);

  if (!produto) return null;
  const mudar = (parcial: Partial<Produto>) => setProduto({ ...produto, ...parcial });

  async function salvar(e: Event) {
    e.preventDefault();
    const p = produto!;
    const problemas = validarProduto(p, produtos, categoriaNova ?? '');
    const valor = lerValor(preco);
    if (preco.trim() && valor === null) problemas.push('Preço inválido.');
    setErros(problemas);
    if (problemas.length) return;
    const final: Produto =
      valor === p.ultimo_preco ? p : { ...p, ultimo_preco: valor, data_ultimo_preco: valor === null ? null : hojeISO() };
    const desfazer = await salvarProduto(final, categoriaNova ?? '', categorias);
    fecharPainel();
    avisar({ texto: novo ? 'Produto cadastrado' : 'Produto salvo', desfazer });
  }

  async function excluir() {
    const r = await perguntar(`Excluir “${produto!.nome}”?`, [{ valor: 'sim', rotulo: 'Excluir', estilo: 'perigo' }]);
    if (!r) return;
    const desfazer = await excluirProduto(produto!);
    fecharPainel();
    avisar({ texto: 'Produto excluído', desfazer });
  }

  return (
    <form class="formulario" onSubmit={salvar}>
      <input
        ref={campoNome}
        class="campo campo-titulo"
        placeholder="Nome do produto"
        value={produto.nome}
        onInput={(e) => mudar({ nome: e.currentTarget.value })}
        enterKeyHint="done"
      />

      <fieldset>
        <legend>Categoria</legend>
        <div class="chips">
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              class="chip"
              aria-pressed={categoriaNova === null && produto.categoria_id === c.id}
              onClick={() => {
                setCategoriaNova(null);
                mudar({ categoria_id: c.id });
              }}
            >
              {c.nome}
            </button>
          ))}
          <button type="button" class="chip" aria-pressed={categoriaNova !== null} onClick={() => {
              setCategoriaNova('');
              setTimeout(() => campoCategoria.current?.focus(), 50);
            }}>
            <IconeMais class="chip-icone" /> Nova
          </button>
        </div>
        {categoriaNova !== null && (
          <input
            class="campo"
            placeholder="Nome da nova categoria (ex.: Padaria)"
            value={categoriaNova}
            ref={campoCategoria}
            onInput={(e) => setCategoriaNova(e.currentTarget.value)}
          />
        )}
      </fieldset>

      <fieldset>
        <legend>Unidade</legend>
        <div class="chips">
          {UNIDADES.map((u) => (
            <button key={u} type="button" class="chip" aria-pressed={produto.unidade === u} onClick={() => mudar({ unidade: u })}>
              {u}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Último preço (opcional)</legend>
        <div class="linha">
          <span class="prefixo">R$</span>
          <input class="campo campo-preco" inputMode="decimal" placeholder="0,00" value={preco} onInput={(e) => setPreco(e.currentTarget.value)} />
          {produto.data_ultimo_preco && <span class="dica">em {fmtData(produto.data_ultimo_preco)}</span>}
        </div>
        <p class="dica">Atualizado sozinho quando você encerra uma compra.</p>
      </fieldset>

      {!novo && <PrecosAnteriores pontos={historicoPrecos(produto, compras, itens)} unidade={produto.unidade} />}

      {erros.length > 0 && (
        <ul class="erros" role="alert">
          {erros.map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}

      <div class="acoes-form">
        <button type="submit" class="botao primario">{novo ? 'Cadastrar' : 'Salvar'}</button>
        {!novo && (
          <button type="button" class="botao perigo" onClick={excluir}>Excluir</button>
        )}
      </div>
    </form>
  );
}

/** D3 — preços pagos nas compras anteriores (mais recente primeiro), com a variação entre elas. */
function PrecosAnteriores({ pontos, unidade }: { pontos: { data: string; preco: number }[]; unidade: string }) {
  if (!pontos.length) return null;
  return (
    <fieldset>
      <legend>Preços anteriores (por {unidade})</legend>
      <ul class="historico-precos">
        {pontos.slice(0, 12).map((p, i) => (
          <li key={p.data + i}>
            <span>{fmtData(p.data)}</span>
            <strong>{formatarReais(p.preco)}</strong>
            <VariacaoPreco atual={p.preco} anterior={pontos[i + 1]?.preco ?? null} />
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
