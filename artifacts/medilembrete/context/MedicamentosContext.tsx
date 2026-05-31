// Contexto global para gerir medicamentos e histórico
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Medicamento, RegistoHistorico } from "@/types";
import {
  deleteMedicamento,
  gerarId,
  getHistorico,
  getMedicamentos,
  saveRegistoHistorico,
  saveMedicamento,
  updateMedicamento,
} from "@/services/storageService";
import {
  cancelNotifications,
  configurarNotificacoes,
  notificarStockBaixo,
  obterTotalNotificacoesAgendadas,
  reagendarTodasNotificacoes,
  requestPermissions,
  scheduleNotification,
} from "@/services/notificationService";

interface MedicamentosContextType {
  medicamentos: Medicamento[];
  historico: RegistoHistorico[];
  loading: boolean;
  adicionarMedicamento: (dados: Omit<Medicamento, "id" | "criadoEm" | "notificationIds">) => Promise<void>;
  editarMedicamento: (id: string, dados: Omit<Medicamento, "id" | "criadoEm" | "notificationIds">) => Promise<void>;
  eliminarMedicamento: (id: string) => Promise<void>;
  marcarComoTomado: (medicamentoId: string, horario: string) => Promise<void>;
  togglePausa: (id: string) => Promise<void>;
  atualizarStock: (id: string, delta: number) => Promise<void>;
  recarregar: () => Promise<void>;
  reagendarNotificacoes: () => Promise<number>;
  temPermissaoNotificacoes: boolean;
}

const MedicamentosContext = createContext<MedicamentosContextType | null>(null);

export function MedicamentosProvider({ children }: { children: React.ReactNode }) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [historico, setHistorico] = useState<RegistoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [temPermissaoNotificacoes, setTemPermissaoNotificacoes] = useState(false);

  // ─── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    const inicializar = async () => {
      try {
        // 1. Configurar handler e pedir permissão
        await configurarNotificacoes();
        const perm = await requestPermissions();
        setTemPermissaoNotificacoes(perm);

        // 2. Carregar dados
        const [meds, hist] = await Promise.all([getMedicamentos(), getHistorico()]);
        setMedicamentos(meds);
        setHistorico(hist);
        setLoading(false);

        // 3. Reagendar TODAS as notificações no arranque
        //    Isto recupera de reboots de telefone (Android apaga agendamentos)
        if (perm && meds.length > 0) {
          const mapaIds = await reagendarTodasNotificacoes(meds);

          // Actualizar notificationIds em storage para medicamentos cujos IDs mudaram
          const atualizacoes = Object.entries(mapaIds).map(async ([medId, novasIds]) => {
            const med = meds.find((m) => m.id === medId);
            if (!med) return;
            const iguais =
              JSON.stringify(med.notificationIds ?? []) === JSON.stringify(novasIds);
            if (!iguais) {
              await updateMedicamento(medId, { notificationIds: novasIds });
            }
          });
          await Promise.all(atualizacoes);

          // Actualizar estado em memória
          setMedicamentos((prev) =>
            prev.map((m) =>
              mapaIds[m.id] !== undefined
                ? { ...m, notificationIds: mapaIds[m.id] }
                : m
            )
          );
        }
      } catch {
        setLoading(false);
      }
    };

    inicializar();
  }, []);

  // ─── Recarregar ────────────────────────────────────────────────────────────
  const recarregar = useCallback(async () => {
    try {
      const [meds, hist] = await Promise.all([getMedicamentos(), getHistorico()]);
      setMedicamentos(meds);
      setHistorico(hist);
    } catch {}
  }, []);

  // ─── Reagendar manualmente (chamado da UI de configurações) ───────────────
  const reagendarNotificacoes = useCallback(async (): Promise<number> => {
    const meds = await getMedicamentos();
    const mapaIds = await reagendarTodasNotificacoes(meds);

    // Persistir novos IDs
    await Promise.all(
      Object.entries(mapaIds).map(([medId, ids]) =>
        updateMedicamento(medId, { notificationIds: ids })
      )
    );

    // Actualizar estado
    setMedicamentos((prev) =>
      prev.map((m) =>
        mapaIds[m.id] !== undefined ? { ...m, notificationIds: mapaIds[m.id] } : m
      )
    );

    return obterTotalNotificacoesAgendadas();
  }, []);

  // ─── Adicionar medicamento ─────────────────────────────────────────────────
  const adicionarMedicamento = useCallback(async (
    dados: Omit<Medicamento, "id" | "criadoEm" | "notificationIds">
  ) => {
    const novoMedicamento: Medicamento = {
      ...dados,
      id: gerarId(),
      criadoEm: new Date().toISOString(),
      notificationIds: [],
    };

    const notifIds = await scheduleNotification(novoMedicamento);
    novoMedicamento.notificationIds = notifIds;
    await saveMedicamento(novoMedicamento);

    if (novoMedicamento.estoque !== null && novoMedicamento.estoque <= 5) {
      await notificarStockBaixo(novoMedicamento);
    }

    setMedicamentos((prev) => [...prev, novoMedicamento]);
  }, []);

  // ─── Editar medicamento ────────────────────────────────────────────────────
  const editarMedicamento = useCallback(async (
    id: string,
    dados: Omit<Medicamento, "id" | "criadoEm" | "notificationIds">
  ) => {
    const medExistente = medicamentos.find((m) => m.id === id);

    // Cancelar notificações antigas
    if (medExistente?.notificationIds?.length) {
      await cancelNotifications(medExistente.notificationIds);
    }

    const medAtualizado: Medicamento = {
      ...dados,
      id,
      criadoEm: medExistente?.criadoEm ?? new Date().toISOString(),
      notificationIds: [],
    };

    const notifIds = await scheduleNotification(medAtualizado);
    medAtualizado.notificationIds = notifIds;
    await updateMedicamento(id, medAtualizado);

    if (medAtualizado.estoque !== null && medAtualizado.estoque <= 5) {
      await notificarStockBaixo(medAtualizado);
    }

    setMedicamentos((prev) =>
      prev.map((m) => (m.id === id ? medAtualizado : m))
    );
  }, [medicamentos]);

  // ─── Pausar / Retomar ─────────────────────────────────────────────────────
  const togglePausa = useCallback(async (id: string) => {
    const med = medicamentos.find((m) => m.id === id);
    if (!med) return;
    const novoAtivo = !med.ativo;
    if (!novoAtivo) {
      // Pausar: cancelar notificações
      if (med.notificationIds?.length) await cancelNotifications(med.notificationIds);
      await updateMedicamento(id, { ativo: false, notificationIds: [] });
      setMedicamentos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ativo: false, notificationIds: [] } : m))
      );
    } else {
      // Retomar: reagendar notificações
      const medAtivo = { ...med, ativo: true };
      const notifIds = await scheduleNotification(medAtivo);
      await updateMedicamento(id, { ativo: true, notificationIds: notifIds });
      setMedicamentos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ativo: true, notificationIds: notifIds } : m))
      );
    }
  }, [medicamentos]);

  // ─── Actualizar stock (delta +/-) ─────────────────────────────────────────
  const atualizarStock = useCallback(async (id: string, delta: number) => {
    const med = medicamentos.find((m) => m.id === id);
    if (!med || med.estoque === null) return;
    const novoStock = Math.max(0, med.estoque + delta);
    await updateMedicamento(id, { estoque: novoStock });
    setMedicamentos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, estoque: novoStock } : m))
    );
    if (novoStock <= 5) await notificarStockBaixo({ ...med, estoque: novoStock });
  }, [medicamentos]);

  // ─── Eliminar medicamento ──────────────────────────────────────────────────
  const eliminarMedicamento = useCallback(async (id: string) => {
    const med = medicamentos.find((m) => m.id === id);
    if (med?.notificationIds?.length) {
      await cancelNotifications(med.notificationIds);
    }
    await deleteMedicamento(id);
    setMedicamentos((prev) => prev.filter((m) => m.id !== id));
  }, [medicamentos]);

  // ─── Marcar como tomado ────────────────────────────────────────────────────
  const marcarComoTomado = useCallback(async (
    medicamentoId: string,
    horario: string
  ) => {
    const med = medicamentos.find((m) => m.id === medicamentoId);
    if (!med) return;

    const registo: RegistoHistorico = {
      id: gerarId(),
      medicamentoId,
      nomeMedicamento: med.nome,
      dosagem: med.dosagem,
      horario,
      dataHora: new Date().toISOString(),
      status: "tomado",
    };
    await saveRegistoHistorico(registo);

    // Decrementar stock
    let novoStock = med.estoque;
    if (novoStock !== null && novoStock > 0) {
      novoStock = novoStock - 1;
      await updateMedicamento(medicamentoId, { estoque: novoStock });
      setMedicamentos((prev) =>
        prev.map((m) => (m.id === medicamentoId ? { ...m, estoque: novoStock } : m))
      );
      if (novoStock <= 5) {
        await notificarStockBaixo({ ...med, estoque: novoStock });
      }
    }

    setHistorico((prev) => [registo, ...prev]);
  }, [medicamentos]);

  return (
    <MedicamentosContext.Provider
      value={{
        medicamentos,
        historico,
        loading,
        adicionarMedicamento,
        editarMedicamento,
        eliminarMedicamento,
        marcarComoTomado,
        togglePausa,
        atualizarStock,
        recarregar,
        reagendarNotificacoes,
        temPermissaoNotificacoes,
      }}
    >
      {children}
    </MedicamentosContext.Provider>
  );
}

export function useMedicamentos() {
  const ctx = useContext(MedicamentosContext);
  if (!ctx) throw new Error("useMedicamentos deve ser usado dentro de MedicamentosProvider");
  return ctx;
}
