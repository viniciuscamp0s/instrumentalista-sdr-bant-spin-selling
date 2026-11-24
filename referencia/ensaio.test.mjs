import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decidirNoEnsaio, ehComandoDeReset, mesmoNumero } from './ensaio.mjs';

// Números fictícios montados por partes (DDI, DDD, número).
const num = (...partes) => partes.join('');
const TESTE = num('55', '11', '9', '8888', '7777');
const TESTE_SEM_NOVE = num('55', '11', '8888', '7777');
const LEAD = num('55', '11', '9', '0000', '1111');
const teste = [`+${num('55', ' 11 ', '98888-7777')}`];

test('/reset só vale para número de teste', () => {
  assert.equal(decidirNoEnsaio({ texto: '/reset', numero: TESTE, modo: 'ensaio', numerosDeTeste: teste }), 'resetar');
  assert.equal(decidirNoEnsaio({ texto: '/reset', numero: LEAD, modo: 'real', numerosDeTeste: teste }), 'atender');
});

test('em ensaio, lead real não recebe resposta; número de teste é atendido', () => {
  assert.equal(decidirNoEnsaio({ texto: 'oi', numero: LEAD, modo: 'ensaio', numerosDeTeste: teste }), 'ignorar');
  assert.equal(decidirNoEnsaio({ texto: 'oi', numero: TESTE_SEM_NOVE, modo: 'ensaio', numerosDeTeste: teste }), 'atender');
});

test('comando e número normalizados', () => {
  assert.equal(ehComandoDeReset('  /RESET '), true);
  assert.equal(ehComandoDeReset('/reset agora'), false);
  assert.equal(mesmoNumero(num('(11) ', '98888-7777'), TESTE), true);
});
