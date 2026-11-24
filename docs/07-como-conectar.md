# 07 · Como conectar na sua estrutura

> A inteligência não depende de plataforma. O que muda é onde cada peça mora.

## As peças, em qualquer estrutura

| Peça | O que é | Arquivo deste repositório |
|---|---|---|
| Prompt fixo | regras do sistema + a sua ficha | `prompt/sistema.md` + `prompt/ficha-da-empresa.md` |
| Saída estruturada | o JSON que a IA devolve | `prompt/saida.schema.json` |
| Quando responder | rajada, humano, pergunta velha, limite | `referencia/ritmo.mjs` |
| Conferência | o texto pode sair? | `referencia/conferencia.mjs` |
| Regras de funil | etapa, BANT, MQL/SQL, tags, nome | `referencia/regras.mjs` |
| Recusa | PERDIDO sem IA | `referencia/recusa.mjs` |
| Mídia | transcrição e leitura | `docs/03-midia.md` + `prompt/leitura-de-midia.md` |
| Follow-up | mensagens prontas, cadência, freios | `docs/04-follow-up.md` |

Os arquivos de `referencia/` são JavaScript puro, sem dependência, Node 20 ou mais. Copie, importe ou traduza
para a sua linguagem. Os testes (`npm test`) são a especificação: a sua versão passa nos mesmos casos.

## Código próprio (Node, Python, qualquer linguagem)

1. Webhook da API de WhatsApp grava a mensagem e responde 200 rápido.
2. Um job a cada 2 segundos pega as conversas com pergunta esperando e chama `horaDeResponder`.
3. Monta o prompt (prefixo fixo + parte variável), chama o modelo com o esquema de saída.
4. `conferirResposta`. Reprovou: segunda tentativa com `instrucaoDeCorrecao`. Reprovou de novo: humano.
5. `respostaFicouVelha`? Descarta. Senão envia mensagem a mensagem com `digitandoMs` e `pausaEntreMensagensMs`.
6. Aplica `proximaEtapa`, `mesclarBant`, `mesclarTags`, `primeiroNome` e grava.

## N8N, Make ou outra ferramenta visual

- **Webhook** recebe a mensagem e grava numa tabela (Postgres, Supabase, Airtable). Nunca responda direto do webhook.
- **Agendador a cada poucos segundos** busca conversas cuja última mensagem é do lead e já tem 8 s sem nada novo
  (depois da primeira resposta). Isso substitui o "wait" por mensagem, que gera uma resposta por mensagem.
- **Nó de código** (JavaScript) com o conteúdo de `conferencia.mjs`, `regras.mjs` e `recusa.mjs` colado (tire os
  `import`/`export` e junte num nó só).
- **Nó de IA** com o prompt de sistema + ficha no campo de sistema, a conversa no campo de usuário, e saída JSON
  com o esquema.
- Antes de enviar, **releia a tabela**: se chegou mensagem nova do lead desde o início, descarte e deixe a
  próxima rodada responder.
- Envio com "digitando" pela API (Evolution, Z-API, API oficial e afins têm o parâmetro de presença/delay).
- **Sem chave paga dentro do workflow exposto**: use variável de ambiente ou credencial da ferramenta.

## Claude Code, Codex ou outro agente de código

Abra o agente na pasta do seu projeto e cole:

```text
Leia este repositório (inteligencia-sdr) inteiro: README, docs, prompt e referencia. Depois implemente o agente
SDR no meu projeto seguindo docs/02-motor.md, usando prompt/sistema.md como prompt fixo, prompt/saida.schema.json
como saída e as funções de referencia/ (ou a tradução delas para a linguagem do projeto) com os mesmos testes.
Comece me perguntando: qual API de WhatsApp eu uso, qual provedor de IA, onde gravo as conversas e qual política
de handoff (A ou B). Monte a ficha comigo campo por campo, a partir de prompt/ficha-da-empresa.md, sem deixar
placeholder. O agente nasce desligado e em modo de teste.
```

## Num CRM que já tem agente de IA

Muitos CRMs deixam você escrever o prompt mas não deixam pôr código no meio. Nesse caso:

- cole `prompt/sistema.md` + a ficha no campo de instruções;
- desligue qualquer "responder a cada mensagem" e ligue o agrupamento de mensagens, se existir;
- desligue a resposta automática de ausência do WhatsApp Business no celular;
- confira na mão a lista de `docs/05-erros-que-ja-cometemos.md`, seção "Antes de ligar em produção". O que o CRM
  não deixar travar por código fica como risco conhecido.

## Escolha do provedor de WhatsApp

| Tipo | Prós | Contras |
|---|---|---|
| API oficial (Meta Cloud API) | estável, sem risco de bloqueio por uso de API | custo por conversa iniciada pela empresa; template aprovado para mensagem fora de 24 h |
| API não oficial (Evolution, Baileys e afins) | barata ou grátis, sem template | risco de bloqueio, quedas de sessão, recepção que falha calada: precisa de alarme |

Nunca misture os dois tipos no mesmo número.
