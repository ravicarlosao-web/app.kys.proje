// Card de medicamento para a lista principal
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Medicamento } from "@/types";
import { CategoriaMedicamento } from "@/constants/colors";

interface Props {
  medicamento: Medicamento;
  tomadoHoje: boolean;
  onPress: () => void;
  onMarcarTomado: () => void;
}

// Ícone e label para cada categoria
function getIconeCategoria(categoria: CategoriaMedicamento): {
  icone: keyof typeof Ionicons.glyphMap;
} {
  const mapa: Record<string, { icone: keyof typeof Ionicons.glyphMap }> = {
    comprimido: { icone: "medical" },
    xarope: { icone: "water" },
    injecao: { icone: "fitness" },
    pomada: { icone: "bandage" },
    colurio: { icone: "eye" },
    inalador: { icone: "cloud" },
  };
  return mapa[categoria] ?? { icone: "medical" };
}

// Próximo horário a tomar (o mais próximo do atual)
function getProximoHorario(horarios: string[]): string {
  if (horarios.length === 0) return "";
  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  let proxMinutos = Infinity;
  let proxHorario = horarios[0];
  for (const h of horarios) {
    const [hStr, mStr] = h.split(":");
    const minutos = parseInt(hStr) * 60 + parseInt(mStr);
    const diff = minutos >= minutosAgora ? minutos - minutosAgora : minutos + 24 * 60 - minutosAgora;
    if (diff < proxMinutos) {
      proxMinutos = diff;
      proxHorario = h;
    }
  }
  return proxHorario;
}

export default function MedicamentoCard({
  medicamento,
  tomadoHoje,
  onPress,
  onMarcarTomado,
}: Props) {
  const colors = useColors();
  const { icone } = getIconeCategoria(medicamento.categoria as CategoriaMedicamento);
  const proximoHorario = getProximoHorario(medicamento.horarios);
  const esgotado = medicamento.estoque !== null && medicamento.estoque === 0;
  const stockBaixo = medicamento.estoque !== null && medicamento.estoque > 0 && medicamento.estoque < 5;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      {/* Barra colorida lateral */}
      <View style={[styles.barraCor, { backgroundColor: medicamento.cor }]} />

      {/* Ícone da categoria */}
      <View
        style={[
          styles.iconeWrapper,
          { backgroundColor: medicamento.cor + "20" },
        ]}
      >
        <Ionicons name={icone} size={24} color={medicamento.cor} />
      </View>

      {/* Informações principais */}
      <View style={styles.info}>
        <Text style={[styles.nome, { color: colors.text }]} numberOfLines={1}>
          {medicamento.nome}
        </Text>
        <Text style={[styles.dosagem, { color: colors.textSecondary }]}>
          {medicamento.dosagem}
        </Text>
        {esgotado ? (
          <Text style={[styles.alerta, { color: colors.danger }]}>
            Estoque esgotado
          </Text>
        ) : stockBaixo ? (
          <Text style={[styles.alerta, { color: colors.warning }]}>
            Stock baixo: {medicamento.estoque} restantes
          </Text>
        ) : proximoHorario ? (
          <View style={styles.horarioRow}>
            <Ionicons name="time-outline" size={13} color={colors.secondary} />
            <Text style={[styles.horario, { color: colors.secondary }]}>
              {" "}{proximoHorario}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Botão de marcar como tomado + chevron */}
      <View style={styles.acoes}>
        <TouchableOpacity
          onPress={onMarcarTomado}
          disabled={tomadoHoje}
          style={[
            styles.botaoTomado,
            {
              backgroundColor: tomadoHoje
                ? colors.muted
                : colors.primary,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={tomadoHoje ? "checkmark" : "checkmark-outline"}
            size={16}
            color={tomadoHoje ? colors.mutedForeground : "#fff"}
          />
        </TouchableOpacity>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.mutedForeground}
          style={{ marginTop: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  barraCor: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconeWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  dosagem: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  horario: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  alerta: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  acoes: {
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  botaoTomado: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
