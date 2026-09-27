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

/** Nomes das entidades sincronizadas (cada uma vira uma loja local e uma aba na planilha). */
export const ENTIDADES = ['categorias', 'produtos'] as const;
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
