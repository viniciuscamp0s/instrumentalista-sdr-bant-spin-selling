# inteligencia-sdr

**A inteligência de vendas de um agente SDR de IA no WhatsApp, pronta para conectar em qualquer estrutura.**

Método de venda, prompt, saída estruturada, travas em código e, principalmente, **os erros que três agentes em
produção cometeram e a correção de cada um**. Funciona com qualquer modelo de IA, qualquer API de WhatsApp e
qualquer plataforma: código próprio, N8N, Make, um CRM que aceita prompt, ou o seu Claude Code / Codex montando
tudo para você.

O que você leva:

- **Conversa que parece gente:** mensagens curtas, uma pergunta por vez, nunca repete pergunta, nunca uma resposta
  para cada mensagem do lead, "digitando" proporcional ao texto, sem bordão, sem pedido de desculpa.
- **Qualificação que separa rápido:** BANT adaptado em conversa, corte logo no começo, MQL e SQL decididos por
  código, recusa explícita encerrada sem gastar IA.
- **Áudio, imagem e PDF:** transcrição e leitura sob demanda, com limite de gasto e proteção contra instrução
  escondida em imagem.
- **Barato:** menos de US$ 0,001 por resposta no modelo que adotamos depois de um teste cego (custo 95% menor
  e nota maior que o modelo grande que usávamos). Follow-up com custo zero de IA.
- **Não erra o que já erramos:** mais de 170 incidentes reais viraram regra de prompt, trava de código ou item de
  checklist.

## Por onde começar

| Você quer | Leia |
|---|---|
| Entender o método de venda | [`docs/01-metodo-de-venda.md`](docs/01-metodo-de-venda.md) |
| O prompt pronto para colar | [`prompt/sistema.md`](prompt/sistema.md) + [`prompt/ficha-da-empresa.md`](prompt/ficha-da-empresa.md) |
| Montar o motor (quando responder, como enviar, handoff) | [`docs/02-motor.md`](docs/02-motor.md) |
| Áudio, imagem e PDF | [`docs/03-midia.md`](docs/03-midia.md) |
| Follow-up sem IA e sem ser chato | [`docs/04-follow-up.md`](docs/04-follow-up.md) |
| **Os erros e as travas (leia antes de ligar)** | [`docs/05-erros-que-ja-cometemos.md`](docs/05-erros-que-ja-cometemos.md) |
| Escolher o modelo e manter barato | [`docs/06-modelo-e-custo.md`](docs/06-modelo-e-custo.md) |
| Conectar no N8N, Make, código próprio ou CRM | [`docs/07-como-conectar.md`](docs/07-como-conectar.md) |

## Em 5 minutos, com um agente de código

Clone o repositório e, na pasta do seu projeto, peça ao Claude Code ou ao Codex:

```text
Leia o repositório inteligencia-sdr inteiro e implemente o agente SDR no meu projeto seguindo
docs/07-como-conectar.md. Monte a ficha da minha empresa comigo, campo por campo, sem placeholder.
O agente nasce desligado e em modo de teste.
```

## A arquitetura em uma imagem

```text
WhatsApp ──> webhook grava (hora de chegada, sem duplicar, para o follow-up)
                │
                ├─ recusa explícita? ──> PERDIDO (sem IA)
                │
          job a cada 2 s: é hora de responder?  (1ª resposta imediata, depois espera 8 s a rajada)
                │
          trava a conversa ─> transcreve áudio / lê imagem e PDF ─> confere o teto de gasto
                │
          1 chamada de IA: prompt fixo (regras + ficha, cacheado) + estado + últimas 20 mensagens
                │
          saída JSON: mensagens + etapa + BANT + tags + chamar humano + nome
                │
          conferência por código ── reprovou? 2ª tentativa com os erros ── reprovou de novo? humano
                │
          a resposta ficou velha? (lead escreveu, humano entrou) ──> descarta
                │
          envia mensagem a mensagem com "digitando"  ──>  código aplica etapa, BANT, tags
```

**A IA propõe, o código decide.** O modelo escreve e preenche um registro; tudo que é regra de negócio é código
testável, em [`referencia/`](referencia/).

## Código de referência

JavaScript puro, sem dependência, Node 20 ou mais:

| Arquivo | O que faz |
|---|---|
| [`referencia/conferencia.mjs`](referencia/conferencia.mjs) | reprova a resposta antes de sair: tamanho, pontuação de robô, desculpa, link e valor fora da ficha, repetição, responder pelo lead |
| [`referencia/recusa.mjs`](referencia/recusa.mjs) | recusa e pedido para sair por palavras, com a trava "preço e dúvida nunca são recusa" |
| [`referencia/regras.mjs`](referencia/regras.mjs) | etapa só para a frente, BANT, MQL/SQL, tags, nome do lead |
| [`referencia/ritmo.mjs`](referencia/ritmo.mjs) | quando responder, quando descartar, "digitando", espera em falha |

```bash
npm test   # 13 testes, cada um é um erro real que um agente cometeu
```

## O que não está aqui

Nada de um segmento específico (roteiro de um mercado, regras de um tipo de cliente), nada de canal específico (Instagram,
formulário de anúncio, disparo em massa) e nenhum dado de cliente. O que é do seu negócio entra na sua ficha.

## Desenvolvimento

```bash
npm test                         # testes (node --test), sem dependências
node ferramentas/varredura.mjs   # varredura de privacidade antes de publicar um fork
```

## Licença e créditos

MIT. Feito por Vinicius Campos ([@viniciuscamp0s_](https://www.instagram.com/viniciuscamp0s_/) no Instagram), a
partir dos agentes SDR que atendem os clientes dele todos os dias.
