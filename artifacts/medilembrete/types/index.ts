// Tipos principais do MediLembrete

export type CategoriaMedicamento =
  | "comprimido"
  | "xarope"
  | "injecao"
  | "pomada"
  | "colurio"
  | "inalador";

export interface Medicamento {
  id: string;
  nome: string;
  dosagem: string;
  categoria: CategoriaMedicamento;
  cor: string;
  dataInicio: string; // ISO date string "YYYY-MM-DD"
  dataFim: string | null;
  horarios: string[]; // ["08:00", "14:00", "20:00"]
  diasSemana: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
  instrucoes: string;
  estoque: number | null;
  notificationIds: string[];
  ativo: boolean;
  criadoEm: string; // ISO datetime string
}

export interface RegistoHistorico {
  id: string;
  medicamentoId: string;
  nomeMedicamento: string;
  dosagem: string;
  horario: string;
  dataHora: string; // ISO datetime string
  status: "tomado" | "saltado";
}

// Nomes dos dias da semana em português
export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Nomes completos dos dias
export const DIAS_SEMANA_COMPLETOS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

// Nomes dos meses em português
export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
