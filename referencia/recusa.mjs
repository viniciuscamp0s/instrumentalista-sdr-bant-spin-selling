// RECUSA E PEDIDO PARA SAIR, por palavras, sem IA (custo zero).
// Quem recusou de forma explícita vai para PERDIDO na hora e nunca mais gasta IA nem recebe follow-up.
//
// Três cuidados que vieram de erro real:
// 1. Preço, dúvida e curiosidade NUNCA são recusa ("de onde tirou meu número? quanto custa?" é interesse).
// 2. O "não" curto no meio da conversa costuma responder a uma pergunta de qualificação
//    ("não, é a primeira vez") e não é recusa. Ele só vale como recusa em resposta a um toque de
//    follow-up ou à primeira mensagem de prospecção.
// 3. Na dúvida, deixe passar: o agente e o humano ainda veem a conversa. Marcar PERDIDO por engano é pior.

import { semAcento } from './texto.mjs';

export const ROTULO_DA_RECUSA = {
  pediu_para_sair: 'pediu para sair da lista',
  sem_interesse: 'sem interesse',
  nao_reconhece_o_contato: 'não reconheceu o contato',
};

const NUNCA_RECUSA = [
  /\bquant[oa]s?\b/u, /\bvalor/u, /\bprec[oi]/u, /\bcust[ao]/u, /\binvestimento\b/u,
  /\bcomo\s+(?:funciona|e|seria|assim|faz|faco)\b/u, /\bo\s+que\s+(?:e|seria|voces?|vcs?)\b/u,
  /\bexplic/u, /\binformac/u, /\bdetalhe/u, /\bsaber\s+mais\b/u, /\bconhecer\b/u, /\blink\b/u,
  /\bduvida/u, /\bhorario/u, /\bquando\b/u, /\bonde\b/u, /\bqual\b/u,
  /\bpode\s+(?:me\s+)?(?:mandar|enviar|falar|explicar|contar)\b/u,
  /(?<!\bnao\s)\b(?:tenho|tem|temos)\s+interesse\b/u,
];

const SAIR = [
  /\b(?:para|pare|parar)\s+de\s+(?:me\s+)?(?:mandar|enviar|escrever|falar|chamar|insistir|incomodar)\b/u,
  /\bnao\s+(?:quero|desejo)\s+(?:mais\s+)?(?:receber\s+(?:mais\s+)?(?:mensage|isso|nada|contato|propaganda)|mensage|contato|ser\s+contatad[oa])/u,
  /\bme\s+(?:tire|tira|remova|remove|exclua|exclui|retire|retira)\s+(?:daqui\b|(?:d[aeo]s?|dessa|desse|desta|deste)\s+(?:lista|grupo|contatos?|cadastro|base|numeros?)\b)/u,
  /\bme\s+deix[ae]\s+em\s+paz\b/u,
  /\b(?:quero|queria|preciso)\s+sair\s+(?:d[aeo]s?|dessa|desse|desta|deste)\s+(?:lista|grupo|contatos?|cadastro)\b/u,
  /\bsair\s+da\s+lista\b/u, /\bdescadastr/u,
  /\b(?:isso|isto|voce|voces|vc|vcs)\s+(?:e|eh|sao)\s+spam\b/u, /\bcomo\s+spam\b/u, /^\s*spam\s*[.!]*\s*$/u,
  /\bvou\s+(?:te\s+|lhe\s+)?denunciar\b/u, /\b(?:vou\s+(?:te\s+)?|te\s+)bloque(?:ar|ando)\b/u,
  /\bchega\s+de\s+mensage/u, /^\s*(?:pare|parar|para|stop|sair|cancelar)\s*[.!]*\s*$/u,
];

const SEM_INTERESSE = [/\bnao\s+(?:tenho|temos|tenho\s+mais)\s+interesse\b/u, /\bsem\s+interesse\b/u, /\bnao\s+me\s+interess/u];

// Só valem em resposta a um toque de follow-up ou à primeira mensagem de prospecção.
const SEM_INTERESSE_AO_TOQUE = [
  /\bnao\s+(?:quero|preciso)(?:\s+(?:mais|nada)\b|\s*(?:[.!,]|$))/u,
  /\bnao\s+faz\s+sentido\b/u,
  /\bnao\s+e\s+(?:o\s+)?(?:meu\s+)?momento\b/u,
  /^\s*agora\s+nao[\s,.!]*(?:obrigad[oa])?[\s.!]*$/u,
  /^\s*nao[\s,.!]+obrigad[oa]\b/u,
  /^\s*obrigad[oa][\s,.!]+(?:mas\s+)?nao\b/u,
];

const NAO_SOLTO = /^\s*nao\s*[.!]*\s*$/u;

const NAO_RECONHECE = [
  /\bquem\s+(?:te|lhe|vos|voce|vc)?\s*(?:deu|passou)\s+(?:o\s+)?meu\s+(?:numero|contato|telefone|whats)/u,
  /\bde\s+onde\s+(?:voce|vc|voces|vcs)?\s*(?:tirou|pegou|conseguiu)\s+(?:o\s+)?meu\s+(?:numero|contato|telefone)/u,
  /\bcomo\s+(?:voce|vc|voces|vcs)\s+(?:conseguiu|conseguiram|pegou|pegaram)\s+(?:o\s+)?meu\s+(?:numero|contato)/u,
  /\bnao\s+me\s+cadastrei\b/u, /\bnao\s+(?:fiz|preenchi)\s+(?:nenhum\s+)?cadastro\b/u, /\bnao\s+(?:te|lhe|vos)\s+conheco\b/u,
];

/** Pedido explícito para não receber mais nada. */
export function pediuParaSair(texto) {
  const limpo = semAcento(texto).trim();
  return limpo !== '' && SAIR.some((p) => p.test(limpo));
}

/**
 * @param {string} texto  mensagem de TEXTO do lead (áudio só depois de transcrito; legenda de arquivo não conta)
 * @param {{primeiraResposta?: boolean, aoToque?: boolean}} [opcoes]
 *   primeiraResposta: responde à primeira mensagem de prospecção (o "não" solto vale)
 *   aoToque: responde a um toque de follow-up ("agora não", "não, obrigado" valem; o "não" solto não)
 * @returns {{recusa: false} | {recusa: true, motivo: keyof ROTULO_DA_RECUSA}}
 */
export function classificarResposta(texto, opcoes = {}) {
  const limpo = semAcento(texto).trim();
  if (limpo === '') return { recusa: false };
  const reconhece = NAO_RECONHECE.find((p) => p.test(limpo));
  if (reconhece) {
    const resto = limpo.replace(reconhece, ' ');
    if (NUNCA_RECUSA.some((p) => p.test(resto))) return { recusa: false };
    return { recusa: true, motivo: 'nao_reconhece_o_contato' };
  }
  if (NUNCA_RECUSA.some((p) => p.test(limpo))) return { recusa: false };
  if (pediuParaSair(texto)) return { recusa: true, motivo: 'pediu_para_sair' };
  if (SEM_INTERESSE.some((p) => p.test(limpo))) return { recusa: true, motivo: 'sem_interesse' };
  if ((opcoes.primeiraResposta || opcoes.aoToque) && SEM_INTERESSE_AO_TOQUE.some((p) => p.test(limpo))) {
    return { recusa: true, motivo: 'sem_interesse' };
  }
  if (opcoes.primeiraResposta && NAO_SOLTO.test(limpo)) return { recusa: true, motivo: 'sem_interesse' };
  return { recusa: false };
}
