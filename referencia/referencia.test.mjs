// Cada teste aqui é um erro que um agente de verdade cometeu em produção. Rode: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { conferirResposta, respondeANossaPergunta } from './conferencia.mjs';
import { classificarResposta, pediuParaSair } from './recusa.mjs';
import { classificacao, mesclarBant, mesclarTags, primeiroNome, proximaEtapa } from './regras.mjs';
import { digitandoMs, horaDeResponder, respostaFicouVelha } from './ritmo.mjs';

const ctx = { linksPermitidos: ['https://exemplo.com/agenda'], valoresPermitidos: ['R$ 497,00'] };

test('respondeu a pergunta do nosso lado como se fosse o lead', () => {
  assert.equal(respondeANossaPergunta('Ajuda sim.', 'Isso já ajuda a entender melhor?'), true);
  assert.equal(respondeANossaPergunta('Sim', 'Isso já ajuda a entender melhor?'), false);
  const erros = conferirResposta(['Ajuda sim.', 'Qual é o seu nome?'], { ...ctx, perguntaNossa: 'Isso já ajuda a entender melhor?' });
  assert.ok(erros.some((e) => e.includes('pergunta do nosso lado')));
});

test('link e valor inventados não saem', () => {
  assert.ok(conferirResposta(['Fecha por R$ 399,00 hoje'], ctx).some((e) => e.includes('valor')));
  assert.ok(conferirResposta(['Veja em outrosite.com.br'], ctx).some((e) => e.includes('link')));
  assert.deepEqual(conferirResposta(['O investimento é R$ 497,00', 'Agende em exemplo.com/agenda/'], ctx), []);
});

test('forma: no máximo 4 mensagens, 300 caracteres, sem vazia, sem pontuação de robô, sem desculpa', () => {
  assert.ok(conferirResposta(['a', 'b', 'c', 'd', 'e'], ctx).length > 0);
  assert.ok(conferirResposta(['x'.repeat(301)], ctx).length > 0);
  assert.ok(conferirResposta([' / '], ctx).some((e) => e.includes('vazia')));
  assert.ok(conferirResposta(['Claro — vamos lá'], ctx).some((e) => e.includes('travessão')));
  assert.ok(conferirResposta(['Entendi... então'], ctx).some((e) => e.includes('reticências')));
  assert.ok(conferirResposta(['Desculpa a demora!'], ctx).some((e) => e.includes('desculpa')));
  assert.ok(conferirResposta(['Fico à disposição'], ctx).some((e) => e.includes('proibida')));
});

test('follow-up não cita preço e não repete o toque anterior', () => {
  const fu = { ...ctx, followUp: { toquesAnteriores: ['Oi, conseguiu ver minha mensagem?'] } };
  assert.ok(conferirResposta(['Oi, conseguiu ver minha mensagem'], fu).some((e) => e.includes('repete')));
  assert.ok(conferirResposta(['Sai por R$ 497,00'], fu).some((e) => e.includes('follow-up')));
});

test('preço, dúvida e curiosidade nunca são recusa', () => {
  assert.equal(classificarResposta('De onde tirou meu número? Quanto custa?').recusa, false);
  assert.equal(classificarResposta('me tira uma dúvida').recusa, false);
  assert.equal(classificarResposta('Não, é a primeira vez').recusa, false);
  assert.equal(classificarResposta('não preciso, já comecei').recusa, false);
});

test('recusa explícita vira PERDIDO; o "não" solto só vale na primeira mensagem de prospecção', () => {
  assert.deepEqual(classificarResposta('não tenho interesse'), { recusa: true, motivo: 'sem_interesse' });
  assert.deepEqual(classificarResposta('me tira dessa lista'), { recusa: true, motivo: 'pediu_para_sair' });
  assert.equal(classificarResposta('agora não, obrigado').recusa, false);
  assert.equal(classificarResposta('agora não, obrigado', { aoToque: true }).recusa, true);
  assert.equal(classificarResposta('não', { aoToque: true }).recusa, false);
  assert.equal(classificarResposta('não', { primeiraResposta: true }).recusa, true);
  assert.equal(pediuParaSair('pode sair hoje?'), false);
});

test('etapa só anda para a frente; ganho não é do agente', () => {
  assert.equal(proximaEtapa('qualificacao', 'conexao'), 'qualificacao');
  assert.equal(proximaEtapa('conexao', 'proposta'), 'proposta');
  assert.equal(proximaEtapa('proposta', 'ganho'), 'proposta');
  assert.equal(proximaEtapa('qualificacao', 'perdido'), 'perdido');
  assert.equal(proximaEtapa('perdido', 'conexao'), 'perdido');
});

test('BANT: nulo não apaga; SQL só com os 4', () => {
  const b = mesclarBant({ orcamento: true, decisor: null, necessidade: true, prazo: null }, { decisor: true, orcamento: null });
  assert.deepEqual(b, { orcamento: true, decisor: true, necessidade: true, prazo: null });
  assert.equal(classificacao(b), 'MQL');
  assert.equal(classificacao({ ...b, prazo: true }), 'SQL');
});

test('tag posta por pessoa não é trocada; objeções acumulam', () => {
  const t = mesclarTags([{ grupo: 'orcamento', valor: 'alto', autor: 'humano' }], [
    { grupo: 'orcamento', valor: 'baixo' },
    { grupo: 'objecao', valor: 'preço' },
    { grupo: 'objecao', valor: 'tempo' },
  ]);
  assert.equal(t.find((x) => x.grupo === 'orcamento').valor, 'alto');
  assert.equal(t.filter((x) => x.grupo === 'objecao').length, 2);
});

test('nome do lead só o que ele escreveu, limpo', () => {
  assert.equal(primeiroNome('ana paula'), 'Ana');
  assert.equal(primeiroNome('🔥Bia🔥'), null);
  assert.equal(primeiroNome(null), null);
});

test('uma resposta por rajada: primeira imediata, depois espera 8 s', () => {
  const agora = 1_000_000;
  assert.deepEqual(horaDeResponder({ mensagens: [{ autor: 'lead', em: agora }], agora }), { responder: true });
  const conversa = [{ autor: 'lead', em: agora - 60_000 }, { autor: 'agente', em: agora - 50_000 }, { autor: 'lead', em: agora - 3_000 }];
  assert.equal(horaDeResponder({ mensagens: conversa, agora }).motivo, 'juntando_mensagens');
  assert.equal(horaDeResponder({ mensagens: conversa, agora: agora + 6_000 }).responder, true);
});

test('envio que falhou não conta como resposta; fala do humano não é pergunta', () => {
  const agora = 1_000_000;
  const falhou = [{ autor: 'lead', em: agora - 20_000 }, { autor: 'agente', em: agora - 15_000, falhou: true }];
  assert.equal(horaDeResponder({ mensagens: falhou, agora }).responder, true);
  const humano = [{ autor: 'lead', em: agora - 20_000 }, { autor: 'humano', em: agora - 15_000 }];
  assert.equal(horaDeResponder({ mensagens: humano, agora }).motivo, 'sem_pergunta');
});

test('resposta gerada fica velha se o lead escreveu de novo', () => {
  const a = { idUltimaDoLead: 'm1', agenteAtivo: true, etapa: 'conexao', falasDoHumano: 0 };
  assert.equal(respostaFicouVelha(a, { ...a, idUltimaDoLead: 'm2' }), true);
  assert.equal(respostaFicouVelha(a, { ...a }), false);
  assert.equal(digitandoMs('oi'), 1_200);
});
