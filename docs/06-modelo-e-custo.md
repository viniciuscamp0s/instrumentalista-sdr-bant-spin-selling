# 06 · Modelo de IA e custo: barato sem perder qualidade

## O que roda em produção e por quê

Em 03/11/2026 comparamos 4 configurações num **teste cego**: 48 conversas reais (anonimizadas) de um agente
em produção, a mesma ficha, um avaliador que não sabia qual modelo escreveu cada resposta, nota de 0 a 2.

| Configuração | Nota média | Notas zero | Momento certo do roteiro (de 11) | Custo por resposta |
|---|---|---|---|---|
| modelo grande, sem raciocínio (o de antes) | 1,42 | 4 | 9 | US$ 0,0086 |
| modelo pequeno, raciocínio baixo | 1,73 | 1 | 8 | US$ 0,00033 |
| **modelo pequeno, raciocínio médio (adotado)** | **1,79** | **0** | **9** | **US$ 0,00044** |
| modelo pequeno anterior, raciocínio baixo | 1,58 | 2 | 9 | US$ 0,00067 |

**Resultado: custo 95% menor e nota maior.** A latência média subiu de 5,2 s para 6,8 s, o que não importa
porque o agente já espera a rajada do lead terminar. Na época, os modelos eram `gpt-5.4` (o grande) e
`gpt-6-luna` (o pequeno adotado); o nome muda a cada trimestre, **a régua não: o menor modelo com raciocínio
médio que passar no seu teste cego.**

Ordem de grandeza: um agente com ~400 respostas por mês custa **menos de US$ 0,50 por mês** em resposta.
Antes, no modelo grande, uma conversa inteira (resposta, follow-up e transcrição) saía a US$ 0,07.

## Como deixar barato (em ordem de impacto)

1. **Follow-up sem IA** (mensagens prontas): o maior volume de mensagens passa a custar zero.
2. **Recusa sem IA** (palavras): quem disse não sai da fila e nunca mais custa.
3. **Uma chamada por rajada**, não por mensagem: espera de 8 s depois da primeira resposta.
4. **Modelo pequeno com raciocínio médio**, sem temperatura (modelo de raciocínio controla pelo esforço).
5. **Prefixo estável para o cache do provedor:** regras + ficha idênticas byte a byte em toda chamada da
   mesma empresa, e uma chave de cache por empresa. Nada variável no começo do prompt.
6. **Mídia sob demanda e com limite:** transcreve e lê só na hora de responder, com teto por conversa e por dia.
7. **Teto conferido antes da chamada** e teto por conversa (20 chamadas por hora).

## Como escolher o seu modelo (teste cego em 1 hora)

1. Separe **30 a 50 conversas reais** do seu negócio, anonimizadas, cortadas no ponto em que o agente
   precisa responder. Inclua os casos difíceis: preço antes da hora, objeção, áudio transcrito, "ok" solto,
   pergunta fora da ficha, recusa.
2. Gere a resposta de cada conversa com 3 ou 4 modelos candidatos, **mesma ficha, mesmo prompt**.
3. Embaralhe e esconda o nome do modelo. Avalie (você, ou um modelo grande como avaliador) com nota 0, 1 ou 2:
   0 = erraria a venda ou quebraria regra; 1 = aceitável; 2 = o que um bom vendedor escreveria.
4. Conte também: reprovadas pela conferência, mensagem vazia, momento certo do roteiro.
5. Escolha o mais barato **sem nenhuma nota zero**. Repita quando trocar de modelo ou mudar muito a ficha.

**Cuidado que só o teste cego mostrou:** o modelo econômico lê a ficha ao pé da letra e se perde no passo
do roteiro. Por isso existem os "cuidados de escrita" do prompt (seção 2 de `prompt/sistema.md`). Um bloco
de cuidados que segurou um roteiro não segurou outro: **refaça o teste cego para cada roteiro novo.**

## Provedores

O desenho funciona com qualquer provedor que tenha saída estruturada (JSON com esquema): OpenAI, Anthropic,
Google, Groq e modelos abertos servidos por API compatível. Três avisos que custaram caro:

- **Teste pelo SDK de verdade.** Uma versão nova do SDK passou a recusar mensagem de sistema dentro da lista
  de mensagens; o teste simulado passou e a primeira resposta em produção quebrou.
- **Opção que o modelo não aceita pode ser ignorada calada** (retenção de cache longa, esforço de raciocínio
  "nenhum"): confira na resposta que a opção valeu, e tenha um plano B (esforço "baixo" se "nenhum" for recusado).
- **Cota grátis com limite diário quebra na escala.** Serve para começar e testar; o desenho já nasce com a
  troca para o provedor pago ligada por configuração, para o dia em que o volume pedir.
