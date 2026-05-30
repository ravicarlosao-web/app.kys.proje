// Card de medicamento — glassmorphism + gradiente
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { Medicamento } from "@/types";
import { CategoriaMedicamento } from "@/constants/colors";

interface Props {
  medicamento: Medicamento;
  tomadoHoje: boolean;
  onPress: () => void;
  onMarcarTomado: () => void;
  dosesTomadasHoje?: Set<string>;
}

function getIcone(categoria: CategoriaMedicamento): keyof typeof Ionicons.glyphMap {
  const mapa: Record<string, keyof typeof Ionicons.glyphMap> = {
    comprimido: "medical",
    xarope: "water",
    injecao: "fitness",
    pomada: "bandage",
    colurio: "eye",
    inalador: "cloud",
  };
  return mapa[categoria] ?? "medical";
}

function getProximoHorario(horarios: string[]): string {
  if (!horarios.length) return "";
  const agora = new Date();
  const agMin = agora.getHours() * 60 + agora.getMinutes();
  let best = horarios[0];
  let bestDiff = Infinity;
  for (const h of horarios) {
    const [hh, mm] = h.split(":").map(Number);
    const total = hh * 60 + mm;
    const diff = total >= agMin ? total - agMin : total + 1440 - agMin;
    if (diff < bestDiff) { bestDiff = diff; best = h; }
  }
  return best;
}

// Transforma cor hex em rgba com opacidade
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function MedicamentoCard({
  medicamento,
  tomadoHoje,
  onPress,
  onMarcarTomado,
  dosesTomadasHoje,
}: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const icone = getIcone(medicamento.categoria as CategoriaMedicamento);
  const proximoHorario = getProximoHorario(medicamento.horarios);
  const esgotado = medicamento.estoque !== null && medicamento.estoque === 0;
  const stockBaixo = medicamento.estoque !== null && medicamento.estoque > 0 && medicamento.estoque <= 5;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 20, stiffness: 400 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 20, stiffness: 400 }); };

  const getStatusHorario = (h: string) => {
    if (!dosesTomadasHoje) return tomadoHoje ? "tomado" : "pendente";
    return dosesTomadasHoje.has(`${medicamento.id}-${h}`) ? "tomado" : "pendente";
  };

  const cor = medicamento.cor;

  return (
    <AnimatedView style={[styles.cardWrapper, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        {/* Gradiente de fundo com cor do medicamento */}
        <LinearGradient
          colors={[hexToRgba(cor, 0.06), "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Barra lateral colorida com gradiente */}
        <LinearGradient
          colors={[cor, hexToRgba(cor, 0.5)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.barraCor}
        />

        {/* Corpo do card */}
        <View style={styles.corpo}>
          {/* Linha de topo: ícone + nome + botão */}
          <View style={styles.topo}>
            <LinearGradient
              colors={[hexToRgba(cor, 0.18), hexToRgba(cor, 0.06)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconeCircle}
            >
              <Ionicons name={icone} size={22} color={cor} />
            </LinearGradient>

            <View style={styles.infoTexto}>
              <Text style={[styles.nome, { color: colors.text }]} numberOfLines={1}>
                {medicamento.nome}
              </Text>
              <Text style={[styles.dosagem, { color: colors.textSecondary }]}>
                {medicamento.dosagem}
              </Text>
            </View>

            {/* Botão tomar */}
            {tomadoHoje ? (
              <View style={[styles.botaoTomado, { backgroundColor: colors.success + "18" }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onMarcarTomado();
                }}
                activeOpacity={0.8}
                style={styles.botaoTomarWrapper}
              >
                <LinearGradient
                  colors={[colors.secondary, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.botaoTomar}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={styles.botaoTomarTexto}>Tomar</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Chips de horários */}
          {medicamento.horarios.length > 0 && (
            <View style={styles.horariosRow}>
              {medicamento.horarios.slice(0, 5).map((h) => {
                const status = getStatusHorario(h);
                const ehProximo = h === proximoHorario && status === "pendente";
                return (
                  <View
                    key={h}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          status === "tomado"
                            ? colors.success + "15"
                            : ehProximo
                            ? cor + "18"
                            : "rgba(0,0,0,0.04)",
                        borderColor:
                          status === "tomado"
                            ? colors.success + "40"
                            : ehProximo
                            ? cor + "60"
                            : "rgba(0,0,0,0.07)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={status === "tomado" ? "checkmark-circle" : ehProximo ? "time" : "time-outline"}
                      size={10}
                      color={status === "tomado" ? colors.success : ehProximo ? cor : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.chipTexto,
                        {
                          color: status === "tomado" ? colors.success : ehProximo ? cor : colors.mutedForeground,
                          fontFamily: ehProximo ? "Poppins_600SemiBold" : "Poppins_400Regular",
                        },
                      ]}
                    >
                      {h}
                    </Text>
                  </View>
                );
              })}
              {medicamento.horarios.length > 5 && (
                <Text style={[styles.maisChips, { color: colors.mutedForeground }]}>
                  +{medicamento.horarios.length - 5}
                </Text>
              )}
            </View>
          )}

          {/* Alerta de stock */}
          {(esgotado || stockBaixo) && (
            <LinearGradient
              colors={esgotado
                ? ["rgba(239,68,68,0.08)", "rgba(239,68,68,0.03)"]
                : ["rgba(245,158,11,0.1)", "rgba(245,158,11,0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stockAlerta}
            >
              <Ionicons
                name={esgotado ? "alert-circle" : "warning"}
                size={13}
                color={esgotado ? colors.danger : colors.warning}
              />
              <Text style={[styles.stockTexto, { color: esgotado ? colors.danger : colors.warning }]}>
                {esgotado
                  ? "Stock esgotado — reabastecer"
                  : `Stock baixo: ${medicamento.estoque} dose${medicamento.estoque === 1 ? "" : "s"} restante${medicamento.estoque === 1 ? "" : "s"}`}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={15} color="rgba(0,0,0,0.18)" style={styles.chevron} />
      </TouchableOpacity>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    overflow: "hidden",
  },
  barraCor: {
    width: 5,
    alignSelf: "stretch",
  },
  corpo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTexto: { flex: 1, gap: 2 },
  nome: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 21,
  },
  dosagem: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  botaoTomado: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  botaoTomarWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    flexShrink: 0,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  botaoTomar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  botaoTomarTexto: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  horariosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipTexto: { fontSize: 11 },
  maisChips: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    alignSelf: "center",
  },
  stockAlerta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  stockTexto: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
  chevron: {
    marginRight: 14,
    flexShrink: 0,
  },
});
