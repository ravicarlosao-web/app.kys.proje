// Card de medicamento — design premium com animações
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

function getIconeCategoria(categoria: CategoriaMedicamento): keyof typeof Ionicons.glyphMap {
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
  if (horarios.length === 0) return "";
  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  let proxMinutos = Infinity;
  let proxHorario = horarios[0];
  for (const h of horarios) {
    const [hStr, mStr] = h.split(":");
    const minutos = parseInt(hStr) * 60 + parseInt(mStr);
    const diff = minutos >= minutosAgora
      ? minutos - minutosAgora
      : minutos + 24 * 60 - minutosAgora;
    if (diff < proxMinutos) {
      proxMinutos = diff;
      proxHorario = h;
    }
  }
  return proxHorario;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function MedicamentoCard({
  medicamento,
  tomadoHoje,
  onPress,
  onMarcarTomado,
  dosesTomadasHoje,
}: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const icone = getIconeCategoria(medicamento.categoria as CategoriaMedicamento);
  const proximoHorario = getProximoHorario(medicamento.horarios);
  const esgotado = medicamento.estoque !== null && medicamento.estoque === 0;
  const stockBaixo = medicamento.estoque !== null && medicamento.estoque > 0 && medicamento.estoque <= 5;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handleMarcar = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onMarcarTomado();
  };

  // Verificar quais horários de hoje já foram tomados
  const getStatusHorario = (h: string): "tomado" | "pendente" => {
    if (!dosesTomadasHoje) return tomadoHoje ? "tomado" : "pendente";
    return dosesTomadasHoje.has(`${medicamento.id}-${h}`) ? "tomado" : "pendente";
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.card, { backgroundColor: colors.card }, animatedStyle]}
    >
      {/* Barra lateral de cor */}
      <View style={[styles.barraCor, { backgroundColor: medicamento.cor }]} />

      {/* Conteúdo principal */}
      <View style={styles.corpo}>
        {/* Topo: ícone + nome + botão tomado */}
        <View style={styles.topo}>
          <View style={[styles.iconeCircle, { backgroundColor: medicamento.cor + "18" }]}>
            <Ionicons name={icone} size={22} color={medicamento.cor} />
          </View>

          <View style={styles.infoTexto}>
            <Text style={[styles.nome, { color: colors.text }]} numberOfLines={1}>
              {medicamento.nome}
            </Text>
            <Text style={[styles.dosagem, { color: colors.textSecondary }]}>
              {medicamento.dosagem}
            </Text>
          </View>

          {/* Botão marcar tomado */}
          <TouchableOpacity
            onPress={handleMarcar}
            disabled={tomadoHoje}
            activeOpacity={0.7}
            style={[
              styles.botaoTomado,
              {
                backgroundColor: tomadoHoje ? colors.success + "20" : colors.primary,
                borderWidth: tomadoHoje ? 0 : 0,
              },
            ]}
          >
            <Ionicons
              name={tomadoHoje ? "checkmark-circle" : "checkmark"}
              size={tomadoHoje ? 20 : 16}
              color={tomadoHoje ? colors.success : "#fff"}
            />
            {!tomadoHoje && (
              <Text style={styles.botaoTomarTexto}>Tomar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Horários do dia como chips */}
        {medicamento.horarios.length > 0 && (
          <View style={styles.horariosRow}>
            {medicamento.horarios.slice(0, 4).map((h) => {
              const status = getStatusHorario(h);
              const ehProximo = h === proximoHorario && status === "pendente";
              return (
                <View
                  key={h}
                  style={[
                    styles.horarioChip,
                    {
                      backgroundColor:
                        status === "tomado"
                          ? colors.success + "18"
                          : ehProximo
                          ? colors.primary + "18"
                          : colors.muted,
                    },
                  ]}
                >
                  <Ionicons
                    name={status === "tomado" ? "checkmark-circle" : "time-outline"}
                    size={11}
                    color={
                      status === "tomado"
                        ? colors.success
                        : ehProximo
                        ? colors.primary
                        : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.horarioChipTexto,
                      {
                        color:
                          status === "tomado"
                            ? colors.success
                            : ehProximo
                            ? colors.primary
                            : colors.mutedForeground,
                        fontFamily: ehProximo ? "Poppins_600SemiBold" : "Poppins_400Regular",
                      },
                    ]}
                  >
                    {h}
                  </Text>
                </View>
              );
            })}
            {medicamento.horarios.length > 4 && (
              <Text style={[styles.maisHorarios, { color: colors.mutedForeground }]}>
                +{medicamento.horarios.length - 4}
              </Text>
            )}
          </View>
        )}

        {/* Alertas de stock */}
        {(esgotado || stockBaixo) && (
          <View
            style={[
              styles.stockAlerta,
              { backgroundColor: esgotado ? colors.danger + "12" : colors.warning + "12" },
            ]}
          >
            <Ionicons
              name={esgotado ? "alert-circle" : "warning"}
              size={13}
              color={esgotado ? colors.danger : colors.warning}
            />
            <Text
              style={[
                styles.stockTexto,
                { color: esgotado ? colors.danger : colors.warning },
              ]}
            >
              {esgotado
                ? "Stock esgotado — precisa de reabastecer"
                : `Stock baixo: ${medicamento.estoque} dose${medicamento.estoque === 1 ? "" : "s"} restante${medicamento.estoque === 1 ? "" : "s"}`}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.border}
        style={styles.chevron}
      />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  barraCor: {
    width: 5,
    alignSelf: "stretch",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTexto: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 22,
  },
  dosagem: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  botaoTomado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
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
  horarioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  horarioChipTexto: {
    fontSize: 11,
  },
  maisHorarios: {
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
