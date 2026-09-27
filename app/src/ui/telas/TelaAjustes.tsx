// Tela Ajustes: conexão com o Google, preferências e informações do aparelho.
import { useEffect, useState } from 'preact/hooks';
import { ativos, ordenarCategorias } from '../../dominio/catalogo';
import { useEntidade } from '../../dados/ganchos';
import { reordenarCategoria } from '../acoes/catalogo';
import { IconeMais, IconeSetaBaixo, IconeSetaCima } from '../icones';
import { baixarTudo, conectar, desconectar, ErroApi, sincronizar } from '../../sync/motor';
import { APP } from '../../app.config';
import { descreverUltimaSync, ROTULO_STATUS, useSync } from '../../sync/ganchos';
import { useEstado } from '../estado';

export function TelaAjustes() {
  return (
    <>
      <header class="cabecalho">
        <h1>Ajustes</h1>
      </header>
      <div class="conteudo ajustes">
        <CartaoGoogle />
        <CartaoCategorias />
        <CartaoAparelho />
      </div>
    </>
  );
}

/* ---------------- Conexão com o Google ---------------- */

function CartaoGoogle() {
  const sync = useSync();
  const { avisar, perguntar } = useEstado();
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [, forcarRelogio] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forcarRelogio((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  async function aoConectar(e: Event) {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    try {
      await conectar(codigo);
      setCodigo('');
      avisar({ texto: 'Conectado ao Google! Seus dados estão sendo enviados à planilha.' });
    } catch (x) {
      setErro(x instanceof ErroApi ? x.message : 'Não foi possível conectar.');
    } finally {
      setOcupado(false);
    }
  }

  async function aoDesconectar() {
    const r = await perguntar(
      'Desconectar deste aparelho?',
      [{ valor: 'sim', rotulo: 'Desconectar', estilo: 'perigo' }],
      'Os dados continuam aqui e na planilha. Alterações feitas depois ficarão só neste aparelho até conectar de novo.',
    );
    if (r) await desconectar();
  }

  async function aoBaixarTudo() {
    setOcupado(true);
    await baixarTudo();
    setOcupado(false);
    avisar({ texto: 'Dados da planilha conferidos' });
  }

  const conectado = sync.status !== 'desconectado';

  return (
    <section class="cartao">
      <h2>Sincronização com o Google</h2>
      {!conectado ? (
        <form class="formulario" onSubmit={aoConectar}>
          <p class="dica">
            Conecte o app à sua conta Google para guardar tudo numa planilha (backup) e sincronizar entre os seus
            aparelhos.
          </p>
          <textarea
            class="campo codigo"
            rows={3}
            placeholder="Cole aqui o código de conexão (começa com APP1:)"
            value={codigo}
            onInput={(e) => setCodigo(e.currentTarget.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellcheck={false}
          />
          {erro && <p class="erros" role="alert">{erro}</p>}
          <div class="linha">
            <button type="submit" class="botao primario" disabled={ocupado || !codigo.trim()}>
              {ocupado ? 'Conectando…' : 'Conectar'}
            </button>
          </div>
        </form>
      ) : (
        <div class="sync-painel">
          <div class={`sync-status ${sync.status}`}>
            <span class={`status-ponto ${sync.status}`} />
            <strong>{ROTULO_STATUS[sync.status]}</strong>
            <span>
              {sync.pendentes > 0 ? `${sync.pendentes} alteraç${sync.pendentes > 1 ? 'ões' : 'ão'} a enviar · ` : ''}
              última sincronização: {descreverUltimaSync(sync.ultimaSync)}
            </span>
          </div>
          {sync.erro && <p class="erros" role="alert">{sync.erro}</p>}
          <div class="linha">
            <button class="botao primario" disabled={sync.status === 'sincronizando'} onClick={() => sincronizar()}>
              Sincronizar agora
            </button>
            {sync.planilha && (
              <a class="botao" href={sync.planilha} target="_blank" rel="noopener noreferrer">
                Abrir planilha
              </a>
            )}
            <button class="botao" disabled={ocupado} onClick={aoBaixarTudo}>
              Baixar tudo da planilha
            </button>
            <button class="botao perigo" onClick={aoDesconectar}>
              Desconectar
            </button>
          </div>
          <p class="dica">
            A sincronização acontece sozinha: ao abrir o app, alguns segundos após cada alteração, quando a internet
            volta e a cada 5 minutos.
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------------- Categorias ---------------- */

function CartaoCategorias() {
  const { abrirPainel } = useEstado();
  const todas = useEntidade('categorias');
  const produtos = ativos(useEntidade('produtos'));
  const categorias = ordenarCategorias(todas);

  return (
    <section class="cartao">
      <h2>Categorias</h2>
      <p class="dica">Coloque na ordem dos corredores do mercado — a lista de compras segue esta ordem.</p>
      <ul class="lista-categorias">
        {categorias.map((c, i) => (
          <li key={c.id}>
            <button class="categoria-nome" onClick={() => abrirPainel({ tipo: 'categoria', id: c.id })}>
              <strong>{c.nome}</strong>
              <small>{produtos.filter((p) => p.categoria_id === c.id).length}</small>
            </button>
            <button class="botao-icone" aria-label={`Subir ${c.nome}`} disabled={i === 0} onClick={() => reordenarCategoria(todas, c.id, -1)}>
              <IconeSetaCima />
            </button>
            <button class="botao-icone" aria-label={`Descer ${c.nome}`} disabled={i === categorias.length - 1} onClick={() => reordenarCategoria(todas, c.id, 1)}>
              <IconeSetaBaixo />
            </button>
          </li>
        ))}
      </ul>
      <button class="botao" onClick={() => abrirPainel({ tipo: 'categoria' })}>
        <IconeMais /> Nova categoria
      </button>
    </section>
  );
}

export function Numero(props: { rotulo: string; sufixo: string; valor: number; opcoes: number[]; aoMudar: (v: number) => void }) {
  return (
    <label>
      <span>{props.rotulo}</span>
      <span class="linha">
        <select class="campo" value={props.valor} onChange={(e) => props.aoMudar(Number(e.currentTarget.value))}>
          {props.opcoes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {props.sufixo}
      </span>
    </label>
  );
}

/* ---------------- Este aparelho ---------------- */

function CartaoAparelho() {
  const [persistente, setPersistente] = useState<boolean | null>(null);
  const [uso, setUso] = useState<string>('');

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersistente).catch(() => setPersistente(null));
    navigator.storage
      ?.estimate?.()
      .then((e) => setUso(e.usage ? `${(e.usage / 1024 / 1024).toFixed(1)} MB` : ''))
      .catch(() => undefined);
  }, []);

  return (
    <section class="cartao">
      <h2>Este aparelho</h2>
      <ul class="info-lista">
        <li>
          <span>Proteção dos dados locais</span>
          <strong>
            {persistente === null ? '—' : persistente ? '✔ Ativa' : '⚠ Inativa (instale o app na tela inicial)'}
          </strong>
        </li>
        {uso && (
          <li>
            <span>Espaço usado</span>
            <strong>{uso}</strong>
          </li>
        )}
        <li>
          <span>Pensado para</span>
          <strong>{APP.dispositivos.join(', ')}</strong>
        </li>
        <li>
          <span>Versão do app</span>
          <strong>{__VERSAO__}</strong>
        </li>
      </ul>
    </section>
  );
}
