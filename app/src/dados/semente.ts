// Catálogo inicial, importado da planilha antiga "COMPRAS" (abas Categorias e Produtos) em 27/09/2026.
// Os ids são os MESMOS da planilha antiga — assim o catálogo não duplica ao restaurar ou ao
// abrir o app em outro aparelho.
import type { Categoria, Produto } from '../dominio/tipos';

/** Carimbo antigo: qualquer alteração feita depois (neste ou em outro aparelho) tem prioridade. */
export const CARIMBO_SEMENTE = '2026-08-31T00:00:00.000Z';
const DATA_PRECOS = '2026-08-31';

const CATEGORIAS: [id: string, nome: string, ordem: number][] = [
  ['CAT-1787741117464-181', 'Mercearia', 1],
  ['CAT-1787741718475-349', 'Laticínios', 2],
  ['CAT-1787741880075-732', 'Limpeza', 3],
  ['CAT-1787741926995-773', 'Higiene Pessoal', 4],
  ['CAT-1787759989028-83', 'Proteínas', 5],
];

const CAT = { M: CATEGORIAS[0][0], L: CATEGORIAS[1][0], Z: CATEGORIAS[2][0], H: CATEGORIAS[3][0], P: CATEGORIAS[4][0] };

const PRODUTOS: [id: string, nome: string, categoria: keyof typeof CAT, unidade: string, preco?: number][] = [
  ['PRD-1787741117888-784', 'Arroz', 'M', 'Kg', 4.59],
  ['PRD-1787741139755-253', 'Feijão', 'M', 'Kg'],
  ['PRD-1787741162841-240', 'Macarrão', 'M', 'Pacote'],
  ['PRD-1787741176336-65', 'Farinha', 'M', 'Kg'],
  ['PRD-1787741236882-529', 'Açúcar', 'M', 'Kg', 4.39],
  ['PRD-1787741264357-903', 'Adoçante', 'M', 'Un'],
  ['PRD-1787741296410-911', 'Amido de Milho', 'M', 'Un'],
  ['PRD-1787741313075-868', 'Café Instantâneo', 'M', 'Pacote'],
  ['PRD-1787741338080-402', 'Café Tradicional', 'M', 'Pacote', 29.99],
  ['PRD-1787741356343-504', 'Capuccino', 'M', 'Un', 17],
  ['PRD-1787741373893-902', 'Bolacha Cream Cracker', 'M', 'Pacote'],
  ['PRD-1787741387753-217', 'Creme de Leite', 'L', 'Caixa'],
  ['PRD-1787741397294-60', 'Leite Condensado', 'L', 'Caixa'],
  ['PRD-1787741408798-100', 'Farinha de Trigo', 'M', 'Kg'],
  ['PRD-1787741418602-641', 'Feijão Carioca', 'M', 'Kg'],
  ['PRD-1787741427185-56', 'Feijão Preto', 'M', 'Kg'],
  ['PRD-1787741442849-633', 'Feijão de Corda', 'M', 'Kg'],
  ['PRD-1787741453884-472', 'Fermento', 'M', 'Un'],
  ['PRD-1787741470043-649', 'Goma de Tapioca', 'M', 'Kg'],
  ['PRD-1787741481709-657', 'Leite em Pó integral', 'L', 'Pacote'],
  ['PRD-1787741497644-398', 'Leite em Pó Desnatado', 'L', 'Kg', 8.29],
  ['PRD-1787741511263-527', 'Leite Integral - Caixa', 'L', 'L', 8],
  ['PRD-1787741522653-475', 'Leite Desnatado - Caixa', 'L', 'L'],
  ['PRD-1787741536720-589', 'Maionese', 'M', 'Un'],
  ['PRD-1787741561988-931', 'Margarina', 'M', 'Un'],
  ['PRD-1787741585891-528', 'Milho Pipoca', 'M', 'Pacote'],
  ['PRD-1787741600566-833', 'Ovos', 'M', 'Un', 18],
  ['PRD-1787741616908-29', 'Biscoito Recheado - Tipo 1', 'M', 'Pacote'],
  ['PRD-1787741644969-65', 'Refrigerante', 'M', 'Un', 1],
  ['PRD-1787741655426-51', 'Sal', 'M', 'Kg'],
  ['PRD-1787741665163-579', 'Vitamilho', 'M', 'Pacote'],
  ['PRD-1787741680664-297', 'Pão de Forma', 'M', 'Pacote'],
  ['PRD-1787741692104-703', 'Pão de Hamburguer', 'M', 'Pacote'],
  ['PRD-1787741718687-140', 'Iogurte natural', 'L', 'Un'],
  ['PRD-1787741735470-523', 'Requeijão', 'L', 'Un'],
  ['PRD-1787741880331-7', 'Desinfetante 2L', 'Z', 'Un', 20],
  ['PRD-1787741897272-510', 'Sabão em Pó', 'Z', 'Pacote', 2.7],
  ['PRD-1787741927382-321', 'Barbeador', 'H', 'Un'],
  ['PRD-1787741946942-977', 'Condicionador', 'H', 'Un'],
  ['PRD-1787741957165-449', 'Cotonete', 'H', 'Un'],
  ['PRD-1787741967679-617', 'Creme Dental', 'H', 'Un'],
  ['PRD-1787741977505-467', 'Desodorante', 'H', 'Un'],
  ['PRD-1787741987083-28', 'Escova de Dentes', 'H', 'Un'],
  ['PRD-1787742007468-590', 'Papel Higiênico', 'H', 'Pacote'],
  ['PRD-1787759989276-822', 'Patinho em Bife', 'P', 'Kg'],
  ['PRD-1787760944076-147', 'Vinagre', 'M', 'Un'],
  ['PRD-1787760972640-865', 'Azeite de oliva', 'M', 'Un'],
  ['PRD-1787761030758-638', 'Tempero', 'M', 'Un'],
  ['PRD-1787761050015-582', 'Páprica Doce', 'M', 'Un'],
  ['PRD-1787761062057-818', 'Páprica Picante', 'M', 'Un'],
  ['PRD-1787761087436-152', 'Queijo Mussarela', 'L', 'Kg'],
  ['PRD-1787761111801-214', 'Queijo Qualho', 'L', 'Kg'],
  ['PRD-1787761180496-756', 'Sabão Líquido', 'Z', 'Un', 30],
  ['PRD-1787761199611-105', 'Amaciante', 'Z', 'Un', 12],
  ['PRD-1787761245380-455', 'Água Sanitária', 'Z', 'L'],
  ['PRD-1787761279741-100', 'Carne Moída', 'P', 'Kg'],
  ['PRD-1787761304409-593', 'Bisteca Suína', 'P', 'Kg'],
  ['PRD-1787761325321-437', 'Linguiça', 'P', 'Kg'],
  ['PRD-1787761359419-994', 'Peito de Frango', 'P', 'Kg'],
  ['PRD-1787761400862-51', 'Xampu', 'H', 'Un'],
  ['PRD-1787761465013-409', 'Saco 30L Lixo', 'Z', 'Pacote'],
  ['PRD-1787761480555-152', 'Saco 50L', 'Z', 'Pacote'],
  ['PRD-1787761510599-417', 'Saco 100L Lixo', 'Z', 'Pacote'],
  ['PRD-1787761527317-211', 'Pano de Chão', 'Z', 'Un', 12],
  ['PRD-1787761568891-450', 'Saco Pia Lixo', 'Z', 'Pacote'],
  ['PRD-1787761654539-183', 'Saco 15L Lixo', 'Z', 'Pacote'],
  ['PRD-1787780198827-116', 'Detergente', 'Z', 'Un'],
  ['PRD-1787780289697-897', 'Mingau massa', 'M', 'Un'],
  ['PRD-1787949688440-419', 'Inseticida', 'Z', 'Un', 20],
  ['PRD-1788079734299-328', 'Bombril', 'Z', 'Pacote', 3],
  ['PRD-1788079756544-297', 'Esponja', 'Z', 'Pacote'],
  ['PRD-1788079780330-512', 'Sabão em barra', 'Z', 'Un'],
  ['PRD-1788197686792-199', 'Creme d pentear', 'H', 'Un', 20],
  ['PRD-1788197851858-219', 'Chás diversos', 'M', 'Caixa', 25],
];

const carimbos = { criado_em: CARIMBO_SEMENTE, atualizado_em: CARIMBO_SEMENTE };

export const CATEGORIAS_INICIAIS: Categoria[] = CATEGORIAS.map(([id, nome, ordem]) => ({ id, nome, ordem, status: 'ativo', ...carimbos }));

export const PRODUTOS_INICIAIS: Produto[] = PRODUTOS.map(([id, nome, c, unidade, preco]) => ({
  id,
  nome,
  categoria_id: CAT[c],
  unidade,
  ultimo_preco: preco ?? null,
  data_ultimo_preco: preco !== undefined ? DATA_PRECOS : null,
  status: 'ativo',
  ...carimbos,
}));
