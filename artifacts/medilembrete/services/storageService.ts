// Serviço de armazenamento local com AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medicamento, RegistoHistorico } from "@/types";

const CHAVE_MEDICAMENTOS = "medilembrete_medicamentos";
const CHAVE_HISTORICO = "medilembrete_historico";

// Gera um ID único sem depender do pacote uuid
export function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Obtém todos os medicamentos
export async function getMedicamentos(): Promise<Medicamento[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_MEDICAMENTOS);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Erro ao obter medicamentos:", error);
    return [];
  }
}

// Guarda um novo medicamento
export async function saveMedicamento(medicamento: Medicamento): Promise<void> {
  try {
    const lista = await getMedicamentos();
    lista.push(medicamento);
    await AsyncStorage.setItem(CHAVE_MEDICAMENTOS, JSON.stringify(lista));
  } catch (error) {
    console.error("Erro ao guardar medicamento:", error);
    throw error;
  }
}

// Atualiza um medicamento existente
export async function updateMedicamento(
  id: string,
  dadosAtualizados: Partial<Medicamento>
): Promise<void> {
  try {
    const lista = await getMedicamentos();
    const index = lista.findIndex((m) => m.id === id);
    if (index !== -1) {
      lista[index] = { ...lista[index], ...dadosAtualizados };
      await AsyncStorage.setItem(CHAVE_MEDICAMENTOS, JSON.stringify(lista));
    }
  } catch (error) {
    console.error("Erro ao atualizar medicamento:", error);
    throw error;
  }
}

// Elimina um medicamento
export async function deleteMedicamento(id: string): Promise<void> {
  try {
    const lista = await getMedicamentos();
    const novaLista = lista.filter((m) => m.id !== id);
    await AsyncStorage.setItem(CHAVE_MEDICAMENTOS, JSON.stringify(novaLista));
  } catch (error) {
    console.error("Erro ao eliminar medicamento:", error);
    throw error;
  }
}

// Obtém todo o histórico
export async function getHistorico(): Promise<RegistoHistorico[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_HISTORICO);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Erro ao obter histórico:", error);
    return [];
  }
}

// Guarda um registo no histórico
export async function saveRegistoHistorico(
  registo: RegistoHistorico
): Promise<void> {
  try {
    const lista = await getHistorico();
    lista.unshift(registo); // adiciona no início
    // Manter apenas os últimos 500 registos
    const listaLimitada = lista.slice(0, 500);
    await AsyncStorage.setItem(CHAVE_HISTORICO, JSON.stringify(listaLimitada));
  } catch (error) {
    console.error("Erro ao guardar registo no histórico:", error);
    throw error;
  }
}

// Obtém o histórico de um medicamento específico
export async function getHistoricoByMedicamento(
  medicamentoId: string
): Promise<RegistoHistorico[]> {
  try {
    const lista = await getHistorico();
    return lista.filter((r) => r.medicamentoId === medicamentoId);
  } catch (error) {
    console.error("Erro ao obter histórico do medicamento:", error);
    return [];
  }
}

// Verifica se uma dose já foi tomada hoje
export async function isDoseTomadaHoje(
  medicamentoId: string,
  horario: string
): Promise<boolean> {
  try {
    const historico = await getHistorico();
    const hoje = new Date().toISOString().split("T")[0];
    return historico.some(
      (r) =>
        r.medicamentoId === medicamentoId &&
        r.horario === horario &&
        r.dataHora.startsWith(hoje) &&
        r.status === "tomado"
    );
  } catch {
    return false;
  }
}
