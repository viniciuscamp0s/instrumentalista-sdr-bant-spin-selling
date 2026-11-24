// CONFERÊNCIA DA RESPOSTA: roda DEPOIS que a IA escreve e ANTES de enviar ao lead.
// Pura e sem IA. Devolve a lista de erros em português; esses mesmos erros voltam para a IA
// como instrução numa segunda (e última) tentativa. Reprovou duas vezes: não envia, passa ao humano.
//
// Por que existe: tudo que o modelo "não pode fazer" e só estava escrito no prompt, ele fez um dia.
// Regra derivada: o que é proibido tem trava no código, não só no prompt. (docs/05-erros-que-ja-cometemos.md)

import { normalizarValor, paraComparar, semAcento } from './texto.mjs';

export const MAX_BOLHAS = 4;
export const MAX_CARACTERES_DA_BOLHA = 300;

/** Expressões que soam como robô ou como desinteresse. Ajuste à sua marca, mas mantenha a lista curta. */
export const FRASES_PROIBIDAS = ['sem pressa', 'fico a disposicao', 'quando puder', 'quando quiser'];

// Link com protocolo, com "www." ou endereço solto nas terminações comuns ("loja.com.br/pagar").
const LINK_NO_TEXTO =
  /(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|app|me|ly|link|br|ai|dev|site|shop|store|online|xyz|gl|be)\b(?:\/[^\s]*)?/giu;

const semProtocolo = (link) => link.replace(/^https?:\/\//iu, '').replace(/^www\./iu, '').replace(/\/+$/u, '');
const limparLink = (link) => link.replace(/[.,;:!?)\]”"']+$/u, '');

/**
 * O modelo respondeu a pergunta do NOSSO lado como se fosse o lead
 * ("Ajuda sim." depois de "isso já ajuda a entender melhor?").
 * Pega bolha curta (2 a 4 palavras) feita de sim/não + palavras ecoadas da última pergunta nossa.
 * "Sim" sozinho passa: pode ser resposta legítima a uma pergunta do lead.
 */
export function respondeANossaPergunta(bolha, pergunta) {
  const palavras = paraComparar(bolha).split(' ').filter(Boolean);
  if (palavras.length < 2 || palavras.length > 4) return false;
  const simOuNao = (p) => p === 'sim' || p === 'nao';
  if (!simOuNao(palavras[0]) && !simOuNao(palavras.at(-1))) return false;
  const daPergunta = new Set(paraComparar(pergunta).split(' '));
  const ecoadas = palavras.filter((p) => !simOuNao(p));
  return ecoadas.length > 0 && ecoadas.every((p) => daPergunta.has(p));
}

/**
 * @param {string[]} bolhas  as mensagens que a IA quer enviar, na ordem
 * @param {object} ctx
 * @param {string[]} ctx.linksPermitidos   os únicos links que podem sair (os da ficha)
 * @param {string[]} ctx.valoresPermitidos os únicos valores em R$ que podem sair (os da ficha)
 * @param {string|null} [ctx.perguntaNossa] a última pergunta do nosso lado antes da fala do lead
 * @param {{toquesAnteriores: string[]}} [ctx.followUp] modo follow-up: nada de R$ e nada repetido
 * @param {string[]} [ctx.frasesProibidas]
 * @returns {string[]} erros (vazio = pode enviar)
 */
export function conferirResposta(bolhas, ctx) {
  const erros = [];
  if (!Array.isArray(bolhas) || bolhas.length === 0) return ['a resposta não tem nenhuma mensagem'];
  if (bolhas.length > MAX_BOLHAS) erros.push(`a resposta tem ${bolhas.length} mensagens, o máximo é ${MAX_BOLHAS}`);
  const proibidas = ctx.frasesProibidas ?? FRASES_PROIBIDAS;
  const links = (ctx.linksPermitidos ?? []).map((l) => semProtocolo(limparLink(l)));
  const valores = (ctx.valoresPermitidos ?? []).map(normalizarValor);

  bolhas.forEach((bolha, i) => {
    const pos = `a mensagem ${i + 1}`;
    const texto = String(bolha ?? '');
    if (texto.trim() === '' || /^[\s/\\.-]*$/u.test(texto)) erros.push(`${pos} está vazia`);
    if (texto.length > MAX_CARACTERES_DA_BOLHA) erros.push(`${pos} passa de ${MAX_CARACTERES_DA_BOLHA} caracteres`);
    if (/[—–]/u.test(texto)) erros.push(`${pos} tem travessão`);
    if (texto.includes(';')) erros.push(`${pos} tem ponto e vírgula`);
    if (texto.includes('…') || /\.{3,}/u.test(texto)) erros.push(`${pos} tem reticências`);
    if (/desculp/u.test(semAcento(texto))) erros.push(`${pos} pede desculpa`);
    const normal = semAcento(texto);
    for (const frase of proibidas) if (normal.includes(frase)) erros.push(`${pos} usa a expressão proibida "${frase}"`);
    for (const achado of texto.match(LINK_NO_TEXTO) ?? []) {
      if (!links.includes(semProtocolo(limparLink(achado)))) erros.push(`${pos} tem um link que não está na ficha`);
    }
    const reais = texto.match(/R\$\s?\d[\d.]*(?:,\d{1,2})?/gu) ?? [];
    if (reais.length > 0 && ctx.followUp) erros.push(`${pos} cita valor em reais, e o follow-up não cita`);
    else for (const v of reais) if (!valores.includes(normalizarValor(v))) erros.push(`${pos} cita um valor que não está na ficha (${v})`);
    if (ctx.followUp && ctx.followUp.toquesAnteriores.some((t) => paraComparar(t) === paraComparar(texto))) {
      erros.push(`${pos} repete um toque anterior`);
    }
    if (ctx.perguntaNossa && respondeANossaPergunta(texto, ctx.perguntaNossa)) {
      erros.push(`${pos} responde à pergunta do nosso lado como se fosse o lead. Quem responde é o lead`);
    }
  });
  return erros;
}

/** Monta a instrução da segunda tentativa a partir dos erros. */
export function instrucaoDeCorrecao(erros) {
  return `Sua resposta anterior foi reprovada pela conferência: ${erros.join('. ')}. Escreva de novo, corrigindo isso.`;
}
