# 08 · Ensaio com /reset e lapidação do agente

> O agente nasce desligado e em **modo ensaio**: só responde aos números de teste que você cadastrou, e lead
> real não recebe nada dele. Você testa pelo seu próprio WhatsApp, como se fosse um lead, quantas vezes quiser.
> Implementação de referência: [`referencia/ensaio.mjs`](../referencia/ensaio.mjs).

## Como funciona o /reset

1. Cadastre um ou mais números de teste (o seu celular, o de alguém da equipe).
2. Desse número, mande mensagem para o WhatsApp do agente e converse como um lead.
3. Quando quiser recomeçar, mande **`/reset`** na mesma conversa. A conversa de teste é apagada (mensagens,
   etapa, BANT, tags e follow-up) e o próximo "oi" começa do zero, como um lead novo.
4. Repita com outro cenário.

Travas que vieram de erro real:

- **Só número de teste tem reset.** Nenhum lead consegue apagar a própria conversa.
- **Número de teste que já é lead real é recusado no cadastro**: o reset apagaria um lead de verdade.
- **O número de teste nunca é o mesmo que envia os avisos da empresa** (o aviso "lead quer comprar" já entrou
  como mensagem do lead num ensaio). Ensaiou com um número que depois vai virar lead real: apague o lead antes
  de ligar o modo real.
- O `/reset` não passa pela IA e não gasta nada.

## O texto para o usuário na etapa de ensaio

Quem monta o agente (você, o seu cliente, o seu mentorado) recebe esta orientação quando o ensaio é ligado.
Adapte o nome do número e mande como está:

```text
Seu SDR está ligado em modo ensaio: ele responde só ao seu número de teste, nenhum lead real recebe mensagem dele.

Como testar:

1. Primeiro, teste o caminho padrão. Fale como um lead comum: responda só o que ele perguntar, sem perguntas
   difíceis, sem objeção, sem fugir do assunto. Assim você vê o roteiro inteiro funcionando do começo ao fim.

2. Quando terminar, mande /reset nessa mesma conversa do WhatsApp. A conversa de teste é apagada e você recomeça
   do zero, como um lead novo.

3. Agora teste os cenários que quiser: pergunte o preço logo de cara, mande áudio, mande um print ou um PDF,
   diga "vou pensar", pergunte se é robô, mande várias mensagens seguidas, diga que não tem interesse. Um /reset
   entre um cenário e outro.

Testar não é obrigatório. Quanto mais cenários você testar, mais lapidado o SDR começa os atendimentos.

A outra opção é colocar em produção e lapidar com conversas reais: acompanhe as primeiras conversas e, quando uma
resposta não for como deveria, mande o print da mensagem, diga como ela deveria ter sido e por quê. O ajuste é
feito na hora e passa a valer para todas as situações parecidas dali em diante.
```

## Os dois caminhos de lapidação

| Caminho | Como | Quando escolher |
|---|---|---|
| **Ensaio antes** | caminho padrão primeiro, depois `/reset` e os cenários de exceção que quiser | quer ver o agente redondo antes do primeiro lead, ou o volume de leads é alto e cada erro custa caro |
| **Produção monitorada** | liga com conversas reais, acompanha as primeiras e manda print do que deveria ser diferente | quer começar logo, ou não sabe quais cenários testar: o lead real mostra |

Os dois se completam: um ensaio curto do caminho padrão e, depois, produção monitorada pegam a maior parte dos ajustes.

## Por que o caminho padrão vem primeiro

Se o caminho padrão não estiver redondo (abertura, ordem das perguntas, passagem ao humano), todo cenário de
exceção vai falhar por causa dele, e você não sabe o que corrigir primeiro. Com o padrão certo, cada cenário
novo testa uma coisa só.

## Cenários que valem o teste (lista de partida)

| Cenário | O que conferir |
|---|---|
| Lead padrão, do "oi" ao fechamento | abertura, uma pergunta por vez, nada repetido, passagem ao humano avisando o lead |
| Três mensagens seguidas ("oi" / "tudo bem?" / "queria saber do serviço") | uma resposta só, para as três |
| "Quanto custa?" na primeira mensagem | segue a regra de preço da ficha, sem inventar valor |
| Áudio de 1 minuto | entendeu o áudio e não pediu para escrever |
| Print ou PDF | usou o que estava legível, perguntou o que faltou |
| "É robô?" | não negou |
| "Vou pensar" | perguntou uma vez o que falta para decidir |
| "Não tenho interesse" | encerrou com cordialidade, sem insistir, e saiu do follow-up |
| "Não, é a primeira vez" (respondendo a uma pergunta) | seguiu a conversa, não encerrou |
| Um "ok" solto depois de uma pergunta do agente | tratou como resposta à pergunta, não respondeu por você |
| Alguém da equipe escreve do celular no meio | o agente fez o que a sua política de handoff diz |
| Sumir depois da proposta | o primeiro toque de follow-up saiu no horário, sem preço nem link |

## Como pedir um ajuste a partir de um caso real

O pedido que se corrige na hora tem três partes:

1. **O print** da mensagem (ou o trecho da conversa).
2. **Como deveria ter sido**, com as palavras que você usaria.
3. **Por quê**, em uma frase (é isso que faz o ajuste valer para os casos parecidos, não só para aquele).

Quem faz o ajuste decide onde ele mora, nesta ordem:

| O erro foi... | O ajuste vai para |
|---|---|
| do seu negócio (fato, preço, roteiro, objeção, tom da marca) | a ficha da empresa |
| de conversa, que serviria a qualquer empresa (repetir, falar pelo lead, pontuação de robô) | o prompt de sistema **e** uma trava no código, se der para detectar por regra |
| de ritmo ou de estado (respondeu cedo, respondeu duas vezes, não parou) | o motor (`docs/02-motor.md`) |

Depois do ajuste: `/reset` no número de teste e repita o cenário que deu errado para conferir. **Regra que só
fica no prompt um dia volta a falhar; a que vira trava no código, não** (`docs/05-erros-que-ja-cometemos.md`).
