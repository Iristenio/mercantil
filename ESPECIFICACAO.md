# Lista de Compras (Mercantil) — Especificação

App **só para celular**, funciona **sem internet** (dentro do mercado o sinal costuma ser ruim) e
sincroniza com uma planilha do Google (conta pessoal) quando há conexão.

Baseado no sistema atual em Apps Script (planilha **COMPRAS**, 74 produtos em 5 categorias), que tem três telas:
**Catálogo → Montagem da lista → Modo compras**. A ideia é manter esse fluxo, que já funciona, e
deixá-lo mais rápido e confiável no celular.

---

## 1. Entidades (o que o app guarda)

Todas têm também `id`, `criado_em`, `atualizado_em` (padrão da base).

### Categoria
| Campo | Exemplo | Observação |
|---|---|---|
| nome | Laticínios | único (sem diferenciar maiúsculas) |
| ordem | 2 | ordem de exibição — idealmente a **ordem dos corredores** do mercado |
| status | ativo / excluido | exclusão lógica |

### Produto (catálogo)
| Campo | Exemplo | Observação |
|---|---|---|
| nome | Café Tradicional | único |
| categoria_id | → Mercearia | |
| unidade | Pacote | Un, Kg, g, L, ml, Dz, Pacote, Caixa |
| ultimo_preco | 29,99 | preço unitário da última compra finalizada |
| data_ultimo_preco | 2026-08-31 | |
| status | ativo / excluido | |

### Compra (uma lista)
| Campo | Exemplo | Observação |
|---|---|---|
| status | planejada · em_andamento · finalizada · cancelada | |
| data_inicio | quando foi ao mercado | |
| data_finalizacao | 2026-08-31 | |
| valor_previsto | 4,39 | congelado ao "Ir às compras" |
| valor_real | 314,52 | soma dos itens comprados |

### Item da compra
| Campo | Exemplo | Observação |
|---|---|---|
| compra_id | → compra | |
| produto_id | → produto | |
| quantidade | 0,5 | aceita decimais (kg) |
| preco | 8,29 | preço unitário; vem sugerido do `ultimo_preco` |
| status | pendente · comprado · indisponivel | |

---

## 2. Regras de negócio

- **R1** — Existe **no máximo uma compra ativa** (planejada ou em andamento) por vez.
- **R2** — Criar nova lista com outra ativa: perguntar **Ir para a lista atual / Adicionar à atual /
  Começar nova** (a antiga vira *cancelada*, sem apagar).
- **R3** — Ao entrar na lista, o item já vem com o **último preço** do produto (se houver).
- **R4** — **Valor previsto** = soma de quantidade × preço de todos os itens. Recalcula durante a
  montagem; **congela** ao tocar em "Ir às compras".
- **R5** — **Valor real** = soma de quantidade × preço **só dos itens comprados**. Atualiza na hora.
- **R6** — Real acima do previsto → destaque em vermelho.
- **R7** — Item **indisponível** fica tachado, continua na lista e não entra no total.
- **R8** — Durante a compra dá para **acrescentar item esquecido** (do catálogo ou produto novo).
- **R9** — **Encerrar compra**: grava o preço de cada item comprado como `ultimo_preco` do produto e
  marca a compra como finalizada. Se ainda houver itens pendentes, avisar antes.
- **R10** — Nomes de produto e categoria são **únicos**; categoria nova é criada ao digitar no
  cadastro do produto.
- **R11** — Nada é apagado sem volta: exclusão lógica + **Desfazer**.
- **R12** — Ordem da lista: por **categoria (ordem)** e, dentro dela, por nome.

---

## 3. Telas (celular, menu no rodapé)

1. **Lista** (tela principal) — mostra a compra ativa:
   - *Montagem*: itens por categoria, quantidade com botões − / +, remover, total previsto,
     botão **Ir às compras**.
   - *No mercado*: barra fixa no topo com **Real × Previsto**; cada item com um toque para
     marcar **comprado**; toque no preço/quantidade para ajustar; deslizar ou botão para
     **indisponível**; busca; **+ item esquecido**; **Encerrar** / **Cancelar**.
   - Sem lista ativa: botão **Nova lista**.
2. **Catálogo** — produtos por categoria, com busca; toque adiciona/remove da lista (selo com a
   quantidade já na lista); **+ Produto**.
3. **Histórico** — compras finalizadas: data, total, itens; abrir para ver detalhes.
4. **Ajustes** — sincronização (padrão da base), categorias (renomear, reordenar), unidades.

---

## 4. Dados atuais

A planilha nova do app será criada pelo próprio app (padrão da base). Da planilha **COMPRAS**
serão **importados uma vez só os produtos e as categorias** (com último preço e data). O histórico
de compras antigo não vem; a planilha antiga fica guardada como está.

---

## 5. Decisões (27/09/2026)

- **D1** — Importar só produtos e categorias (seção 4).
- **D2** — Produto repetido na lista **cria outra linha** (como no sistema atual). O catálogo mostra
  o selo com quantas vezes o produto já está na lista.
- **D3** — **Histórico de preços**: ao informar o preço de um item, o app mostra a variação em
  relação à última compra (▲ subiu / ▼ caiu, em R$ e %). No produto, dá para ver os preços das
  compras anteriores (a partir das compras feitas no app novo; antes disso, só o último preço importado).
- **D4** — **Lista rápida**: botão "Repetir a última compra" que monta uma lista nova com os mesmos
  produtos e quantidades da última compra finalizada (todos como pendentes, com preços atualizados).
- Fora por enquanto: orçamento limite e uso simultâneo em dois celulares (a sincronização já permite
  usar em outro aparelho, mas sem pensar em duas pessoas marcando ao mesmo tempo).
