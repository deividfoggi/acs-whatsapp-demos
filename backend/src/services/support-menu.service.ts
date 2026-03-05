import { CONFIG } from "../config.js";

/**
 * Serviço de menu de suporte estilo URA.
 * Simula um menu de atendimento telefônico (IVR/URA) via mensagens de texto no WhatsApp.
 * Usuários navegam enviando números (1–5), "0" para voltar ao menu principal e "#" para encerrar.
 */

/**
 * Rastreia o estado atual do menu para cada número de telefone.
 * Chave: telefone E.164, Valor: nível do menu (ex.: "main", "option_1", etc.)
 */
const sessionState = new Map<string, string>();

/** Se o modo de resposta automática do menu de suporte está ativo. */
let enabled = false;

/**
 * Ativa ou desativa o modo de resposta automática do menu de suporte.
 * @param value - true para ativar, false para desativar
 */
export function setSupportMenuEnabled(value: boolean): void {
  enabled = value;
  if (!value) {
    // Limpa todas as sessões ao desativar
    sessionState.clear();
  }
  console.log(`[SupportMenu] Resposta automática ${value ? "ativada" : "desativada"}`);
}

/**
 * Retorna se o modo de resposta automática está ativo.
 */
export function isSupportMenuEnabled(): boolean {
  return enabled;
}

/**
 * Reseta a sessão de um número de telefone específico.
 * @param phone - Número de telefone no formato E.164
 */
export function resetSession(phone: string): void {
  sessionState.delete(phone);
}

/**
 * Processa uma mensagem recebida pelo menu URA (switch/case).
 * Retorna o texto de resposta ou null se o menu estiver desativado.
 * @param phone - Número do remetente no formato E.164
 * @param messageText - Conteúdo da mensagem recebida
 * @returns Texto de resposta ou null se o menu estiver desativado
 */
export function processMenuMessage(phone: string, messageText: string): string | null {
  if (!enabled) {
    return null;
  }

  const input = messageText.trim();
  const currentState = sessionState.get(phone) ?? "main";

  // "#" encerra o atendimento a qualquer momento
  if (input === "#") {
    sessionState.delete(phone);
    return getGoodbyeMessage();
  }

  // "0" volta ao menu principal de qualquer submenu
  if (input === "0" && currentState !== "main") {
    sessionState.set(phone, "main");
    return getMainMenu();
  }

  switch (currentState) {
    case "main":
      return handleMainMenu(phone, input);

    case "option_1":
      return handleEnrollmentMenu(phone, input);

    case "option_2":
      return handleTuitionMenu(phone, input);

    case "option_3":
      return handleGradesMenu(phone, input);

    case "option_4":
      return handleAttendanceMenu(phone, input);

    case "option_5":
      return handleHumanAgentMenu(phone, input);

    default:
      sessionState.set(phone, "main");
      return getMainMenu();
  }
}

// ── Mensagem de encerramento ─────────────────────────────────

/**
 * Retorna a mensagem de encerramento do atendimento.
 */
function getGoodbyeMessage(): string {
  const companyName = CONFIG.COMPANY_NAME || "Contoso Education";
  return (
    `✅ *Atendimento encerrado*\n\n` +
    `Obrigado por entrar em contato com a *${companyName}*! ` +
    `Esperamos ter ajudado. 😊\n\n` +
    `Se precisar de algo mais, é só enviar uma nova mensagem a qualquer momento.`
  );
}

// ── Menu Principal ───────────────────────────────────────────

/**
 * Retorna o texto de saudação do menu principal.
 */
function getMainMenu(): string {
  const companyName = CONFIG.COMPANY_NAME || "Contoso Education";
  return (
    `👋 Olá! Bem-vindo(a) ao atendimento da *${companyName}*!\n\n` +
    `Digite o número da opção desejada:\n\n` +
    `1️⃣  Informações sobre Matrícula\n` +
    `2️⃣  Mensalidade e Pagamentos\n` +
    `3️⃣  Notas e Boletins\n` +
    `4️⃣  Frequência e Faltas\n` +
    `5️⃣  Falar com um Atendente\n\n` +
    `Digite o número (1-5) para continuar.\n` +
    `Digite *#* a qualquer momento para encerrar o atendimento.`
  );
}

/**
 * Processa a entrada do usuário no nível do menu principal.
 */
function handleMainMenu(phone: string, input: string): string {
  switch (input) {
    case "1":
      sessionState.set(phone, "option_1");
      return getEnrollmentMenu();

    case "2":
      sessionState.set(phone, "option_2");
      return getTuitionMenu();

    case "3":
      sessionState.set(phone, "option_3");
      return getGradesMenu();

    case "4":
      sessionState.set(phone, "option_4");
      return getAttendanceMenu();

    case "5":
      sessionState.set(phone, "option_5");
      return getHumanAgentMenu();

    default:
      // Primeira mensagem ou opção inválida — exibe o menu principal
      return getMainMenu();
  }
}

// ── Opção 1: Informações sobre Matrícula ─────────────────────

function getEnrollmentMenu(): string {
  return (
    `📋 *Informações sobre Matrícula*\n\n` +
    `Escolha um assunto:\n\n` +
    `1️⃣  Matrícula de novo aluno\n` +
    `2️⃣  Documentos necessários\n` +
    `3️⃣  Prazos de matrícula\n\n` +
    `Digite 0 para voltar ao menu principal.\n` +
    `Digite # para encerrar o atendimento.`
  );
}

function handleEnrollmentMenu(phone: string, input: string): string {
  switch (input) {
    case "1":
      return (
        `📝 *Matrícula de Novo Aluno*\n\n` +
        `Para matricular um novo aluno, visite nossa secretaria ou acesse o portal online em contoso.edu/matricula.\n\n` +
        `Horário de funcionamento: Segunda a Sexta, das 8h às 16h.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "2":
      return (
        `📄 *Documentos Necessários*\n\n` +
        `Tenha em mãos os seguintes documentos:\n` +
        `• Certidão de nascimento (original + cópia)\n` +
        `• Comprovante de residência (conta de luz/água)\n` +
        `• Histórico escolar anterior\n` +
        `• RG do responsável\n` +
        `• Carteira de vacinação atualizada\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "3":
      return (
        `📅 *Prazos de Matrícula*\n\n` +
        `• Matrícula antecipada: 15 de janeiro a 28 de fevereiro\n` +
        `• Matrícula regular: 1º de março a 30 de junho\n` +
        `• Matrícula tardia: 1º de julho a 15 de agosto (sujeita à disponibilidade)\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    default:
      return getEnrollmentMenu();
  }
}

// ── Opção 2: Mensalidade e Pagamentos ────────────────────────

function getTuitionMenu(): string {
  return (
    `💰 *Mensalidade e Pagamentos*\n\n` +
    `Escolha um assunto:\n\n` +
    `1️⃣  Valor da mensalidade\n` +
    `2️⃣  Formas de pagamento\n` +
    `3️⃣  Consulta de inadimplência\n\n` +
    `Digite 0 para voltar ao menu principal.\n` +
    `Digite # para encerrar o atendimento.`
  );
}

function handleTuitionMenu(phone: string, input: string): string {
  switch (input) {
    case "1":
      return (
        `🏷️ *Valor da Mensalidade*\n\n` +
        `• Ensino Fundamental I (1º ao 5º ano): R$ 1.200,00/mês\n` +
        `• Ensino Fundamental II (6º ao 9º ano): R$ 1.450,00/mês\n` +
        `• Ensino Médio (1ª a 3ª série): R$ 1.700,00/mês\n\n` +
        `Desconto de 10% para famílias com 2 ou mais alunos matriculados.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "2":
      return (
        `💳 *Formas de Pagamento*\n\n` +
        `Aceitamos as seguintes formas de pagamento:\n` +
        `• Cartão de crédito/débito (Visa, Mastercard)\n` +
        `• Transferência bancária\n` +
        `• PIX (Chave: pagamentos@contoso.edu)\n` +
        `• Boleto bancário\n\n` +
        `O vencimento é todo dia 10 de cada mês.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "3":
      return (
        `⚠️ *Consulta de Inadimplência*\n\n` +
        `Para consultar seu saldo, tenha em mãos o número de matrícula do aluno e acesse nosso portal financeiro em contoso.edu/financeiro ou ligue para (11) 3000-1234.\n\n` +
        `Nossa equipe financeira atende de segunda a sexta, das 8h às 17h.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    default:
      return getTuitionMenu();
  }
}

// ── Opção 3: Notas e Boletins ────────────────────────────────

function getGradesMenu(): string {
  return (
    `📊 *Notas e Boletins*\n\n` +
    `Escolha um assunto:\n\n` +
    `1️⃣  Consultar notas atuais\n` +
    `2️⃣  Calendário de boletins\n` +
    `3️⃣  Solicitar histórico escolar\n\n` +
    `Digite 0 para voltar ao menu principal.\n` +
    `Digite # para encerrar o atendimento.`
  );
}

function handleGradesMenu(phone: string, input: string): string {
  switch (input) {
    case "1":
      return (
        `📈 *Notas Atuais*\n\n` +
        `Você pode consultar as notas do seu filho(a) no portal do responsável:\n` +
        `🔗 contoso.edu/notas\n\n` +
        `Acesse com as credenciais enviadas ao seu e-mail cadastrado.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "2":
      return (
        `🗓️ *Calendário de Boletins*\n\n` +
        `Os boletins são emitidos trimestralmente:\n` +
        `• 1º Trimestre: 5 de abril\n` +
        `• 2º Trimestre: 10 de julho\n` +
        `• 3º Trimestre: 5 de outubro\n` +
        `• 4º Trimestre: 20 de dezembro\n\n` +
        `Cópias digitais ficam disponíveis no portal em até 2 dias úteis.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "3":
      return (
        `📜 *Histórico Escolar*\n\n` +
        `Para solicitar o histórico escolar oficial:\n` +
        `1. Acesse contoso.edu/historico\n` +
        `2. Preencha o formulário de solicitação\n` +
        `3. Prazo de processamento: 5 dias úteis\n\n` +
        `Taxa: R$ 35,00 por via.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    default:
      return getGradesMenu();
  }
}

// ── Opção 4: Frequência e Faltas ─────────────────────────────

function getAttendanceMenu(): string {
  return (
    `📅 *Frequência e Faltas*\n\n` +
    `Escolha um assunto:\n\n` +
    `1️⃣  Informar uma falta\n` +
    `2️⃣  Política de frequência\n` +
    `3️⃣  Solicitar saída antecipada\n\n` +
    `Digite 0 para voltar ao menu principal.\n` +
    `Digite # para encerrar o atendimento.`
  );
}

function handleAttendanceMenu(phone: string, input: string): string {
  switch (input) {
    case "1":
      return (
        `🏥 *Informar uma Falta*\n\n` +
        `Para comunicar a ausência de um aluno:\n` +
        `• Ligue para: (11) 3000-5678\n` +
        `• Ou envie e-mail para: frequencia@contoso.edu\n\n` +
        `Informe:\n` +
        `• Nome completo e série do aluno\n` +
        `• Data(s) da ausência\n` +
        `• Motivo da falta\n\n` +
        `As faltas devem ser comunicadas até as 8h do dia da ausência.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "2":
      return (
        `📖 *Política de Frequência*\n\n` +
        `• É necessário manter pelo menos 75% de presença por semestre.\n` +
        `• Após 3 faltas consecutivas não justificadas, será agendada uma reunião com os pais.\n` +
        `• Faltas por motivo médico exigem atestado em até 48 horas.\n` +
        `• Política completa: contoso.edu/politica-frequencia\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "3":
      return (
        `🚗 *Saída Antecipada*\n\n` +
        `Para solicitar saída antecipada:\n` +
        `1. Envie uma autorização por escrito à recepção até as 8h\n` +
        `2. Inclua o nome do aluno, série e horário de saída\n` +
        `3. O responsável deve apresentar documento com foto na retirada\n\n` +
        `Para solicitações no mesmo dia, ligue: (11) 3000-5678.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    default:
      return getAttendanceMenu();
  }
}

// ── Opção 5: Falar com um Atendente ──────────────────────────

function getHumanAgentMenu(): string {
  return (
    `🧑‍💼 *Falar com um Atendente*\n\n` +
    `Nossa equipe de atendimento está disponível:\n` +
    `📞 Telefone: (11) 3000-1234\n` +
    `📧 E-mail: suporte@contoso.edu\n\n` +
    `Horário de atendimento: Segunda a Sexta, das 8h às 17h.\n\n` +
    `O que deseja fazer?\n` +
    `1️⃣  Solicitar retorno de ligação\n` +
    `2️⃣  Enviar e-mail para o suporte\n\n` +
    `Digite 0 para voltar ao menu principal.\n` +
    `Digite # para encerrar o atendimento.`
  );
}

function handleHumanAgentMenu(phone: string, input: string): string {
  switch (input) {
    case "1":
      return (
        `📞 *Retorno Solicitado*\n\n` +
        `Registramos sua solicitação de retorno. Um atendente ligará para ${phone} em até 2 horas úteis.\n\n` +
        `Se não receber a ligação, entre em contato diretamente pelo (11) 3000-1234.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    case "2":
      return (
        `📧 *Suporte por E-mail*\n\n` +
        `Envie sua dúvida ou solicitação para:\n` +
        `✉️ suporte@contoso.edu\n\n` +
        `Inclua o nome do aluno e o número de matrícula para agilizar o atendimento. Respondemos em até 24 horas.\n\n` +
        `Digite 0 para voltar ao menu principal.\n` +
        `Digite # para encerrar o atendimento.`
      );

    default:
      return getHumanAgentMenu();
  }
}
