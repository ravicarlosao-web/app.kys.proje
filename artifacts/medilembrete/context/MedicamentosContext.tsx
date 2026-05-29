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
  recarregar: () => Promise<void>;
  temPermissaoNotificacoes: boolean;
}

const MedicamentosContext = createContext<MedicamentosContextType | null>(null);

export function MedicamentosProvider({ children }: { children: React.ReactNode }) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [historico, setHistorico] = useState<RegistoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [temPermissaoNotificacoes, setTemPermissaoNotificacoes] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const [meds, hist] = await Promise.all([getMedicamentos(), getHistorico()]);
      setMedicamentos(meds);
      setHistorico(hist);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    configurarNotificacoes();
    requestPermissions().then(setTemPermissaoNotificacoes);
    carregarDados();
  }, [carregarDados]);

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
    // Verifica stock imediatamente após adicionar
    if (novoMedicamento.estoque !== null && novoMedicamento.estoque <= 5) {
      await notificarStockBaixo(novoMedicamento);
    }
    setMedicamentos((prev) => [...prev, novoMedicamento]);
  }, []);

  const editarMedicamento = useCallback(async (
    id: string,
    dados: Omit<Medicamento, "id" | "criadoEm" | "notificationIds">
  ) => {
    const medExistente = medicamentos.find((m) => m.id === id);
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
    // Verifica stock após edição
    if (medAtualizado.estoque !== null && medAtualizado.estoque <= 5) {
      await notificarStockBaixo(medAtualizado);
    }
    setMedicamentos((prev) =>
      prev.map((m) => (m.id === id ? medAtualizado : m))
    );
  }, [medicamentos]);

  const eliminarMedicamento = useCallback(async (id: string) => {
    const med = medicamentos.find((m) => m.id === id);
    if (med?.notificationIds?.length) {
      await cancelNotifications(med.notificationIds);
    }
    await deleteMedicamento(id);
    setMedicamentos((prev) => prev.filter((m) => m.id !== id));
  }, [medicamentos]);

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

    // Decrementar stock se estiver definido
    let novoStock = med.estoque;
    if (novoStock !== null && novoStock > 0) {
      novoStock = novoStock - 1;
      await updateMedicamento(medicamentoId, { estoque: novoStock });
      setMedicamentos((prev) =>
        prev.map((m) => (m.id === medicamentoId ? { ...m, estoque: novoStock } : m))
      );
      // Alertar se stock ficou baixo
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
        recarregar: carregarDados,
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
