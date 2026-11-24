// RITMO DA CONVERSA: quando responder, quando esperar, quando descartar, quanto "digitar".
// Os números são os que rodam em produção. Mude com medida, não com palpite.

/** Depois da primeira resposta, espera este tempo sem mensagem nova do lead para juntar a rajada. */
export const ESPERA_PARA_JUNTAR_MS = 8_000;
/** Pergunta mais velha que isso não é respondida (ligar o agente não responde o histórico). */
export const IDADE_MAXIMA_DA_PERGUNTA_MS = 6 * 60 * 60 * 1000;
/** Chamadas de IA por conversa por hora. Passou: para e chama o humano (um número sozinho não esgota o teto do mês). */
export const MAX_CHAMADAS_POR_CONVERSA_POR_HORA = 20;

/**
 * Decide se é hora de responder. Uma resposta por RAJADA, nunca uma por mensagem.
 * @param {object} c
 * @param {{autor:'lead'|'agente'|'humano', em:number, falhou?:boolean}[]} c.mensagens  da mais antiga para a mais nova; `em` = hora em que CHEGOU ao seu servidor (nunca a hora do aparelho)
 * @param {number} c.agora
 * @param {boolean} [c.agenteAtivo]  false quando um humano assumiu pelo botão
 * @param {number} [c.chamadasNaUltimaHora]
 * @returns {{responder:true} | {responder:false, motivo:string}}
 */
export function horaDeResponder({ mensagens, agora, agenteAtivo = true, chamadasNaUltimaHora = 0 }) {
  if (!agenteAtivo) return { responder: false, motivo: 'humano_assumiu' };
  // Mensagem nossa que FALHOU ao enviar não conta como resposta: a pergunta segue esperando.
  const validas = mensagens.filter((m) => !(m.autor !== 'lead' && m.falhou));
  const ultima = validas.at(-1);
  if (!ultima || ultima.autor !== 'lead') return { responder: false, motivo: 'sem_pergunta' };
  if (agora - ultima.em > IDADE_MAXIMA_DA_PERGUNTA_MS) return { responder: false, motivo: 'pergunta_antiga' };
  const jaRespondemos = validas.some((m) => m.autor !== 'lead');
  // Primeira mensagem da conversa: resposta imediata. Depois: espera a rajada terminar.
  if (jaRespondemos && agora - ultima.em < ESPERA_PARA_JUNTAR_MS) return { responder: false, motivo: 'juntando_mensagens' };
  if (chamadasNaUltimaHora >= MAX_CHAMADAS_POR_CONVERSA_POR_HORA) return { responder: false, motivo: 'limite_por_hora' };
  return { responder: true };
}

/**
 * Antes de ENVIAR a resposta gerada, confira se o mundo mudou enquanto a IA pensava.
 * Mudou (lead mandou outra mensagem, humano assumiu ou escreveu, etapa mudou na mão): descarte.
 * A próxima rodada responde tudo junto. Resposta velha enviada é a que parece robô.
 */
export function respostaFicouVelha(antes, depois) {
  return (
    antes.idUltimaDoLead !== depois.idUltimaDoLead ||
    antes.agenteAtivo !== depois.agenteAtivo ||
    antes.etapa !== depois.etapa ||
    antes.falasDoHumano !== depois.falasDoHumano
  );
}

/** "Digitando..." proporcional ao tamanho: 40 ms por caractere, entre 1,2 s e 6 s. */
export function digitandoMs(texto) {
  return Math.min(Math.max(40 * String(texto).length, 1_200), 6_000);
}

/** Pausa antes de cada mensagem depois da primeira: 1 s + até 2 s aleatórios. */
export function pausaEntreMensagensMs(aleatorio = Math.random) {
  return 1_000 + Math.floor(aleatorio() * 2_000);
}

/** Espera depois da n-ésima falha técnica: 30 s, 60 s, 120 s. Na 3ª, passa ao humano. */
export const FALHAS_ATE_O_HUMANO = 3;
export function esperaDaFalhaMs(falhas) {
  return 30_000 * 2 ** Math.max(0, falhas - 1);
}
