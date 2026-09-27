// Entidades do app.
// Datas: "AAAA-MM-DD" (data), "HH:mm" (hora) e ISO completo (carimbos de data-hora).
//
// ► Para criar uma entidade nova, siga o roteiro em ARQUITETURA.md ("Adicionar uma entidade").

export type Id = string;

/** Campos que TODA entidade sincronizada precisa ter. */
export interface Registro {
  id: Id;
  criado_em: string;
  atualizado_em: string;
}

/* ---------------- Catálogo ---------------- */

export type StatusCadastro = 'ativo' | 'excluido';

export interface Categoria extends Registro {
  nome: string;
  /** Ordem de exibição (idealmente a ordem dos corredores do mercado). */
  ordem: number;
  status: StatusCadastro;
}

export const UNIDADES = ['Un', 'Kg', 'g', 'L', 'ml', 'Dz', 'Pacote', 'Caixa'] as const;

export interface Produto extends Registro {
  nome: string;
  categoria_id: Id;
  unidade: string;
  /** Preço unitário da última compra finalizada. */
  ultimo_preco: number | null;
  data_ultimo_preco: string | null; // AAAA-MM-DD
  status: StatusCadastro;
}

/* ---------------- Compras ---------------- */

export type StatusCompra = 'planejada' | 'em_andamento' | 'finalizada' | 'cancelada';

/** Uma lista de compras. No máximo uma fica ativa (planejada ou em andamento) — R1. */
export interface Compra extends Registro {
  status: StatusCompra;
  /** Quando tocou em "Ir às compras" (ISO). */
  data_inicio: string | null;
  data_finalizacao: string | null; // ISO
  /** Congelado ao ir às compras (R4); antes disso é calculado na hora. */
  valor_previsto: number;
  /** Gravado ao encerrar (R5); durante a compra é calculado na hora. */
  valor_real: number;
}

export type StatusItemCompra = 'pendente' | 'comprado' | 'indisponivel' | 'excluido';

export interface ItemCompra extends Registro {
  compra_id: Id;
  produto_id: Id;
  quantidade: number;
  /** Preço unitário; vem sugerido do último preço do produto (R3). */
  preco: number | null;
  status: StatusItemCompra;
}

/** Nomes das entidades sincronizadas (cada uma vira uma loja local e uma aba na planilha). */
export const ENTIDADES = ['categorias', 'produtos', 'compras', 'itens_compra'] as const;
export type Entidade = (typeof ENTIDADES)[number];

/* ---------------- Infraestrutura ---------------- */

export interface ItemFila {
  id: Id;
  entidade: Entidade;
  registro_id: Id;
  operacao: 'criar' | 'alterar' | 'excluir';
  payload: Registro;
  tentativas: number;
  ultimo_erro: string | null;
  criado_em: string;
}

/** Preferências do usuário (valem por aparelho). */
export interface Config {
  primeiro_dia_semana: 0 | 1; // 0 = domingo, 1 = segunda
}

export const CONFIG_PADRAO: Config = {
  primeiro_dia_semana: 0,
};
