// Serviço de notificações locais do MediLembrete
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Medicamento } from "@/types";

const suportaNotificacoes = Platform.OS !== "web";
const CHAVE_CONFIG = "@medilembrete:config_notificacoes";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ConfigNotificacoes {
  lembretesMedicamentos: boolean;
  alertasStockBaixo: boolean;
  silencioNoturnoAtivo: boolean;
  silencioInicio: string;
  silencioFim: string;
}

const CONFIG_PADRAO: ConfigNotificacoes = {
  lembretesMedicamentos: true,
  alertasStockBaixo: true,
  silencioNoturnoAtivo: false,
  silencioInicio: "22:00",
  silencioFim: "07:00",
};

// ─── Helpers internos ─────────────────────────────────────────────────────────

async function lerConfig(): Promise<ConfigNotificacoes> {
  try {
    const raw = await AsyncStorage.getItem(CHAVE_CONFIG);
    if (raw) return { ...CONFIG_PADRAO, ...JSON.parse(raw) };
  } catch {}
  return CONFIG_PADRAO;
}

/** Converte "HH:MM" em minutos desde meia-noite */
function paraMinutos(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Verifica se um horário cai dentro do período de silêncio noturno.
 * Suporta períodos que passam da meia-noite (ex: 22:00 → 07:00).
 */
function isHorarioEmSilencio(
  horario: string,
  inicio: string,
  fim: string
): boolean {
  const t = paraMinutos(horario);
  const s = paraMinutos(inicio);
  const f = paraMinutos(fim);
  if (s > f) {
    // Período nocturno passa da meia-noite
    return t >= s || t < f;
  }
  return t >= s && t < f;
}

/** Emoji por categoria de medicamento */
function emojiCategoria(categoria: string): string {
  const mapa: Record<string, string> = {
    comprimido: "💊",
    xarope: "🥄",
    injecao: "💉",
    pomada: "🧴",
    colurio: "👁️",
    inalador: "💨",
  };
  return mapa[categoria] ?? "💊";
}

// ─── Permissões ───────────────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  if (!suportaNotificacoes) return false;
  try {
    const Notifications = await import("expo-notifications");
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

// ─── Configuração do handler ──────────────────────────────────────────────────

export async function configurarNotificacoes(): Promise<void> {
  if (!suportaNotificacoes) return;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async (notif) => {
        // Verificar silêncio noturno em tempo real (quando a app está em foreground)
        try {
          const config = await lerConfig();
          if (config.silencioNoturnoAtivo) {
            const agora = new Date();
            const horarioAgora = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
            if (isHorarioEmSilencio(horarioAgora, config.silencioInicio, config.silencioFim)) {
              return {
                shouldShowAlert: false,
                shouldPlaySound: false,
                shouldSetBadge: false,
                shouldShowBanner: false,
                shouldShowList: false,
              };
            }
          }
          // Verificar se categoria é alerta de stock (bypass silêncio)
          const isStock = notif.request.content.data?.tipo === "stock";
          if (isStock && !config.alertasStockBaixo) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
          if (!isStock && !config.lembretesMedicamentos) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
        } catch {}
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  } catch {}
}

// ─── Agendar notificações ─────────────────────────────────────────────────────

/**
 * Agenda notificações recorrentes para um medicamento.
 * Respeita silêncio noturno se config for fornecida.
 * Usa trigger DAILY quando todos os 7 dias estão seleccionados.
 */
export async function scheduleNotification(
  medicamento: Medicamento,
  config?: ConfigNotificacoes
): Promise<string[]> {
  if (!suportaNotificacoes) return [];
  if (!medicamento.ativo) return [];

  try {
    const Notifications = await import("expo-notifications");
    const cfg = config ?? (await lerConfig());

    if (!cfg.lembretesMedicamentos) return [];

    const ids: string[] = [];
    const emoji = emojiCategoria(medicamento.categoria);
    const todosOsDias = medicamento.diasSemana.length === 7;

    for (const horario of medicamento.horarios) {
      // Filtrar horários em silêncio noturno
      if (
        cfg.silencioNoturnoAtivo &&
        isHorarioEmSilencio(horario, cfg.silencioInicio, cfg.silencioFim)
      ) {
        continue;
      }

      const [horaStr, minutoStr] = horario.split(":");
      const hora = parseInt(horaStr, 10);
      const minuto = parseInt(minutoStr, 10);

      const conteudo = {
        title: `${emoji} Hora do medicamento`,
        body: `${medicamento.nome} — ${medicamento.dosagem}`,
        sound: true,
        data: { medicamentoId: medicamento.id, horario, tipo: "lembrete" },
      };

      if (todosOsDias) {
        // Trigger diário (mais eficiente que 7 triggers semanais)
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: conteudo,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: hora,
              minute: minuto,
            },
          });
          ids.push(id);
        } catch {}
      } else {
        // Trigger semanal por dia seleccionado
        for (const dia of medicamento.diasSemana) {
          try {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                ...conteudo,
                body: `${medicamento.nome} — ${medicamento.dosagem}`,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dia + 1, // expo: 1=Dom … 7=Sáb
                hour: hora,
                minute: minuto,
              },
            });
            ids.push(id);
          } catch {}
        }
      }
    }

    return ids;
  } catch {
    return [];
  }
}

// ─── Reagendar tudo ───────────────────────────────────────────────────────────

/**
 * Cancela TODAS as notificações de lembretes e reagenda todos os medicamentos
 * activos respeitando a configuração actual (silêncio noturno, toggles, etc.).
 *
 * Deve ser chamado:
 *  - No arranque da app (recupera de reboot do telefone que apagou agendamentos Android)
 *  - Quando o utilizador altera configurações de silêncio noturno
 *  - Quando o utilizador toca "Reagendar tudo" nas configurações
 *
 * Retorna mapa { medicamentoId → ids[] } para actualizar o storage.
 */
export async function reagendarTodasNotificacoes(
  medicamentos: Medicamento[]
): Promise<Record<string, string[]>> {
  if (!suportaNotificacoes) return {};

  try {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();

    const config = await lerConfig();
    if (!config.lembretesMedicamentos) return {};

    const resultado: Record<string, string[]> = {};

    for (const med of medicamentos.filter((m) => m.ativo)) {
      const ids = await scheduleNotification(med, config);
      resultado[med.id] = ids;
    }

    return resultado;
  } catch {
    return {};
  }
}

// ─── Alerta de stock baixo ────────────────────────────────────────────────────

export async function notificarStockBaixo(medicamento: Medicamento): Promise<void> {
  if (!suportaNotificacoes) return;
  if (medicamento.estoque === null || medicamento.estoque > 5) return;

  try {
    const config = await lerConfig();
    if (!config.alertasStockBaixo) return;

    const Notifications = await import("expo-notifications");
    const qtd = medicamento.estoque;
    const emoji = emojiCategoria(medicamento.categoria);

    const titulo = qtd === 0 ? "⛔ Stock esgotado!" : "⚠️ Stock quase a acabar!";
    const corpo =
      qtd === 0
        ? `${emoji} "${medicamento.nome}" esgotou! Trata de comprar mais.`
        : `${emoji} "${medicamento.nome}" tem só ${qtd} dose${qtd === 1 ? "" : "s"} restante${qtd === 1 ? "" : "s"}. Reabastece já!`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
        data: { medicamentoId: medicamento.id, tipo: "stock" },
      },
      trigger: null, // imediato
    });
  } catch {}
}

// ─── Cancelar ─────────────────────────────────────────────────────────────────

export async function cancelNotifications(ids: string[]): Promise<void> {
  if (!suportaNotificacoes || ids.length === 0) return;
  try {
    const Notifications = await import("expo-notifications");
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  if (!suportaNotificacoes) return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

// ─── Info ─────────────────────────────────────────────────────────────────────

export async function obterTotalNotificacoesAgendadas(): Promise<number> {
  if (!suportaNotificacoes) return 0;
  try {
    const Notifications = await import("expo-notifications");
    const lista = await Notifications.getAllScheduledNotificationsAsync();
    return lista.length;
  } catch {
    return 0;
  }
}

export async function listScheduledNotifications(): Promise<unknown[]> {
  if (!suportaNotificacoes) return [];
  try {
    const Notifications = await import("expo-notifications");
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}
