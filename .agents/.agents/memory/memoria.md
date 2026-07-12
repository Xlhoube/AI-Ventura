# 🌙 Memória da Construção da Luna

> Registo cronológico de todos os passos da construção do bot assistente pessoal **Luna**.  
> Última atualização: 25 de Maio de 2026 (21:55)

---

## 📌 Visão Geral do Projeto

**Luna** é um bot assistente pessoal no Telegram, alimentado pela IA Gemini do Google.  
Foi construído para a família do Sílvio (Sílvio, Lene e Gil) e alojado na nuvem (Render + Supabase).

- **Repositório GitHub:** [https://github.com/Xlhoube/Assitente](https://github.com/Xlhoube/Assitente)
- **Alojamento:** Render (free tier) + Supabase (PostgreSQL)
- **Linguagem:** Python 3
- **Stack principal:** `python-telegram-bot` · `google-genai` · `psycopg2` · `gTTS` · `pypdf` · `duckduckgo-search`

---

## 🏗️ Fases da Construção

---

### Fase 1 — Versão Inicial (assistente.py)

**O que foi feito:**
- Criação do primeiro ficheiro `assistente.py` com um bot Telegram básico.
- Integração com a API do Gemini para respostas de texto.
- Chaves API escritas diretamente no código (hardcoded) — **prática insegura, corrigida depois**.
- Resposta simples a mensagens de texto.

**Problemas identificados:**
- Credenciais expostas no código fonte.
- Sem controlo de acesso (qualquer pessoa poderia usar o bot).
- Sem memória de conversa entre mensagens.

---

### Fase 2 — Segurança e Variáveis de Ambiente

**O que foi feito:**
- Migração das chaves para um ficheiro `.env` (nunca partilhado publicamente).
- Uso da biblioteca `python-dotenv` para carregar as variáveis.
- Criação do `.gitignore` para excluir `.env` do repositório Git.
- Renomeação do ficheiro principal para `app.py`.
- Eliminação do `assistente.py` do repositório.
- Adição de `TELEGRAM_TOKEN`, `GEMINI_API_KEY` e `MEU_TELEGRAM_ID` ao `.env`.

**Variáveis de ambiente usadas:**
```
TELEGRAM_TOKEN=...
GEMINI_API_KEY=...
MEU_TELEGRAM_ID=...
DATABASE_URL=...
```

---

### Fase 3 — Controlo de Acesso e Personalidade

**O que foi feito:**
- Implementação de verificação de ID de utilizador (`e_utilizador_autorizado()`).
- Apenas os IDs registados no `.env` conseguem usar o bot.
- Utilizadores não autorizados recebem mensagem de acesso negado com instruções.
- Definição da personalidade da Luna:
  - Nome: **Luna**
  - Língua: Português de Portugal
  - Tom: caloroso, natural, amigo, profissional
  - Nunca se identifica como IA ou modelo do Google
- Sistema de múltiplos IDs (`MEUS_TELEGRAM_IDS`) com fallback para o ID antigo (`MEU_TELEGRAM_ID`).

---

### Fase 4 — Memória de Conversa e Sessões

**O que foi feito:**
- Criação de sessões de chat por utilizador (`sessoes_chat: dict`).
- A Luna mantém o contexto da conversa durante a sessão.
- Comando `/start` reinicia a memória da conversa.
- Comando `/ajuda` lista as funcionalidades disponíveis.
- Perfil personalizado por utilizador (`NOMES_UTILIZADORES`):
  - Sílvio (ID: 5004093342) — "o Sílvio, casado com a Lene e pai do Gil"
  - Espaço reservado para Lene e Gil serem adicionados futuramente.

---

### Fase 5 — Ferramentas da IA (Function Calling)

**O que foi feito:**
- Integração de ferramentas que a IA pode invocar automaticamente (Gemini Function Calling).
- A Luna decide autonomamente quando usar cada ferramenta.

**Ferramentas implementadas:**

| Ferramenta | Descrição |
|---|---|
| `obter_data_hora_atual()` | Devolve a data e hora para qualquer fuso horário |
| `obter_meteorologia()` | Consulta o tempo atual via `wttr.in` |
| `registar_nota_projeto()` | Guarda notas técnicas de projetos na BD |
| `adicionar_lembrete_familiar()` | Adiciona lembretes à lista familiar |
| `consultar_lembretes_familiares()` | Lê a lista familiar da BD |
| `consultar_notas_projetos()` | Lê as notas de projetos da BD |

---

### Fase 6 — Base de Dados PostgreSQL (Supabase)

**O que foi feito:**
- Ligação ao Supabase (PostgreSQL na cloud) via `psycopg2`.
- Correção automática do prefixo `postgres://` → `postgresql://`.
- Criação automática das tabelas na primeira execução (`inicializar_bd()`).
- Função genérica `executar_query()` para todas as operações SQL.

**Tabelas criadas:**

```sql
-- Lembretes e tarefas familiares
CREATE TABLE lista_familia (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lembrete TEXT NOT NULL
);

-- Notas e ideias de projetos de software
CREATE TABLE notas_projetos (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nome_projeto VARCHAR(100) NOT NULL,
    nota TEXT NOT NULL
);

-- Lembretes com notificação ativa (alarmes)
CREATE TABLE lembretes_ativos (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    mensagem TEXT NOT NULL,
    data_hora_lembrete TIMESTAMP WITH TIME ZONE NOT NULL,
    disparado BOOLEAN DEFAULT FALSE
);
```

---

### Fase 7 — Lembretes com Notificação Ativa (Alarmes)

**O que foi feito:**
- Nova ferramenta `agendar_lembrete_ativo()` para a IA agendar notificações.
- Loop em segundo plano `verificar_lembretes_background()` que corre a cada 60 segundos.
- Quando chega a hora, a Luna envia automaticamente uma mensagem no Telegram.
- O `chat_id` é sempre injetado nas instruções do sistema para a IA usar corretamente.
- Uso de `asyncio.create_task()` via callback `post_init()`.

---

### Fase 8 — Mensagens Multimodais (Fotos e Voz)

**O que foi feito:**
- **Fotos:** Handler `receber_foto()` — descarrega a imagem e envia ao Gemini para análise.
- **Voz:** Handler `receber_voz()` — descarrega o áudio OGG (Opus) e envia ao Gemini para transcrição e resposta.
- A legenda da foto ou voz é usada como pergunta à IA.
- Se não houver legenda, a IA descreve o conteúdo por iniciativa própria.
- Uso de `types.Part.from_bytes()` com o MIME type correto.

---

### Fase 9 — Localização GPS

**O que foi feito:**
- Handler `receber_localizacao()` processa coordenadas GPS enviadas pelo Telegram.
- As coordenadas são injetadas no contexto da sessão da IA.
- A Luna consegue consultar o tempo atual para a localização exata do utilizador.
- Suporte para a pergunta "qual é o tempo aqui?" após partilha de GPS.

---

### Fase 10 — Deploy na Nuvem (Render + GitHub)

**O que foi feito:**
- Inicialização do repositório Git local (`git init`).
- Ligação ao repositório remoto em `https://github.com/Xlhoube/Assitente`.
- Configuração do `.gitignore` para proteger o `.env` e ficheiros desnecessários.
- Criação do `deploy.ps1` — script PowerShell para automatizar o deploy com um comando.
- Configuração do Render para deploy automático a cada push no GitHub.
- Modo Webhook configurado para produção (variável `RENDER_EXTERNAL_URL`).
- Modo Polling configurado para desenvolvimento local.

**Script deploy.ps1:**
```powershell
git add .
git commit -m "Deploy automático"
git push origin main
```

**Nota sobre o Render free tier:**
> O servidor hiberna após 15 minutos de inatividade. A primeira mensagem após hibernação pode demorar ~50 segundos. Solução: upgrade para plano pago ou usar UptimeRobot para fazer pings periódicos.

---

### Fase 11 — Ajuste de Personalidade

**O que foi feito:**
- Remoção de intimidades excessivas nas instruções do sistema (ex: "meu querido", "amor").
- Ajuste do tom para: **caloroso mas profissional**.
- A Luna trata o utilizador pelo nome mas mantém postura de assistente profissional.

---

### Fase 12 — Pesquisa Web em Tempo Real 🌐

**O que foi feito:**
- Nova ferramenta `pesquisar_web(query)` usando a biblioteca `duckduckgo-search`.
- A IA usa-a automaticamente quando o utilizador pergunta sobre notícias, eventos atuais, preços, resultados desportivos, etc.
- Resultados em Português de Portugal (região `pt-pt`).
- Máximo de 5 resultados por pesquisa.

---

### Fase 13 — Resumo de Links/URLs 🔗

**O que foi feito:**
- Nova ferramenta `resumir_link(url)` que acede à página e extrai o texto principal.
- Uso de `BeautifulSoup` + `lxml` para parsear o HTML.
- Remoção automática de menus, scripts, rodapés e outros elementos desnecessários.
- Deteção automática de URLs nas mensagens de texto (`detectar_urls()`).
- Quando o utilizador envia só um link, a Luna resume-o automaticamente.

---

### Fase 14 — Leitura de Documentos 📄

**O que foi feito:**
- Novo handler `receber_documento()` para processar ficheiros enviados no Telegram.
- Suporte para os formatos:

| Formato | Biblioteca | Método |
|---|---|---|
| PDF | `pypdf` | `PdfReader` — extração página a página |
| Word (.docx) | `python-docx` | `Document` — extração de parágrafos |
| Excel (.xlsx) | `openpyxl` | `load_workbook` — extração célula a célula |
| Texto (.txt) | built-in | Decode UTF-8 |
| CSV (.csv) | built-in | Leitura linha a linha |

- O utilizador pode enviar o documento **com uma pergunta na legenda** (ex: "qual é o total desta fatura?").
- Se não houver legenda, a Luna faz um resumo automático.
- Limite de ~12.000 caracteres enviados à IA para não exceder o contexto.
- Documentos maiores são truncados com aviso.

---

### Fase 15 — Resposta por Voz (gTTS) 🔊

**O que foi feito:**
- Nova função `gerar_e_enviar_voz()` usando `gTTS` (Google Text-to-Speech).
- **Modo automático:** quando o utilizador envia uma mensagem de voz, a Luna responde **sempre** com texto + voz.
- **Modo manual:** comando `/voz` para ligar/desligar respostas por voz em conversas de texto.
- O áudio é gerado em memória (sem ficheiros temporários no disco).
- O texto é limpo de markdown antes da síntese (remove `*`, `_`, `#`, etc.).
- Idioma: Português de Portugal (`lang='pt', tld='pt'`).

---

### Fase 16 — Correção do Erro 404 (Modelos Preview Descontinuados)

**O que foi feito:**
- Atualização do modelo do Gemini de `gemini-2.5-flash-preview-04-17` para o alias de produção estável `gemini-2.5-flash`.
- Resolução do erro 404 (NOT_FOUND) da API do Gemini, causado pela descontinuação das versões preview mais antigas (`04-17` e `05-20`).
- A adoção do alias genérico estável (`gemini-2.5-flash`) previne futuras falhas semelhantes quando o modelo for atualizado pela Google.

---

### Fase 17 — Gestão Avançada de Lembretes/Notas e Histórico Persistente (Supabase)

**O que foi feito:**
- **IDs Visíveis**: Atualização das consultas `consultar_lembretes_familiares()` e `consultar_notas_projetos()` para retornarem o ID numérico associado de cada registo na base de dados (Supabase).
- **Ferramentas de Eliminação**: Criação e registo das funções `eliminar_lembrete_familiar(id_lembrete)` e `eliminar_nota_projeto(id_nota)` expostas à Luna.
- **Instruções Reforçadas**: Atualização da `system_instruction` para instruir a Luna a recolher o ID apropriado a partir de uma consulta antes de invocar a eliminação de um item quando o utilizador o solicita.
- **Histórico Persistente**: Criação da tabela `historico_conversas` no Supabase com uma coluna `sessao_ativa`.
- **Injeção de Memória**: Ao criar uma nova sessão do bot (ex: após restart ou hibernação do servidor gratuito do Render), as últimas 30 mensagens ativas são carregadas do Supabase e injetadas na API Gemini, garantindo contexto contínuo.
- **Gestão do /start**: O comando `/start` altera o estado das mensagens anteriores para inativas (`sessao_ativa = FALSE`), preservando o histórico para sempre na base de dados e reiniciando a memória da Luna do ponto de vista do utilizador.
- **Gravação nos Handlers**: Atualização de todos os handlers (`responder`, `receber_localizacao`, `receber_foto`, `receber_voz` e `receber_documento`) para salvar no histórico de forma otimizada.

---

### Fase 18 — Interface Web para Smartwatch e Migração para FastAPI 🌐⌚

**O que foi feito:**
- **Servidor FastAPI**: Migração do ciclo de webhook do Telegram para um servidor assíncrono unificado sob **FastAPI** e **Uvicorn** rodando na mesma porta no Render.
- **Ciclo de Vida Assíncrono**: Uso do `lifespan` do FastAPI para inicializar, configurar e parar as aplicações de Telegram concorrentemente (Webhook em produção, Polling local em desenvolvimento, loop de lembretes ativo).
- **Web App Smartwatch**: Criação de uma Single Page App (SPA) minimalista e premium (`INTERFACE_HTML_SMARTWATCH`) adaptada a ecrãs de smartwatches (redondos ou quadrados).
- **Gravação Web Audio**: Lógica Javascript para aceder ao microfone do relógio (`MediaRecorder` com fallback para formatos de codecs suportados) e feedback táctil (vibração 60ms) ao gravar.
- **Botão Gigante (400px)**: Redimensionamento do botão central para 400px de diâmetro (com ícone a 120px e container a 420px) para preencher a totalidade do ecrã e garantir facilidade absoluta de clique em smartwatches (como o Galaxy Watch 7).
- **Personalidade sem Emojis e Atualização de Modelo (gemini-3.5-flash)**: Configuração da Luna com o modelo mais recente de produção Gemini 3.5 Flash e inclusão de instrução restritiva no sistema do Gemini (`system_instruction`) para que a Luna não use emojis nem caracteres gráficos nas suas respostas, resolvendo adicionalmente as limitações de quota do modelo anterior.
- **Integração de Sessões**: O smartwatch comunica com a API `/api/voz?chat_id=ID`, o que faz a Luna responder usando o mesmo contexto de conversa e histórico do bot de Telegram desse utilizador.
- **Resposta por Voz**: A resposta de voz do Gemini é convertida em MP3 (via gTTS) e devolvida no corpo de resposta HTTP para ser reproduzida automaticamente pelo altifalante/auriculares do smartwatch.

### Fase 19 — Failover Automático de Modelos Gemini e Redimensionamento 🔄📐

**O que foi feito:**
- **Sistemas de Failover de Modelos**: Introdução de uma lista ordenada de modelos Gemini de backup (`gemini-3.5-flash`, `gemini-3.0-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`) e controlo dinâmico do modelo ativo por utilizador/chat.
- **Failover Transparente**: Implementação da função `enviar_mensagem_com_failover` que interceta erros de exaustão de quota (`429 RESOURCE_EXHAUSTED`) e recria a sessão automaticamente usando o próximo modelo Gemini disponível, sem que o utilizador note a mudança.
- **Prevenção de Poluição de Histórico**: Ajuste da lógica de histórico no Supabase para gravar a mensagem do utilizador apenas após a IA responder com sucesso. Deste modo, evita-se a duplicação ou incoerência de mensagens no histórico quando a sessão do chat é recriada.
- **Reset no `/start`**: O comando `/start` agora repõe o modelo preferencial (primeiro da lista de preferência) para restabelecer a melhor experiência possível.
- **Ajuste do Tamanho dos Botões (350px)**: Redução do tamanho da esfera central e ondas de pulsação na interface web do smartwatch de 400px para 350px (e do container para 370px) para melhorar o enquadramento estético e usabilidade.

---

### Fase 20 — Envio Automático de Notícias Matinais Diárias 📰☀️

**O que foi feito:**
- **Controlo de Envio Único Diário**: Criação da tabela `noticias_diarias_enviadas` com uma restrição `UNIQUE (chat_id, data_envio)` no Supabase, garantindo que as notícias são enviadas apenas uma vez por dia por utilizador, mesmo sob restarts ou reinstalações do bot no Render.
- **Tarefa de Agendamento em Segundo Plano**: Implementação da função `enviar_noticias_diarias_background(app)` que corre de forma assíncrona e contínua.
- **Deteção de Fuso Horário e Horário**: Verificação da hora local de Portugal (`Europe/Lisbon`) para disparar o resumo matinal exatamente entre as 08:00 e as 09:00 de forma automática.
- **Pesquisa e Resumo de Notícias**: O loop aciona a IA (usando failover automático) para efetuar a pesquisa das notícias mais recentes de Portugal usando a ferramenta `pesquisar_web` e criar um resumo executivo com as 5 principais notícias do dia.
- **Registo Concorrente de Lifespan/Callback**: Injeção da nova tarefa em segundo plano tanto no `post_init` (modo Polling) como no `lifespan` do FastAPI (modo Webhook).

---

### Fase 21 — Correção de Contexto de Lembretes Ativos e Notificações de Background ⏰🧠

**O que foi feito:**
- **Histórico de Lembretes Disparados**: Correção de `verificar_lembretes_background` para que, ao disparar um lembrete ativo ao utilizador, este seja registado no histórico de conversas (`historico_conversas`) como uma mensagem do `model`.
- **Reset do Cache de Sessão**: Implementação de reset da sessão em memória via `sessoes_chat.pop(chat_id, None)` tanto após disparar um lembrete como após o envio de notícias diárias. No próximo contacto do utilizador, a sessão de chat do Gemini é reconstruída com a totalidade do histórico atualizado.
- **Fusão de Papéis no Histórico**: Correção de `carregar_historico_db` para fundir automaticamente mensagens consecutivas com o mesmo papel (`user` ou `model`). Isto impede erros da API do Gemini (`400 Expecting alternating user/model sessions`) causados pela inserção de mensagens de segundo plano ou pelo envio múltiplo de mensagens do utilizador.

---

### Fase 22 — Expansão de Memória e Pesquisa de Histórico de Conversas 🧠🔍

**O que foi feito:**
- **Aumento do Limite da Sessão Ativa**: Alterado o limite de histórico carregado da base de dados de 30 para 100 mensagens (em `carregar_historico_db` e na inicialização da sessão), permitindo um contexto de curto/médio prazo muito mais longo.
- **Histórico Persistente no `/start`**: Comentada a query que marcava as mensagens anteriores como inativas no comando `/start`. Agora, a Luna mantém o histórico de conversas anteriores ativo mesmo após reiniciar a sessão local.
- **Ferramenta de Pesquisa de Histórico**: Criada e registada a função `pesquisar_historico_conversas(chat_id, termo_pesquisa)` exposta como ferramenta ao Gemini. Esta ferramenta realiza buscas `ILIKE` na tabela `historico_conversas` por palavras-chave e retorna as 15 correspondências mais recentes, permitindo à Luna recordar de forma autónoma detalhes ditos no passado que já saíram do contexto das 100 mensagens recentes.

---

### Fase 23 — Substituição do Cron Job por GitHub Actions 🔄

**O que foi feito:**
- **Workflow Nativo:** Criação de um GitHub Action (`.github/workflows/keep-alive.yml`) agendado para correr a cada 14 minutos e disparar um pedido HTTP `GET` para o endpoint `/ping` (em `https://luna-bot-a2nh.onrender.com/ping`).
- **Prevenção de Hibernação:** Como o Render suspende máquinas do plano gratuito após 15 minutos de inatividade, este método nativo substitui ferramentas externas falíveis (como cron-job.org), assegurando que o bot permanece responsivo (sujeito às quotas mensais de horas do Render).

---

### Fase 24 — Humanização da Personalidade (Empatia e Emojis) 🌙

**O que foi feito:**
- **Reativação de Emojis:** A restrição total do uso de emojis foi removida das instruções do sistema. A Luna pode agora usar emojis moderadamente para se exprimir de forma mais viva e humana.
- **Empatia Proativa:** Adicionada uma diretriz central para a Luna agir como uma amiga próxima da família, demonstrando interesse genuíno e sendo proativa a fazer perguntas de acompanhamento durante as conversas.
- **Ajuste de Tom:** Transição de uma postura estritamente "profissional e educada" para um tom mais informal e empático, mantendo apenas o filtro contra intimidades excessivas (como tratamentos de "amor" ou "querido").

---

## 📋 Comandos Disponíveis (versão atual)

| Comando | Descrição |
|---|---|
| `/start` | Inicia o bot e reinicia a memória da conversa |
| `/ajuda` | Mostra todos os comandos e funcionalidades |
| `/lembretes` | Mostra a lista familiar guardada na BD |
| `/notas` | Mostra as notas de projetos guardadas na BD |
| `/voz` | Liga/desliga respostas por voz |

---

## 📦 Dependências (requirements.txt)

```
python-telegram-bot[webhooks]   # Framework do bot Telegram
google-genai                    # API Gemini (IA)
requests                        # Chamadas HTTP (meteorologia)
python-dotenv                   # Carregamento do .env
psycopg2-binary                 # Ligação ao PostgreSQL (Supabase)
tzdata                          # Fusos horários
pypdf                           # Leitura de PDFs
python-docx                     # Leitura de Word (.docx)
openpyxl                        # Leitura de Excel (.xlsx)
duckduckgo-search               # Pesquisa web em tempo real
beautifulsoup4                  # Parsing de HTML (resumo de links)
lxml                            # Parser HTML rápido
gTTS                            # Síntese de voz (Text-to-Speech)
```

---

## 🗂️ Estrutura do Projeto

```
Luna/
├── app.py              # Código principal do bot
├── requirements.txt    # Dependências Python
├── deploy.ps1          # Script de deploy automático para GitHub
├── memoria.md          # Este ficheiro — registo da construção
├── .env                # Variáveis de ambiente (NUNCA partilhar!)
└── .gitignore          # Ficheiros excluídos do Git
```

---

## 🔐 Variáveis de Ambiente (.env)

| Variável | Descrição |
|---|---|
| `TELEGRAM_TOKEN` | Token do bot no BotFather |
| `GEMINI_API_KEY` | Chave da API do Google Gemini |
| `MEU_TELEGRAM_ID` | ID Telegram do Sílvio (fallback) |
| `MEUS_TELEGRAM_IDS` | Lista de IDs autorizados separados por vírgula |
| `DATABASE_URL` | URL de ligação ao Supabase (PostgreSQL) |

---

## 🚀 Funcionalidades Futuras (por implementar)

- [ ] Suporte para ficheiros `.doc` antigos (Word 97-2003)
- [ ] Resposta por voz com ElevenLabs (voz mais natural e personalizada)
- [ ] Suporte para múltiplos utilizadores simultâneos com BD separada por utilizador
- [ ] Histórico de conversas guardado na base de dados
- [ ] Comando `/historico` para rever conversas antigas
- [ ] Integração com Google Calendar para lembretes sincronizados
- [ ] Suporte para mensagens de áudio longas (podcasts, gravações)

---

## 👨‍👩‍👦 Família Autorizada

| Nome | ID Telegram | Relação | Estado |
|---|---|---|---|
| Sílvio | 5004093342 | Pai / construtor da Luna | ✅ Configurado |
| Lene | — | Esposa do Sílvio | ⏳ ID por adicionar |
| Gil | — | Filho do Sílvio e da Lene | ⏳ ID por adicionar |

> Para adicionar Lene ou Gil: pede-lhes que enviem `/start` ao bot (ele mostrará o ID deles), depois adiciona ao ficheiro `.env`:
> ```
> MEUS_TELEGRAM_IDS=5004093342,ID_DA_LENE,ID_DO_GIL
> ```

---

*Construído com ❤️ pelo Sílvio, com a ajuda da Antigravity AI.*
