// Paleta de cores do MediLembrete
const colors = {
  light: {
    // Cores principais
    primary: "#2D6A4F",
    secondary: "#52B788",
    accent: "#95D5B2",

    // Superfícies
    background: "#F8FAF9",
    card: "#FFFFFF",
    foreground: "#1B1F1E",
    cardForeground: "#1B1F1E",

    // Texto
    text: "#1B1F1E",
    textSecondary: "#6B7280",
    mutedForeground: "#9CA3AF",

    // Estado
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    border: "#E5E7EB",

    // Aliases para compatibilidade com useColors
    primaryForeground: "#FFFFFF",
    secondary2: "#52B788",
    secondaryForeground: "#FFFFFF",
    muted: "#F3F4F6",
    input: "#E5E7EB",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    tint: "#2D6A4F",
  },
  radius: 16,
};

export default colors;

// Cores disponíveis para identificar medicamentos
export const CORES_MEDICAMENTO = [
  "#2D6A4F",
  "#3B82F6",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#EAB308",
  "#6B7280",
];

// Categorias de medicamentos
export type CategoriaMedicamento =
  | "comprimido"
  | "xarope"
  | "injecao"
  | "pomada"
  | "colurio"
  | "inalador";
