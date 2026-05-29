// Ecrã de histórico — design premium
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMedicamentos } from "@/context/MedicamentosContext";
import { RegistoHistorico } from "@/types";

type FiltroTempo = "hoje" | "semana" | "mes";

const FILTROS: { id: FiltroTempo; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "7 dias" },
  { id: "mes", label: "30 dias" },
];

function formatarDataHora(iso: string): string {
  try {
    return format(new Date(iso), "d MMM · HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function formatarDia(iso: string): string {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) return "Hoje";
    if (d.toDateString() === ontem.toDateString()) return "Ontem";
    return format(d, "d 'de' MMMM", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default function HistoricoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { historico, medicamentos } = useMedicamentos();

  const [filtroTempo, setFiltroTempo] = useState<FiltroTempo>("semana");
  const [filtroMed, setFiltroMed] = useState<string | null>(null);

  const historicoFiltrado = useMemo(() => {
    const agora = new Date();
    const inicio = new Date();
    if (filtroTempo === "hoje") inicio.setHours(0, 0, 0, 0);
    else if (filtroTempo === "semana") inicio.setDate(agora.getDate() - 7);
    else inicio.setDate(agora.getDate() - 30);

    return historico.filter((r) => {
      const data = new Date(r.dataHora);
      const dentroTempo = data >= inicio;
      const dentroMed = filtroMed === null || r.medicamentoId === filtroMed;
      return dentroTempo && dentroMed;
    });
  }, [historico, filtroTempo, filtroMed]);

  const percentualAdesao = useMemo(() => {
    if (historicoFiltrado.length === 0) return 0;
    const tomados = historicoFiltrado.filter((r) => r.status === "tomado").length;
    return Math.round((tomados / historicoFiltrado.length) * 100);
  }, [historicoFiltrado]);

  // Agrupar por dia
  const gruposPorDia = useMemo(() => {
    const grupos: { dia: string; registos: RegistoHistorico[] }[] = [];
    const mapa = new Map<string, RegistoHistorico[]>();
    for (const r of historicoFiltrado) {
      const dia = r.dataHora.split("T")[0];
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia)!.push(r);
    }
    for (const [dia, registos] of mapa) {
      grupos.push({ dia, registos });
    }
    return grupos;
  }, [historicoFiltrado]);

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const corAdesao =
    percentualAdesao >= 80 ? "#10B981" : percentualAdesao >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header gradiente */}
      <LinearGradient
        colors={["#1A4D38", "#2D6A4F", "#3D8B6A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <Text style={styles.headerTitulo}>Histórico</Text>
        <Text style={styles.headerSubtitulo}>Registo das tuas tomas</Text>

        {/* Card de aderência */}
        <View style={styles.adesaoCard}>
          <View style={styles.adesaoEsquerda}>
            <Text style={styles.adesaoLabel}>Aderência ao tratamento</Text>
            <Text style={styles.adesaoPeriodo}>
              {filtroTempo === "hoje" ? "Hoje" : filtroTempo === "semana" ? "Últimos 7 dias" : "Últimos 30 dias"}
            </Text>
          </View>
          <View style={[styles.adesaoCirculo, { borderColor: corAdesao }]}>
            <Text style={[styles.adesaoValor, { color: corAdesao }]}>
              {percentualAdesao}%
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filtros de tempo */}
      <View style={[styles.filtrosContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.filtrosRow, { backgroundColor: colors.card }]}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filtroBtn,
                filtroTempo === f.id && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFiltroTempo(f.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  { color: filtroTempo === f.id ? "#fff" : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtro de medicamento — horizontal scroll */}
        <FlatList
          horizontal
          data={[
            { id: null as string | null, nome: "Todos" },
            ...medicamentos.map((m) => ({ id: m.id as string | null, nome: m.nome })),
          ]}
          keyExtractor={(item) => item.id ?? "todos"}
          showsHorizontalScrollIndicator={false}
          style={styles.medFiltrosScroll}
          contentContainerStyle={styles.medFiltros}
          renderItem={({ item }) => {
            const ativo = filtroMed === item.id;
            const med = medicamentos.find((m) => m.id === item.id);
            return (
              <TouchableOpacity
                style={[
                  styles.medChip,
                  {
                    backgroundColor: ativo ? colors.primary : colors.card,
                    borderColor: ativo ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFiltroMed(item.id)}
                activeOpacity={0.7}
              >
                {med && (
                  <View style={[styles.medChipDot, { backgroundColor: med.cor }]} />
                )}
                <Text
                  style={[
                    styles.medChipTexto,
                    { color: ativo ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {item.nome}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Lista de registos agrupados por dia */}
      <FlatList
        data={gruposPorDia}
        keyExtractor={(item) => item.dia}
        contentContainerStyle={[
          styles.lista,
          { paddingBottom: insets.bottom + 90, flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: grupo }) => (
          <View style={styles.grupoContainer}>
            {/* Cabeçalho do dia */}
            <View style={styles.grupoHeader}>
              <Text style={[styles.grupoTitulo, { color: colors.textSecondary }]}>
                {formatarDia(grupo.dia)}
              </Text>
              <View style={[styles.grupoDivisor, { backgroundColor: colors.border }]} />
            </View>

            {/* Registos do dia */}
            {grupo.registos.map((r) => {
              const tomado = r.status === "tomado";
              const corStatus = tomado ? colors.success : colors.danger;
              return (
                <View
                  key={r.id}
                  style={[styles.registoCard, { backgroundColor: colors.card }]}
                >
                  {/* Indicador de status */}
                  <View style={[styles.registoIcone, { backgroundColor: corStatus + "15" }]}>
                    <Ionicons
                      name={tomado ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={corStatus}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.registoInfo}>
                    <Text style={[styles.registoNome, { color: colors.text }]} numberOfLines={1}>
                      {r.nomeMedicamento}
                    </Text>
                    <Text style={[styles.registoDosagem, { color: colors.textSecondary }]}>
                      {r.dosagem} · {r.horario}
                    </Text>
                  </View>

                  {/* Hora e status */}
                  <View style={styles.registoDireita}>
                    <Text style={[styles.registoHora, { color: colors.mutedForeground }]}>
                      {formatarDataHora(r.dataHora).split("·")[1]?.trim() ?? ""}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: corStatus + "15" }]}>
                      <Text style={[styles.statusTexto, { color: corStatus }]}>
                        {tomado ? "Tomado" : "Saltado"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="calendar-outline" size={56} color={colors.border} />
            <Text style={[styles.vazioTitulo, { color: colors.text }]}>Sem registos</Text>
            <Text style={[styles.vazioSubtitulo, { color: colors.textSecondary }]}>
              Nenhuma toma registada para este período.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  headerTitulo: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  headerSubtitulo: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: -8,
  },

  // Aderência
  adesaoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
  },
  adesaoEsquerda: { gap: 4 },
  adesaoLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  adesaoPeriodo: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  adesaoCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  adesaoValor: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },

  // Filtros
  filtrosContainer: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  filtrosRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  filtroBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  filtroTexto: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  medFiltrosScroll: { flexGrow: 0 },
  medFiltros: { gap: 8, paddingBottom: 4 },
  medChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  medChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  medChipTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },

  // Lista
  lista: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Grupo de dia
  grupoContainer: { marginBottom: 16 },
  grupoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  grupoTitulo: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grupoDivisor: {
    flex: 1,
    height: 1,
  },

  // Card de registo
  registoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  registoIcone: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  registoInfo: { flex: 1, gap: 2 },
  registoNome: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  registoDosagem: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  registoDireita: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  registoHora: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTexto: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },

  // Vazio
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  vazioTitulo: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  vazioSubtitulo: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    maxWidth: 240,
  },
});
