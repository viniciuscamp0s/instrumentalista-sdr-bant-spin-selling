// Utilidades de texto usadas por todas as travas. Sem dependências.

/** Minúsculas e sem acento: "Não, OBRIGADO" -> "nao, obrigado". */
export function semAcento(texto) {
  return String(texto ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Só letras e números, separados por um espaço. Serve para comparar frases ignorando pontuação. */
export function paraComparar(texto) {
  return semAcento(texto).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** "R$ 1.500,00", "R$1500" e "R$ 1500,0" viram "1500.00". */
export function normalizarValor(valor) {
  const numero = String(valor).replace(/R\$\s?/u, '').replace(/\./gu, '').replace(',', '.');
  const n = Number.parseFloat(numero);
  return Number.isFinite(n) ? n.toFixed(2) : String(valor).trim();
}
