// Renomear / criar / excluir categoria (painel aberto a partir de Ajustes).
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Categoria } from '../../dominio/tipos';
import { ativos, novaCategoria, proximaOrdem, validarCategoria } from '../../dominio/catalogo';
import { buscar, novoId } from '../../dados/repositorio';
import { useEntidade } from '../../dados/ganchos';
import { excluirCategoria, salvarCategoria } from '../acoes/catalogo';
import { useEstado } from '../estado';

export function FormCategoria({ id }: { id?: string }) {
  const { fecharPainel, avisar, perguntar } = useEstado();
  const categorias = useEntidade('categorias');
  const produtos = useEntidade('produtos');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const campo = useRef<HTMLInputElement>(null);
  const novo = !id;

  useEffect(() => {
    (async () => {
      const existente = id ? await buscar('categorias', id) : undefined;
      setCategoria(existente ?? novaCategoria({ id: novoId() }));
      setErros([]);
      setTimeout(() => campo.current?.focus(), 50);
    })();
  }, [id]);

  if (!categoria) return null;
  const emUso = ativos(produtos).filter((p) => p.categoria_id === categoria.id).length;

  async function salvar(e: Event) {
    e.preventDefault();
    const problemas = validarCategoria(categoria!, categorias);
    setErros(problemas);
    if (problemas.length) return;
    const final = novo ? { ...categoria!, ordem: proximaOrdem(categorias) } : categoria!;
    const desfazer = await salvarCategoria(final);
    fecharPainel();
    avisar({ texto: novo ? 'Categoria criada' : 'Categoria salva', desfazer });
  }

  async function excluir() {
    if (emUso) {
      await perguntar('Esta categoria tem produtos', [{ valor: 'ok', rotulo: 'Entendi', estilo: 'primario' }], `Mude os ${emUso} produtos para outra categoria (ou exclua-os) antes de excluir.`);
      return;
    }
    const r = await perguntar(`Excluir “${categoria!.nome}”?`, [{ valor: 'sim', rotulo: 'Excluir', estilo: 'perigo' }]);
    if (!r) return;
    const desfazer = await excluirCategoria(categoria!);
    fecharPainel();
    avisar({ texto: 'Categoria excluída', desfazer });
  }

  return (
    <form class="formulario" onSubmit={salvar}>
      <input
        ref={campo}
        class="campo campo-titulo"
        placeholder="Nome da categoria"
        value={categoria.nome}
        onInput={(e) => setCategoria({ ...categoria, nome: e.currentTarget.value })}
        enterKeyHint="done"
      />
      {!novo && <p class="dica">{emUso === 1 ? '1 produto' : `${emUso} produtos`} nesta categoria.</p>}

      {erros.length > 0 && (
        <ul class="erros" role="alert">
          {erros.map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}

      <div class="acoes-form">
        <button type="submit" class="botao primario">{novo ? 'Criar' : 'Salvar'}</button>
        {!novo && (
          <button type="button" class="botao perigo" onClick={excluir}>Excluir</button>
        )}
      </div>
    </form>
  );
}
