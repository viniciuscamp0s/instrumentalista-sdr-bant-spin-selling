// A IA PROPÕE, O CÓDIGO DECIDE.
// A IA devolve as mensagens e um registro (etapa, BANT, tags, chamar humano). Tudo que é regra de
// negócio sai daqui, em código puro e testável: nunca do modelo.

/** Etapas que o agente pode marcar. GANHO é só do humano (venda confirmada); FOLLOW-UP é só da cadência. */
export const ETAPAS = ['conexao', 'qualificacao', 'proposta'];
export const PERDIDO = 'perdido';

/**
 * A etapa só anda para a frente (conexão -> qualificação -> proposta) ou encerra em PERDIDO.
 * Nulo, etapa desconhecida ou volta: mantém a atual.
 */
export function proximaEtapa(atual, proposta) {
  if (!proposta || proposta === atual || atual === PERDIDO) return atual;
  if (proposta === PERDIDO) return PERDIDO;
  const de = ETAPAS.indexOf(atual);
  const para = ETAPAS.indexOf(proposta);
  if (para === -1 || de === -1) return de === -1 && para !== -1 ? proposta : atual;
  return para > de ? proposta : atual;
}

/**
 * BANT adaptado: cada item é true (confirmou), false (negou) ou null (ainda não se sabe).
 * Nulo da IA nunca apaga o que já se sabia; o que ela afirmou substitui.
 */
export function mesclarBant(atual = {}, novo = {}) {
  const chaves = ['orcamento', 'decisor', 'necessidade', 'prazo'];
  const out = {};
  for (const k of chaves) out[k] = novo?.[k] === true || novo?.[k] === false ? novo[k] : (atual?.[k] ?? null);
  return out;
}

/** SQL (pronto para o vendedor) só com os 4 itens confirmados. O resto é MQL. */
export function classificacao(bant) {
  return ['orcamento', 'decisor', 'necessidade', 'prazo'].every((k) => bant?.[k] === true) ? 'SQL' : 'MQL';
}

export const MAX_TAGS = 8;
const MULTIPLOS = new Set(['objecao']);

/**
 * Tags: no máximo 8, valor até 80 caracteres, sem repetir. Só "objecao" acumula valores;
 * nos outros grupos o valor novo substitui o antigo. Tag posta por pessoa nunca é trocada pelo agente.
 * @param {{grupo:string, valor:string, autor?:'humano'|'agente'}[]} atuais
 * @param {{grupo:string, valor:string}[]} novas
 */
export function mesclarTags(atuais = [], novas = []) {
  const limpa = (v) => String(v ?? '').replace(/\s+/gu, ' ').trim().slice(0, 80);
  const lista = atuais.map((t) => ({ ...t }));
  for (const n of novas) {
    const valor = limpa(n.valor);
    if (!valor || !n.grupo) continue;
    if (lista.some((t) => t.grupo === n.grupo && t.valor.toLowerCase() === valor.toLowerCase())) continue;
    if (!MULTIPLOS.has(n.grupo)) {
      const i = lista.findIndex((t) => t.grupo === n.grupo);
      if (i !== -1) {
        if (lista[i].autor === 'humano') continue;
        lista[i] = { grupo: n.grupo, valor, autor: 'agente' };
        continue;
      }
    }
    if (lista.length < MAX_TAGS) lista.push({ grupo: n.grupo, valor, autor: 'agente' });
  }
  return lista;
}

/**
 * O nome do lead é SÓ o que ele mesmo escreveu na conversa (a IA devolve em nome_do_lead).
 * O nome do perfil do WhatsApp nunca entra: vem com apelido, emoji, nome da empresa ou de outra pessoa.
 * Devolve o primeiro nome capitalizado (2 a 20 letras) ou null.
 */
export function primeiroNome(nomeDoLead) {
  const primeiro = String(nomeDoLead ?? '').trim().slice(0, 40).split(/\s+/u)[0] ?? '';
  if (!/^\p{L}{2,20}$/u.test(primeiro)) return null;
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}
