// Serviço de notificações locais do MediLembrete
import { Platform } from "react-native";
import { Medicamento } from "@/types";

// Verifica se estamos numa plataforma que suporta notificações
const suportaNotificacoes = Platform.OS !== "web";

// Pede permissão ao utilizador para enviar notificações
export async function requestPermissions(): Promise<boolean> {
  if (!suportaNotificacoes) return false;
  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (error) {
    console.error("Erro ao pedir permissões de notificação:", error);
    return false;
  }
}

// Configura o handler de notificações (chamar no arranque do app)
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

// Agenda notificações para um medicamento
export async function scheduleNotification(
  medicamento: Medicamento
): Promise<string[]> {
  if (!suportaNotificacoes) return [];
  try {
    const Notifications = await import("expo-notifications");
    const ids: string[] = [];

    for (const horario of medicamento.horarios) {
      const [horaStr, minutoStr] = horario.split(":");
      const hora = parseInt(horaStr, 10);
      const minuto = parseInt(minutoStr, 10);

      for (const diaSemana of medicamento.diasSemana) {
        // expo-notifications: weekday 1=Domingo, 2=Segunda, ..., 7=Sábado
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
          // Continua com os outros horários mesmo se um falhar
        }
      }
    }
    return ids;
  } catch (error) {
    console.error("Erro ao agendar notificação:", error);
    return [];
  }
}

// Cancela todas as notificações de um medicamento
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

// Cancela todas as notificações do app
export async function cancelAllNotifications(): Promise<void> {
  if (!suportaNotificacoes) return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Erro ao cancelar todas as notificações:", error);
  }
}

// Lista notificações agendadas (para debug)
export async function listScheduledNotifications(): Promise<unknown[]> {
  if (!suportaNotificacoes) return [];
  try {
    const Notifications = await import("expo-notifications");
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}
