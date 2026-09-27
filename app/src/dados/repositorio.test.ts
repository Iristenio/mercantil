import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { abrirBanco, fecharBanco, NOME_BANCO } from './db';
import { garantirDadosIniciais, gravar, listarTodos, salvar } from './repositorio';
import { PRODUTOS_INICIAIS } from './semente';
import { novoProduto } from '../dominio/catalogo';

beforeEach(async () => {
  await fecharBanco();
  await new Promise<void>((ok) => {
    const req = indexedDB.deleteDatabase(NOME_BANCO);
    req.onsuccess = req.onerror = req.onblocked = () => ok();
  });
});

const fila = async () => (await abrirBanco()).getAll('fila_sync');

describe('repositório local', () => {
  it('grava e coloca na fila como "criar"', async () => {
    await salvar('produtos', novoProduto({ id: 'a', nome: 'Primeiro' }));
    const itens = await fila();
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({ entidade: 'produtos', registro_id: 'a', operacao: 'criar' });
  });

  it('compacta alterações seguidas e mantém "criar" enquanto não sincronizar', async () => {
    const i = novoProduto({ id: 'a', nome: 'v1' });
    await salvar('produtos', i);
    await salvar('produtos', { ...i, nome: 'v2' });
    await gravar([{ entidade: 'produtos', registro: { ...i, nome: 'v3', status: 'excluido' }, operacao: 'excluir' }]);
    const itens = await fila();
    expect(itens).toHaveLength(1);
    expect(itens[0].operacao).toBe('criar');
    expect((itens[0].payload as unknown as { nome: string }).nome).toBe('v3');
  });

  it('preserva criado_em, atualiza atualizado_em e devolve a versão anterior (para Desfazer)', async () => {
    const i = novoProduto({ id: 'a', nome: 'v1' }, new Date('2026-01-01T10:00:00Z'));
    await salvar('produtos', i);
    const anterior = await salvar('produtos', { ...i, nome: 'v2', criado_em: 'lixo' });
    expect(anterior?.nome).toBe('v1');
    const [salvo] = await listarTodos('produtos');
    expect(salvo.criado_em).toBe(i.criado_em);
    expect(salvo.atualizado_em).not.toBe(i.atualizado_em);
  });

  it('carrega o catálogo inicial uma única vez, sem duplicar nem desfazer edições', async () => {
    await garantirDadosIniciais();
    expect(await listarTodos('produtos')).toHaveLength(74);
    expect(await listarTodos('categorias')).toHaveLength(5);
    expect(await fila()).toHaveLength(79);

    const arroz = PRODUTOS_INICIAIS[0];
    await salvar('produtos', { ...arroz, nome: 'Arroz Tipo 1' });
    await garantirDadosIniciais();
    expect((await listarTodos('produtos')).find((p) => p.id === arroz.id)?.nome).toBe('Arroz Tipo 1');
    expect(await listarTodos('produtos')).toHaveLength(74);
  });
});
