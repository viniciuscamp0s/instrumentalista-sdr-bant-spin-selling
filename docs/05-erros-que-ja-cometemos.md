# 05 · Os erros que nossos agentes já cometeram (e a trava de cada um)

> Mais de 170 incidentes reais em três agentes de produção (venda de serviço, venda de produto com ticket alto e
> atendimento com agendamento), de agosto a novembro de 2026. Aqui estão os que valem para qualquer negócio, com
> a trava que impede a repetição. Antes de dizer que o seu agente está pronto, passe por esta lista.

## Os 10 padrões que mais se repetiram

1. **O modelo parafraseia e vaza o que é interno** (jargão, nota de quem montou a ficha, comando de CRM).
2. **O modelo fala pelo lead** (responde a pergunta que o próprio agente fez).
3. **O estado da conversa muda por evento ambíguo** (eco do próprio envio, resposta automática do WhatsApp
   Business, fala da equipe).
4. **Classificador sem contexto marca PERDIDO por engano.**
5. **Freio ou pausa sem aviso fica invisível por dias.**
6. **Teste com serviço simulado passa e produção quebra.**
7. **Regra de julgamento escrita em prosa solta não existe para o modelo.**
8. **Conta que vira afirmação feita "de cabeça" pelo modelo.**
9. **Texto novo escrito do zero ignorando o padrão já aprovado.**
10. **Configuração com lacuna** (placeholder, "a definir") que o modelo completa sozinho.

**Regra-mãe:** o que o modelo não pode fazer tem trava no código, não só no prompt.

## O que o lead leu

| Sintoma | Causa | Trava |
|---|---|---|
| "Só pra finalizar a **qualificação**, você pode me dizer..." | o modelo parafraseou o roteiro e vazou termo interno | lista de termos proibidos no prompt; transição sem substantivo |
| O lead recebeu o texto cru do roteiro, com `→ Registrar {campo}` e `≥ 200`. Respondeu "não entendi, amigo" | notação de lógica e nota de sistema dentro do texto que vira prompt | a ficha só tem linguagem natural: condição vira frase ("se for 200 ou mais"), nada de seta, símbolo, comando |
| O agente respondeu "Ajuda sim." à pergunta que ele mesmo fez | a conversa chega como transcrição e nada dizia quem responde o quê | regra "quem é quem" no prompt **e** conferência que reprova sim/não ecoando a nossa pergunta (`respondeANossaPergunta`) |
| Ficha com "(confirmado pelo cliente)", "PENDENTE", data de briefing, comparação com outro cliente | quem montou anotou dentro do campo; o campo vai literal ao prompt | campo de ficha só leva o que o agente pode dizer. Teste: "se o agente falasse essa frase pro lead, soaria normal?" |
| Informou ao lead uma faixa de preço ("de 2 a 3 mil reais") que ninguém aprovou | a ficha tinha um placeholder "[preencher: faixa]" e o modelo completou com um valor plausível | **nunca deixe placeholder em configuração**; valor só da lista da ficha, conferido por código |
| Ofereceu "dois horários de visita" e "vou te mandar um áudio" | o material do cliente pedia o que o sistema não faz | nunca herdar do material do cliente uma capacidade que o agente não tem; regra fixa "não prometa o que não faz" posta pelo código |
| A abertura em 3 mensagens fixas chegou embolada, ou só uma saiu | burst de mensagens pré-escritas não é confiável | abertura em uma mensagem, no máximo duas, a segunda só depois da resposta |
| Mensagem de reativação pedindo desculpa pela demora | texto escrito do zero, ignorando o tom aprovado | todo texto nasce da ficha e do tom aprovado; "desculp" reprovado por código |
| Follow-up com "a agenda está enchendo, entre na frente da fila" | escassez que não era verdade | escassez só se for fato da ficha; termos de escassez recusados por código |
| Modelo barato assinou com o nome numa mensagem solta, se reapresentou no meio, mandou mensagem vazia | modelo pequeno lê a ficha ao pé da letra | "cuidados de escrita" no prompt; mensagem vazia reprovada por código; **teste cego** antes de trocar de modelo |
| Gravou `nivel: <nome do lead>` nas tags | o formato de saída aceitava qualquer coisa | saída estruturada com listas fechadas (`saida.schema.json`) |
| O agente perguntou de novo o que o lead tinha acabado de dizer (5 em 92 casos medidos) | roteiro numerado sem condição de saída; ordem "SEMPRE pergunte X" sem exceção | toda ordem imperativa traz na mesma frase a exceção "se já respondeu, não pergunte" com os sinais literais |
| Respondeu "fora do escopo" a um "Olá" e pulou a apresentação | regra de escopo ampla demais | saudação vazia nunca é fora do assunto |
| Fechou para agendamento com um lead que respondia seco ("indicação mesmo", "sim") e soou arrogante | a regra de "lead frio" estava em prosa solta, sem exemplo | **regra de julgamento tem lugar fixo no roteiro e exemplo literal do sinal**; lead frio se aquece com um fato antes da próxima pergunta |
| Calculou de cabeça um dado que virou afirmação ao cliente e errou 2 de 9; depois discutiu com quem corrigiu | a função de cálculo existia, mas só rodava depois da fala | **conta que vira afirmação nasce de função determinística chamada antes da fala**; se o cliente discordar, aceite, registre e siga |
| Afirmou disponibilidade (vaga, horário, estoque) que não consulta | instrução "adapte ao que foi perguntado" | **nunca garantir disponibilidade que o agente não consulta**; frase fixa, dizendo o que não se troca |
| Chamou o lead pelo nome de outra pessoa da família no follow-up | nome ambíguo gravado sem pergunta; a ferramenta não deixava corrigir | nome ambíguo se pergunta uma vez; todo dado que a IA grava tem caminho de correção pela própria IA |
| Lamentou o procedimento da própria empresa ("sei que isso atrapalha") | tom "acolhedor" puxando empatia para a regra da casa | nunca tratar procedimento ou canal da empresa como problema; empatia com a situação pessoal continua |
| Palavra em alfabeto estrangeiro no fim da mensagem; ano errado | modelo pequeno sem raciocínio | filtro de alfabeto estrangeiro no código; dado de calendário só se o lead escreveu |
| Link enviado como `[texto](url)` | formatação de markdown que o WhatsApp não lê | instrução de URL pura |

## O que o sistema fez com a conversa

| Sintoma | Causa | Trava |
|---|---|---|
| Qualquer "ok" do dono no celular parava o agente; 4 leads parados dias | fala da equipe trocava o dono da conversa | política explícita (`docs/02-motor.md`): troca só por botão ou pelo agente |
| A equipe e o agente se apresentaram ao mesmo lead com 7 minutos de diferença | a fala da equipe não pausava o agente no fluxo de atendimento | escolha a política certa para o seu caso; quem decide se o agente responde é código, nunca o julgamento dele |
| O eco do áudio que o próprio sistema mandou virou "humano assumiu" | eco não reconhecido | linha pendente gravada antes do envio, com o mesmo corpo do eco, por tipo de mensagem |
| Um disparo em massa ia desligar a IA em 852 conversas | cada eco do disparo virava "equipe digitou"; comparação por igualdade | campanha registrada antes do envio; reconhecimento por aproximação (80% das palavras) |
| A resposta automática do WhatsApp Business do cliente tirava o lead do agente (14 de 17) | mensagem automática lida como fala humana | marcar como automática, ou desligar a resposta automática do celular |
| O agente "não viu" a segunda mensagem e perguntou de novo | ela chegou durante a chamada à IA e foi ignorada | rodada de alcance + **descarte de resposta velha** |
| A mesma bolha duas vezes; a 2ª mensagem respondida como se fosse a 1ª | resposta a mensagem por mensagem | uma resposta por rajada (espera de 8 s depois da primeira resposta) |
| Registrou tudo e ficou 37 minutos sem responder | a rodada acabou sem texto por teto de passos e foi gravada como sucesso | **silêncio nunca é estado aceito**: rodada sem texto vira alerta e tarefa; ferramentas primeiro, texto por último |
| Respondeu 1 a 30 s depois da recusa e abriu cartão novo | a recusa chegou durante a geração | antes de enviar, confira se a etapa mudou; reabre o cartão perdido, nunca cria outro |
| A mesma pessoa virou duas conversas e foi saudada de novo | o canal tem dois identificadores para a mesma pessoa | busca pelos dois endereços |
| Resposta no grupo e em lista de transmissão | o parser tratava todo endereço como telefone | filtrar endereço que não é 1 para 1 antes de tudo |
| Cliente da casa tratado como lead novo | o cadastro existia mas não ia ao prompt | bloco "cliente já cadastrado" no contexto; cliente existente não recebe captação |
| Mensagem que o lead mandou durante um reinício se perdeu | a API não reenvia o webhook | reconciliação periódica das últimas mensagens |
| Lead preso: a resposta falhou ao enviar e contava como respondida | `falhou` tratado como `enviado` | envio que falhou não responde a pergunta; 3ª falha vai ao humano |
| Ordem da conversa trocada | hora do aparelho do lead | vale a hora em que a mensagem chegou ao servidor |
| A etapa que a equipe mudou à mão foi sobrescrita pelo agente | atualização sem condição | só muda se ninguém mexeu durante a geração |
| Um número sozinho podia gastar o teto do mês | sem limite por conversa | 20 chamadas por conversa por hora |
| Ligar o agente fez ele responder conversas antigas | sem janela de idade | pergunta com mais de 6 h não se responde; follow-up só de conversa com até 24 h |
| Aviso ao vendedor com o texto da conversa do lead | privacidade não pensada | aviso leva nome, motivo e link |

## Recusa e follow-up

| Sintoma | Causa | Trava |
|---|---|---|
| "Me tira uma dúvida" e "pode sair hoje?" viraram pedido para sair | padrão largo | padrões estreitos com teste (`recusa.mjs`) |
| "De onde tirou meu número? Quanto custa?" virou recusa | classificador sem a trava de interesse | preço, dúvida e curiosidade nunca são recusa |
| "Não" curto no meio da conversa virou PERDIDO | classificador sem contexto | o "não" curto só vale em resposta a toque ou prospecção |
| O follow-up parou 4 dias calado depois de alguém editar a ficha | a edição derrubou a aprovação e ninguém foi avisado | depois de qualquer mudança no texto, confira se o próximo toque saiu; todo freio avisa de novo todo dia |
| O freio de entregas ligou e ficou dias sem ninguém ver | freio sem alarme | freio ligado há 12 h ou mais gera alerta |
| Lead que nunca respondeu foi para a coluna FOLLOW UP 17 s depois do cadastro | follow-up tratado como etapa | follow-up é cadência; a coluna é para quem recebeu proposta. Inatividade conta da **primeira** mensagem nossa sem resposta, e o próprio toque não zera o relógio |
| O mesmo toque saiu duas vezes | erro do banco depois do envio devolveu a linha à fila | depois de enviado, nada devolve a linha |
| Texto idêntico em massa | sem variação | pelo menos 2 versões por toque, sorteio fora das que o lead já recebeu |

## Mídia, modelo e canal

| Sintoma | Causa | Trava |
|---|---|---|
| **Nenhum áudio foi transcrito em produção** (zero custo de transcrição registrado) | o download pedia a mensagem por id e a API não guardava mensagens; o teste simulado aceitava | guardar o ponteiro da mídia no webhook; prova contra o serviço real |
| Mídia nunca baixou na vida do sistema; bolha vazia no painel | a rotina de fundo usava credencial de sessão de usuário e falhava calada | rotina de fundo usa credencial de serviço; nenhuma mensagem fica sem corpo |
| A primeira resposta em produção quebrou | versão nova do SDK recusou o formato do pedido; o teste usava gerador falso | um teste pelo SDK de verdade |
| Custo 3 vezes maior que o necessário | opção de cache longo ignorada calada pelo modelo; dado variável no topo do prompt | prefixo estável; conferir no registro de gasto que o cache vale |
| O saldo pré-pago da API acabou e os leads ficaram 11 h sem resposta | sem alerta de saldo | alerta de saldo e de teto |
| A conferência automática aprovou o modelo que foi o pior na leitura humana | conferência mede forma, não qualidade | troca de modelo só com teste cego em conversas reais |
| Respostas de lead sumiam: 83 chegaram ao número, 4 entraram no sistema | biblioteca do WhatsApp com sessão quebrada; o erro só ia ao log | alarme de "enviou e não recebeu"; conexão aberta não prova recepção |
| O número caiu por bloqueio depois de misturar API oficial e não oficial | dois tipos de envio no mesmo número | um número, um tipo de API; prospecção nunca no número principal |
| O canal dos alertas ficou 4 dias desconectado sem ninguém saber | o alerta saía pelo próprio canal | o canal de alerta nunca é vigiado só por ele mesmo |
| Robôs consultando o banco sem trabalho travaram a produção | varredura completa a cada minuto | detecção incremental e alarme de uso |

## Antes de ligar em produção (checklist)

- [ ] O agente nasce desligado e em modo de teste, respondendo só a números de teste.
- [ ] Os 13 testes de `referencia/` passam na sua implementação (ou nas suas versões das travas).
- [ ] Você mandou: 3 mensagens seguidas, um áudio de 1 minuto, um print, um PDF, "é robô?", "quanto custa?" logo de
      cara, "não tenho interesse", "não, é a primeira vez", e um "ok" solto depois de uma pergunta do agente.
- [ ] Um humano escreveu do celular no meio da conversa e o agente fez o que a sua política diz.
- [ ] Você viu o eco de cada tipo de mensagem que o sistema envia sendo reconhecido.
- [ ] A ficha não tem placeholder, comentário editorial, seta, símbolo ou comando de CRM.
- [ ] Teto mensal, teto por conversa e alerta de saldo configurados.
- [ ] O follow-up tem o banco aprovado, com 2 versões por toque, e você viu o primeiro toque sair.
- [ ] Freio, pausa e falha geram alerta num canal diferente do WhatsApp do agente.
