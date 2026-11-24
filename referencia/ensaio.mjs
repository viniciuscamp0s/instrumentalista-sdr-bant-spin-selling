// MODO ENSAIO E /reset: testar o agente pelo próprio WhatsApp, quantas vezes quiser, sem tocar em lead real.
//
// - O agente nasce em ensaio: só responde aos números de teste cadastrados.
// - Um número de teste que manda "/reset" apaga a própria conversa (mensagens, etapa, BANT, tags, follow-up)
//   e o próximo "oi" começa do zero, como um lead novo.
// - Nenhum outro número tem reset. Número de teste que já é lead real é recusado no cadastro
//   (o reset apagaria um lead de verdade).
// - O número de teste nunca é o remetente dos avisos da empresa (o aviso viraria "mensagem do lead").

import { semAcento } from './texto.mjs';

/** Só dígitos: "+55 (DDD) 9XXXX-XXXX" vira só os números, sem espaço, parêntese nem traço. */
export function normalizarNumero(numero) {
  return String(numero ?? '').replace(/\D/gu, '');
}

/** O mesmo número com e sem o 9 extra do celular brasileiro casam. */
export function mesmoNumero(a, b) {
  const x = normalizarNumero(a);
  const y = normalizarNumero(b);
  if (!x || !y) return false;
  return x === y || x.slice(-8) === y.slice(-8);
}

export function ehNumeroDeTeste(numero, numerosDeTeste = []) {
  return numerosDeTeste.some((n) => mesmoNumero(n, numero));
}

/** "/reset" (com ou sem espaço, maiúscula ou acento em volta) é o comando. "/" sozinho também vale. */
export function ehComandoDeReset(texto) {
  const limpo = semAcento(texto).trim();
  return limpo === '/reset' || limpo === '/';
}

/**
 * Decide o que fazer com uma mensagem que chegou, do ponto de vista do ensaio.
 * @param {{texto:string, numero:string, modo:'ensaio'|'real', numerosDeTeste:string[]}} m
 * @returns {'resetar' | 'atender' | 'ignorar'}
 *   resetar: apague a conversa deste número (e não responda nada, ou responda a confirmação curta)
 *   atender: siga o fluxo normal do agente
 *   ignorar: modo ensaio e o número não é de teste (lead real não recebe resposta do agente em ensaio)
 */
export function decidirNoEnsaio({ texto, numero, modo, numerosDeTeste = [] }) {
  const deTeste = ehNumeroDeTeste(numero, numerosDeTeste);
  if (deTeste && ehComandoDeReset(texto)) return 'resetar';
  if (modo === 'ensaio' && !deTeste) return 'ignorar';
  return 'atender';
}

/** Confirmação curta depois do reset (não passa pela IA). */
export const CONFIRMACAO_DO_RESET = 'Conversa de teste apagada. Mande uma mensagem como se fosse um lead novo.';
