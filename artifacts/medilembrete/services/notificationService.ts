// Serviço de notificações locais do MediLembrete
import { Platform } from "react-native";
import { Medicamento } from "@/types";

const suportaNotificacoes = Platform.OS !== "web";

export async function requestPermissions(): Promise<boolean> {
  if (!suportaNotificacoes) return false;
  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (error) {
    console.error("Erro ao pedir permissões:", error);
    return false;
  }
}

export async function configurarNotificacoes(): Promise<void> {
  if (!suportaNotificacoes) return;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.error("Erro ao configurar notificações:", error);
  }
}

export async function scheduleNotification(medicamento: Medicamento): Promise<string[]> {
  if (!suportaNotificacoes) return [];
  try {
    const Notifications = await import("expo-notifications");
    const ids: string[] = [];

    for (const horario of medicamento.horarios) {
      const [horaStr, minutoStr] = horario.split(":");
      const hora = parseInt(horaStr, 10);
      const minuto = parseInt(minutoStr, 10);

      for (const diaSemana of medicamento.diasSemana) {
        const weekday = diaSemana + 1;
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Hora do teu medicamento!",
              body: `${medicamento.nome} — ${medicamento.dosagem}`,
              sound: true,
              data: { medicamentoId: medicamento.id, horario },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday,
              hour: hora,
              minute: minuto,
            },
          });
          ids.push(id);
        } catch {
          // continua mesmo se um falhar
        }
      }
    }
    return ids;
  } catch (error) {
    console.error("Erro ao agendar notificação:", error);
    return [];
  }
}

// Envia alerta imediato quando o stock está baixo
export async function notificarStockBaixo(medicamento: Medicamento): Promise<void> {
  if (!suportaNotificacoes) return;
  if (medicamento.estoque === null || medicamento.estoque > 5) return;

  try {
    const Notifications = await import("expo-notifications");
    const qtd = medicamento.estoque;
    const msg =
      qtd === 0
        ? `O stock de "${medicamento.nome}" esgotou! Trata de comprar mais.`
        : `"${medicamento.nome}" tem apenas ${qtd} dose${qtd === 1 ? "" : "s"} restante${qtd === 1 ? "" : "s"}. Reabastece já!`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: qtd === 0 ? "⛔ Stock esgotado!" : "⚠️ Stock quase a acabar!",
        body: msg,
        sound: true,
      },
      trigger: null, // imediato
    });
  } catch (error) {
    console.error("Erro ao notificar stock baixo:", error);
  }
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  if (!suportaNotificacoes || ids.length === 0) return;
  try {
    const Notifications = await import("expo-notifications");
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.error("Erro ao cancelar notificações:", error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (!suportaNotificacoes) return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Erro ao cancelar todas as notificações:", error);
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
