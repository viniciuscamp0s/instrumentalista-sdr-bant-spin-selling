# 04 · Follow-up: mensagem pronta, custo zero, nunca insistente

## O princípio

**Nenhuma IA escreve o toque de follow-up.** O follow-up sai de um banco de mensagens prontas, aprovadas
pelo dono, com uma variável só (`{primeiro_nome}`). A IA entra quando o lead responde: aí é continuidade
do atendimento. Antes desta regra, cada toque escrito por IA custava cerca de US$ 0,0025 e o texto variava
sem controle; hoje o custo de API do follow-up é zero por construção, e quem decide NÃO mandar também é
código (respondeu, recusou, pediu para sair, humano assumiu, não entregue).

## Cadência que roda em produção

| Fase | Quando (contado do envio real do toque anterior) |
|---|---|
| 8 toques | 30 min, 3 h, 8 h, 18 h, 28 h, 38 h, 48 h e 58 h depois da última mensagem nossa |
| Nutrição semanal | 1 por semana (8 semanas ou para sempre, decisão sua) |
| Mensal | 1 por mês, rodando as versões, até responder ou pedir para sair |

- **Janela de envio:** das 07h às 20h no fuso do lead. Fora dela, o toque vai para a próxima abertura.
  Para prospecção fria, seg a sex 08h às 18h e sábado 09h às 12h, **nunca domingo**.
- Os intervalos contam do **envio real** do toque anterior: se um atrasou (janela, ritmo), os seguintes
  andam junto.
- A trilha só nasce de conversa em que o agente já respondeu e cuja última mensagem tem até 24 h.

## O banco de mensagens

Mora na ficha da empresa, seção "Mensagens do follow-up" (modelo em `prompt/ficha-da-empresa.md`).
Antes de qualquer envio, o banco passa por esta validação (se falhar, **nada sai**, nem em teste):

- **pelo menos 2 versões por passo**, sem versão repetida;
- a única variável é `{primeiro_nome}`, **só no começo ou depois de vírgula**, uma vez. Assim a mesma
  versão serve com e sem nome (sem nome, tira o nome e a vírgula);
- **sem pedido de desculpa, sem valor em R$, sem link**;
- passa pela mesma conferência das respostas (sem travessão, ponto e vírgula, reticências, expressões proibidas),
  testada nas duas formas (com o nome mais longo possível e sem nome);
- **nunca escassez falsa:** nada de "a agenda está enchendo", "entre na frente da fila", "últimas vagas"
  que não sejam verdade naquele dia;
- a aprovação do dono fica amarrada ao hash do texto: mudou uma vírgula, a aprovação cai e o follow-up espera.

**Escolha da versão (código):** só as que servem à situação; nunca a que o lead já recebeu naquele passo;
evita a última que a empresa mandou naquele passo; sorteio entre as restantes.

## Quando para (tudo por código)

| Gatilho | O que acontece |
|---|---|
| Lead respondeu qualquer coisa | a trilha cancela **na mesma transação** em que a mensagem é gravada; o cartão volta à etapa de antes; o agente volta a atender |
| Recusa explícita (`classificarResposta`) | PERDIDO com o motivo; nunca mais recebe toque nem gasta IA |
| Pedido para sair junto de uma pergunta | não vira PERDIDO (o agente responde a pergunta), mas nunca mais recebe toque |
| Humano assumiu, ganho ou perdido | cancela |
| Humano escreveu na conversa quando o toque venceu | o toque espera o intervalo contado da fala do humano |
| 2 toques não entregues em 24 h | para a trilha daquele lead |

## Freios da conta (só o dono solta)

O número da empresa é o patrimônio: um follow-up agressivo derruba o número inteiro.

| Freio | Valor |
|---|---|
| Ritmo | até 150 toques por dia e 20 por hora por número, 60 a 240 s aleatórios entre envios, 1 envio por rodada |
| Falhas seguidas | 3 envios seguidos falharam: para tudo |
| Pedidos para sair | mais de 5% das respostas aos toques: para tudo |
| Não entregues | mais de 20% dos toques sem entrega em 2 h: para tudo |
| Amostra mínima | porcentagem só conta com 20 toques ou mais nos últimos 7 dias |

Só o pedido para sair **em resposta a um toque** conta para o freio; uma onda de "não tenho interesse"
no meio de conversas não deve frear o follow-up de todo mundo.

## Erros reais que este desenho evita

- Toque que **falhou ao enviar** contava como "toque anterior", a nova tentativa era reprovada por repetição e o lead ia ao humano à toa. **Só o que saiu conta.**
- Linha presa em "enviando" por processo morto (deploy, falta de memória) deixava o lead sem follow-up para sempre. **Recuperação:** se saiu, marca enviado e agenda o próximo; se não, volta à fila.
- Erro do banco depois do envio devolvia a linha à fila e **o lead recebia o mesmo toque duas vezes**. Depois de enviado, nenhum erro devolve a linha.
- Trilha parada por falha renascia do toque 1. Trava de renascimento por motivo de cancelamento.
- "Me tira uma dúvida" e "pode sair hoje?" viravam pedido para sair. Padrões estreitados, com teste.
- O lead foi para a coluna "follow-up" 17 segundos depois do cadastro. **Follow-up é estado da cadência, não etapa de venda**: a coluna FOLLOW UP do funil é para quem já recebeu proposta e sumiu; quem nunca respondeu fica onde está e, depois de 72 h sem resposta, vai para Inativos.
