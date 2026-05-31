// Widget de próxima dose — contagem decrescente em tempo real
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Medicamento } from "@/types";

interface Props {
  medicamentos: Medicamento[];
  dosesTomadasHoje: Set<string>;
  totalDosesHoje: number;
  dosesTomadas: number;
}

interface ProximaDoseInfo {
  medicamento: Medicamento;
  horario: string;
  diffMs: number;
}

const EMOJI: Record<string, string> = {
  comprimido: "💊",
  xarope: "🥄",
  injecao: "💉",
  pomada: "🧴",
  colurio: "👁️",
  inalador: "💨",
};

function calcularProxima(
  medicamentos: Medicamento[],
  dosesTomadasHoje: Set<string>
): ProximaDoseInfo | null {
  const agora = new Date();
  const hoje = agora.getDay();
  let melhor: ProximaDoseInfo | null = null;
  let melhorDiff = Infinity;

  for (const med of medicamentos) {
    if (!med.ativo) continue;
    if (!med.diasSemana.includes(hoje)) continue;
    for (const horario of med.horarios) {
      if (dosesTomadasHoje.has(`${med.id}-${horario}`)) continue;
      const [h, m] = horario.split(":").map(Number);
      const dose = new Date();
      dose.setHours(h, m, 0, 0);
      const diff = dose.getTime() - agora.getTime();
      if (diff >= 0 && diff < melhorDiff) {
        melhorDiff = diff;
        melhor = { medicamento: med, horario, diffMs: diff };
      }
    }
  }
  return melhor;
}

function formatarContagem(diffMs: number): { principal: string; sub: string; urgente: boolean } {
  const totalSeg = Math.floor(diffMs / 1000);
  const horas = Math.floor(totalSeg / 3600);
  const min = Math.floor((totalSeg % 3600) / 60);
  const seg = totalSeg % 60;

  if (horas > 0) {
    return {
      principal: `${horas}h ${min}min`,
      sub: "falta",
      urgente: false,
    };
  }
  if (min > 0) {
    return {
      principal: `${min}min ${String(seg).padStart(2, "0")}s`,
      sub: "falta",
      urgente: min <= 15,
    };
  }
  return {
    principal: `${String(seg).padStart(2, "0")}s`,
    sub: "falta",
    urgente: true,
  };
}

export default function ProximaDose({
  medicamentos,
  dosesTomadasHoje,
  totalDosesHoje,
  dosesTomadas,
}: Props) {
  const [tick, setTick] = useState(0);

  // Actualiza a cada segundo
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const proxima = useMemo(
    () => calcularProxima(medicamentos, dosesTomadasHoje),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [medicamentos, dosesTomadasHoje, tick]
  );

  const medsAtivosHoje = useMemo(() => {
    const hoje = new Date().getDay();
    return medicamentos.filter((m) => m.ativo && m.diasSemana.includes(hoje));
  }, [medicamentos]);

  // Sem medicamentos hoje — não mostrar
  if (medsAtivosHoje.length === 0) return null;

  // Todas as doses tomadas hoje
  if (!proxima && totalDosesHoje > 0 && dosesTomadas >= totalDosesHoje) {
    return (
      <View style={styles.cardTomado}>
        <LinearGradient
          colors={["rgba(110,231,183,0.18)", "rgba(52,211,153,0.08)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardInner}
        >
          <View style={styles.iconeBadge}>
            <Text style={styles.iconeBadgeEmoji}>🎉</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.tomadoTitulo}>Tudo em dia!</Text>
            <Text style={styles.tomadoSub}>
              Todas as {totalDosesHoje} dose{totalDosesHoje !== 1 ? "s" : ""} de hoje tomadas
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={26} color="#6EE7B7" />
        </LinearGradient>
      </View>
    );
  }

  // Não há doses futuras hoje (passaram todas)
  if (!proxima) return null;

  const { medicamento: med, horario, diffMs } = proxima;
  const emoji = EMOJI[med.categoria] ?? "💊";
  const { principal, sub, urgente } = formatarContagem(diffMs);
  const corUrgente = urgente ? "#FCA5A5" : "#6EE7B7";
  const corUrgenteFundo = urgente ? "rgba(252,165,165,0.12)" : "rgba(110,231,183,0.12)";

  return (
    <View style={[styles.card, urgente && styles.cardUrgente]}>
      <LinearGradient
        colors={
          urgente
            ? ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.05)"]
            : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.04)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardInner}
      >
        {/* Ícone com badge de horário */}
        <View style={styles.esquerda}>
          <View style={[styles.iconeBadge, { backgroundColor: corUrgenteFundo }]}>
            <Text style={styles.iconeBadgeEmoji}>{emoji}</Text>
          </View>
          <View style={[styles.horarioBadge, { backgroundColor: corUrgenteFundo, borderColor: corUrgente + "40" }]}>
            <Ionicons name="time-outline" size={10} color={corUrgente} />
            <Text style={[styles.horarioTexto, { color: corUrgente }]}>{horario}</Text>
          </View>
        </View>

        {/* Nome e dosagem */}
        <View style={styles.info}>
          <Text style={styles.proximaTitulo} numberOfLines={1}>
            {med.nome}
          </Text>
          <Text style={styles.proximaSub} numberOfLines={1}>
            {med.dosagem}
            {med.instrucoes ? ` · ${med.instrucoes}` : ""}
          </Text>
        </View>

        {/* Contagem decrescente */}
        <View style={styles.contagemWrap}>
          <Text style={styles.contagemSub}>{sub}</Text>
          <Text style={[styles.contagem, { color: corUrgente }]}>{principal}</Text>
          {urgente && (
            <View style={[styles.urgentePill, { backgroundColor: corUrgenteFundo }]}>
              <Text style={[styles.urgenteTexto, { color: corUrgente }]}>AGORA</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  cardUrgente: {
    borderColor: "rgba(252,165,165,0.4)",
  },
  cardTomado: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(110,231,183,0.3)",
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },

  // Lado esquerdo — ícone + horário
  esquerda: {
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  iconeBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconeBadgeEmoji: {
    fontSize: 20,
  },
  horarioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  horarioTexto: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.3,
  },

  // Centro — nome e dosagem
  info: {
    flex: 1,
    gap: 2,
  },
  proximaTitulo: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    lineHeight: 18,
  },
  proximaSub: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 15,
  },

  // Direita — contagem
  contagemWrap: {
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
  },
  contagemSub: {
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contagem: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    lineHeight: 16,
  },
  urgentePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  urgenteTexto: {
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
  },

  // Estado "todas tomadas"
  tomadoTitulo: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#6EE7B7",
    lineHeight: 18,
  },
  tomadoSub: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 15,
  },
});
