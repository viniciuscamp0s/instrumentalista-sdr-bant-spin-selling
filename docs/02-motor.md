# 02 · O motor: o caminho de uma mensagem até a resposta

> Vale para qualquer estrutura: código próprio, N8N, Make, Typebot, outro CRM. Os números são os que rodam
> em produção. A implementação de referência das partes que são regra está em `referencia/`.

## O princípio: a IA propõe, o código decide

A IA faz uma coisa só: **escrever as mensagens e preencher um registro** (etapa, BANT, tags, chamar humano,
nome). Tudo que é regra de negócio é código, testável, e nunca depende do modelo "lembrar":

| Decisão | Quem decide | Onde |
|---|---|---|
| Se é hora de responder (rajada, humano assumiu, pergunta velha) | código | `referencia/ritmo.mjs` |
| Se o texto pode sair (forma, link, preço, eco da nossa pergunta) | código | `referencia/conferencia.mjs` |
| Etapa do funil (só para a frente) | código, a partir da proposta da IA | `referencia/regras.mjs` |
| MQL ou SQL | código, pelos 4 itens do BANT | `referencia/regras.mjs` |
| Recusa explícita vira PERDIDO | código, por palavras, sem IA | `referencia/recusa.mjs` |
| Follow-up (o que manda, quando, quando para) | código, mensagens prontas | `docs/04-follow-up.md` |

**Uma chamada de IA por resposta**, com saída estruturada (`prompt/saida.schema.json`), sem laço de
ferramentas e sem busca vetorial: a ficha da empresa inteira vai no prompt. É mais barato, mais rápido e
muito mais previsível que um "agente com ferramentas".

## O fluxo, passo a passo

1. **Chega a mensagem (webhook).** Grave antes de tudo, com a **hora em que chegou ao seu servidor** (a
   hora do aparelho atrasa quando o celular estava sem rede e bagunça a ordem). Reentrega do mesmo id não
   duplica: índice único por id da mensagem.
2. **Filtre o que não é lead:** grupo, status, canal, transmissão, reação, protocolo e mensagem
   **encaminhada** não abrem conversa. Resposta de botão vale pelo texto que a pessoa tocou, não pelo id.
3. **Se existe follow-up agendado, ele para na mesma gravação** (mesma transação). Nunca deixe uma janela
   em que o lead respondeu e o toque ainda sai.
4. **Recusa explícita?** (`classificarResposta`) Vai para PERDIDO agora, sem IA, e nunca mais gasta nada.
5. **É hora de responder?** (`horaDeResponder`)
   - primeira mensagem da conversa: **resposta imediata**;
   - depois da primeira resposta: **espera 8 s sem mensagem nova** para juntar a rajada. Quem manda
     "oi" / "tudo bem?" / "queria saber do produto" em três mensagens recebe **uma** resposta;
   - pergunta com mais de **6 h** não é respondida (ligar o agente não responde o histórico);
   - a última mensagem é do nosso lado (humano escreveu): não responde;
   - mensagem nossa que **falhou** ao enviar não conta como resposta: a pergunta segue esperando.
6. **Trave a conversa** (10 min, com carimbo próprio: só quem travou solta). Nunca dois processos, nem o
   agente e o follow-up, no mesmo lead.
7. **Prepare a mídia pendente:** transcreva áudios, leia imagens e PDFs (`docs/03-midia.md`).
8. **Monte o prompt em duas partes:**
   - **prefixo, idêntico byte a byte em toda chamada da mesma empresa:** regras do sistema + ficha. Nada
     variável aqui (data, nome, estado), senão o cache do provedor não vale e o custo sobe;
   - **parte variável:** estado atual (primeiro nome, etapa, BANT em sim/não/não se sabe, tags), a conversa
     (últimas **20 mensagens**, cada uma cortada em 1.000 caracteres; mídia lida em até 2.200) e a linha
     final "Responda à última mensagem do lead.".
   - Rótulos de autor na conversa: `Lead`, `Lead (áudio)`, `Lead (imagem)`, `Lead (documento)`, `Você`
     (o agente), `Você (retomada)` (follow-up), `Equipe (nome)` (humano do nosso lado).
9. **Confira o teto de gasto ANTES de chamar** (estimativa do pior caso: caracteres ÷ 2,5 tokens de
   entrada + o máximo de saída). No teto: não chama e reagenda o lead em 10 min, para os leads de uma
   empresa no teto não travarem a fila das outras.
10. **Chame o modelo** (timeout 60 s, máximo de saída 2.000 tokens). **Conferência** do texto
    (`conferirResposta`). Reprovou: **segunda e última tentativa**, com os erros escritos no prompt
    (`instrucaoDeCorrecao`). Reprovou de novo: não envia nada e passa ao humano.
11. **Antes de enviar, confira se a resposta ficou velha** (`respostaFicouVelha`): o lead mandou outra
    mensagem, um humano assumiu ou escreveu, a etapa mudou na mão? Descarte. A próxima rodada responde tudo
    junto. O custo já está registrado; enviar resposta velha é o que mais denuncia o robô.
12. **Envie mensagem a mensagem:**
    - "digitando..." proporcional: **40 ms por caractere, entre 1,2 s e 6 s** (`digitandoMs`);
    - pausa de **1 s + até 2 s aleatórios** antes de cada mensagem depois da primeira;
    - a cada pausa, reconfira se o humano assumiu ou escreveu: se sim, **o que falta não sai**.
13. **Só depois do envio, aplique o registro** (etapa, BANT, tags, nome). Se o envio falhou, o lead não
    avança sem ter recebido a mensagem. A etapa só muda **se ninguém mexeu nela durante a geração**
    (atualização condicional): arrasto manual no funil sempre vence o agente.
14. **Passe ao humano quando pedido** (`chamar_humano`), com atualização condicional (duas rodadas juntas
    não avisam duas vezes). O aviso ao responsável leva nome, motivo e link, **nunca o texto da conversa**.

## Eco do WhatsApp (essencial para o handoff funcionar)

A API devolve ao webhook o eco de tudo que o seu número manda. Se você não reconhecer o eco, ele parece
"um humano escreveu" e o agente para ou se confunde.

- **Grave a linha da mensagem que vai sair ANTES de chamar o envio** (o eco pode chegar antes da resposta
  da API). O webhook casa o eco com essa linha pendente por id ou por corpo igual numa janela de 60 s.
- Todo tipo de mensagem enviada (texto, áudio, imagem, vídeo) grava a linha pendente com **o mesmo corpo
  que o webhook dá ao eco daquele tipo**. Um áudio enviado cujo eco chegou como `[áudio]` sem linha
  pendente igual virou "humano assumiu" na primeira resposta.
- Envio sem resposta da API: a mensagem pode ter saído. **Nunca reenvie** às cegas; o eco confirma.

## Handoff humano: escolha uma política e escreva

| Política | Quando o humano escreve no WhatsApp | Para usar quando |
|---|---|---|
| **A · fala do humano é contexto** (padrão recomendado) | o agente lê, usa, nunca contradiz nem repete, e segue atendendo. Só para pelo botão "Assumir" | o dono responde do celular de vez em quando e não quer o lead parado |
| **B · humano escreveu, agente para** | a conversa passa ao humano na hora | a equipe comercial assume a conversa e o agente atrapalharia |

O erro que gerou a escolha: com a política B implícita, qualquer "ok" do dono no celular parava o agente e
4 leads ficaram parados dias sem ninguém perceber. **A troca de dono da conversa só acontece por ação
explícita** (botão, ou o próprio agente chamando o humano), nunca por efeito colateral.

## Freios de segurança e de custo

| Freio | Valor | Por quê |
|---|---|---|
| Chamadas por conversa por hora | 20, depois humano + aviso | um número sozinho (robô, brincadeira) esgotaria o teto do mês |
| Teto mensal por empresa | conferido antes de cada chamada; aviso a 80%, para a 100% | custo nunca é surpresa |
| Falha técnica | espera 30 s, 60 s, 120 s; na 3ª, humano | não martelar a API caída nem deixar o lead sem ninguém |
| Resposta torta que a API já cobrou | direto ao humano, sem nova tentativa paga | não pagar duas vezes pelo mesmo erro |
| Modo ensaio | o agente nasce desligado e só responde a números de teste | nada chega a lead real sem ser visto antes |

## Teste com o serviço real, não só com o simulado

Os dois defeitos mais caros que tivemos passaram em todos os testes e quebraram em produção:
o download de mídia (o simulado aceitava o id da mensagem; o real não guardava a mensagem e respondia
"não encontrada", então **nenhum áudio foi transcrito** até alguém olhar) e o formato do pedido ao SDK
(o simulado não validava; o real recusou a primeira resposta). **Todo módulo que fala com modelo ou com a
API de WhatsApp tem pelo menos uma prova contra o serviço de verdade antes de dizer pronto.**
