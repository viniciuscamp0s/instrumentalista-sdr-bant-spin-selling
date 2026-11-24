# Ficha da empresa (modelo para preencher)

> A ficha é a única fonte do agente sobre o seu negócio. Ela vai inteira no prompt, logo depois de
> `prompt/sistema.md`. Copie o bloco abaixo, preencha e apague as linhas de instrução (as que começam com `>`).
>
> **Cinco regras que evitam os erros mais caros:**
> 1. **Só o que o agente pode dizer ao lead.** Nada de "(confirmado com o cliente)", "PENDENTE", data, nota de
>    quem montou, comparação com outra empresa. Teste de cada frase: se o agente falasse isso para um lead, soaria normal?
> 2. **Nunca deixe campo com placeholder** ("[preencher]", "a definir", "R$ X"). O modelo completa sozinho com um
>    valor inventado. Campo sem informação fica fora da ficha.
> 3. **Linguagem natural, nunca notação.** Nada de seta (→), símbolo (≥ ≤), `===`, "Registrar campo", "Mover para".
>    Condição vira frase: "se o investimento for de 5 mil ou mais".
> 4. **Variável é sempre `{chave}`**, nunca `[chave]`. A única que o agente conhece por padrão é `{primeiro_nome}`.
> 5. **Não descreva capacidade que o agente não tem** (agendar, mandar arquivo, mandar áudio) a menos que o seu
>    sistema faça isso de verdade.
>
> Tamanho de referência: 12 a 17 mil caracteres. Mais que isso encarece cada resposta sem ganho.

```markdown
## Nome da empresa
> Como o lead conhece. Uma linha.

## Quem atende
> Nome de uma pessoa real da equipe (dono, vendedor) e o cargo. Nunca o nome do produto ou da plataforma,
> a menos que a empresa queira uma persona própria. Uma frase de apresentação.

## Segmento
> 1 a 2 frases: o que a empresa faz e onde atende.

## Produtos e serviços
> A ideia em uma frase. Planos e preços exatos (os únicos valores que o agente pode citar). Links exatos (os
> únicos que ele pode mandar). Garantia, cancelamento, prazo. Diferenciais: até 6 fatos verificáveis.
> "O que eu nunca conto": o que não se fala ao lead.

## Público-alvo
> Quem é. Quem não é (e a frase educada para encerrar). Os 4 itens do BANT definidos para este produto:
> orçamento = ..., decisor = ..., necessidade = ..., prazo = (janela, padrão 30 dias). A regra de corte
> (valor mínimo, região) e a política fora da região: sinalizar ou recusar. Prioridade A, B e C por faixa.

## Script comercial
> Objetivo máximo da conversa em uma frase.
> FASE 1. ABERTURA: a mensagem de abertura entre aspas (uma, no máximo duas).
> FASE 2. CORTE: a pergunta do dado que decide, entre aspas, e o que fazer abaixo do corte (alternativa de
> valor, depois indicação, só então encerrar).
> FASE 3. QUALIFICAÇÃO: as perguntas, uma por item, na ordem, entre aspas.
> FASE 4. PROPOSTA: como apresentar, quando o preço aparece.
> FASE 5. FECHAMENTO: o próximo passo concreto e a frase que avisa o lead do que vai acontecer.

## Tom de voz
> 3 a 6 linhas. Ex.: "Direto e próximo, de quem vive o mercado. Pode usar tô, tá, pra. No máximo um emoji
> leve, e só às vezes." Palavras que a marca usa e as que ela nunca usa.

## Objeções comuns
> Para cada uma: o título numa linha e a resposta curta entre aspas, que já conduz ao próximo passo.

## Regras de atendimento
> Numeradas. Só o que é do seu negócio (as regras gerais já estão no prompt de sistema).

## Tópicos proibidos
> O que o agente nunca toca além do padrão (política, religião, concorrente pelo nome, conselho profissional).

## Quando chamar o responsável
> Os casos em que o agente passa ao humano, quem é o responsável e o que ele resolve sozinho.

## Contexto adicional
> O que mais o agente precisa saber. "Sucesso nesta conversa é..."

## Mensagens do follow-up
> Não vai ao prompt da resposta: o seu código lê esta seção. Pelo menos 2 versões por toque. A única variável
> é {primeiro_nome}, no começo ou depois de vírgula. Sem desculpa, sem R$, sem link, sem escassez.

### Toque 1
- "{primeiro_nome}, conseguiu ver minha última mensagem?"
- "Oi {primeiro_nome}, ficou alguma dúvida sobre o que te mandei?"

### Toque 2
- "..."
- "..."

### Semanal 1
- "..."
- "..."

### Mensal
- "..."
- "..."

## Configuração do sistema
> Não vai ao prompt: o seu código lê. modo (ensaio ou real), números de teste (os únicos com /reset, nunca o
> número que envia os avisos), teto mensal em dólar, destino dos
> avisos, política de handoff (A: fala da equipe é contexto, B: equipe escreveu, agente para).
```

## Exemplo de fechamento transparente (último toque da sequência)

```text
{primeiro_nome}, pela falta de retorno entendo que isso não é prioridade pra você agora. Só me confirma se ainda
é uma opção pro futuro, pra eu te avisar quando surgir uma boa oportunidade.
```

Nunca "não vou mais insistir" nem "última tentativa".
