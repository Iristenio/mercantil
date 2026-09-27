import type { JSX } from 'preact';
import { irPara, useTela, type Tela } from './rotas';
import { MenuLateral } from './layout/MenuLateral';
import { PainelLateral } from './layout/PainelLateral';
import { BotaoNovo, type OpcaoNovo } from './layout/BotaoNovo';
import { AvisoAtualizacao } from './layout/AvisoAtualizacao';
import { AvisoDesfazer } from './componentes/AvisoDesfazer';
import { Dialogo } from './componentes/Dialogo';
import { ProvedorEstado, useEstado, type Painel } from './estado';
import { TelaLista } from './telas/TelaLista';
import { TelaCatalogo } from './telas/TelaCatalogo';
import { TelaAjustes } from './telas/TelaAjustes';
import { FormProduto } from './paineis/FormProduto';
import { FormCategoria } from './paineis/FormCategoria';
import { FormItemCompra } from './paineis/FormItemCompra';
import { IconeCesta } from './icones';

/** ► Nova tela: acrescente aqui (e em TELAS/MENU, em rotas.ts). */
const TELA: Record<Tela, () => JSX.Element> = {
  lista: TelaLista,
  catalogo: TelaCatalogo,
  config: TelaAjustes,
};

/** ► Novo painel: título e conteúdo de cada tipo declarado em estado.tsx. */
function tituloPainel(p: Painel): string {
  switch (p.tipo) {
    case 'produto':
      return p.id ? 'Produto' : 'Novo produto';
    case 'categoria':
      return p.id ? 'Categoria' : 'Nova categoria';
    case 'item':
      return 'Item da lista';
  }
}

function ConteudoPainel({ painel }: { painel: Painel }) {
  switch (painel.tipo) {
    case 'produto':
      return <FormProduto id={painel.id} nome={painel.nome} />;
    case 'categoria':
      return <FormCategoria id={painel.id} />;
    case 'item':
      return <FormItemCompra id={painel.id} foco={painel.foco} />;
  }
}

function Estrutura() {
  const tela = useTela();
  const { painel, abrirPainel, fecharPainel } = useEstado();
  const Conteudo = TELA[tela];

  /** ► Opções do botão "+" (com uma só, ele cria direto). */
  const opcoesNovo: Partial<Record<Tela, OpcaoNovo[]>> = {
    lista: [{ rotulo: 'Escolher produtos', Icone: IconeCesta, acao: () => irPara('catalogo') }],
    catalogo: [{ rotulo: 'Novo produto', Icone: IconeCesta, acao: () => abrirPainel({ tipo: 'produto' }) }],
  };
  const opcoes = opcoesNovo[tela];

  return (
    <div class="estrutura">
      <MenuLateral atual={tela} />
      <main class="principal">
        <Conteudo />
        {opcoes && <BotaoNovo opcoes={opcoes} />}
      </main>
      {painel && (
        <PainelLateral titulo={tituloPainel(painel)} aoFechar={fecharPainel}>
          <ConteudoPainel painel={painel} />
        </PainelLateral>
      )}
      <AvisoDesfazer />
      <AvisoAtualizacao />
      <Dialogo />
    </div>
  );
}

export function App() {
  return (
    <ProvedorEstado>
      <Estrutura />
    </ProvedorEstado>
  );
}
