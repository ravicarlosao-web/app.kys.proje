// Ecrã de histórico — glassmorphism + gradiente
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

function formatarHora(iso: string): string {
  try { return format(new Date(iso), "HH:mm", { locale: ptBR }); }
  catch { return iso; }
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
  } catch { return iso; }
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
      return data >= inicio && (filtroMed === null || r.medicamentoId === filtroMed);
    });
  }, [historico, filtroTempo, filtroMed]);

  const adesao = useMemo(() => {
    if (!historicoFiltrado.length) return 0;
    return Math.round((historicoFiltrado.filter((r) => r.status === "tomado").length / historicoFiltrado.length) * 100);
  }, [historicoFiltrado]);

  const gruposPorDia = useMemo(() => {
    const mapa = new Map<string, RegistoHistorico[]>();
    for (const r of historicoFiltrado) {
      const dia = r.dataHora.split("T")[0];
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia)!.push(r);
    }
    return Array.from(mapa.entries()).map(([dia, registos]) => ({ dia, registos }));
  }, [historicoFiltrado]);

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const corAdesao = adesao >= 80 ? "#6EE7B7" : adesao >= 50 ? "#FCD34D" : "#FCA5A5";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fundo gradiente */}
      <LinearGradient
        colors={["#0D2E1F", "#1A4D38", "#2D6A4F", "#3D8B6A", "#74C69D"]}
        locations={[0, 0.2, 0.4, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blobs decorativos */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View>
          <Text style={styles.headerTitulo}>Histórico</Text>
          <Text style={styles.headerSub}>Registo das tuas tomas</Text>
        </View>

        {/* Painel glass de aderência */}
        <View style={styles.glassPanel}>
          <View style={styles.adesaoRow}>
            <View style={styles.adesaoEsq}>
              <Text style={styles.adesaoLabel}>Aderência ao tratamento</Text>
              <Text style={styles.adesaoPeriodo}>
                {filtroTempo === "hoje" ? "Hoje" : filtroTempo === "semana" ? "Últimos 7 dias" : "Últimos 30 dias"}
              </Text>
            </View>
            <View style={[styles.adesaoCirculo, { borderColor: corAdesao + "90" }]}>
              <Text style={[styles.adesaoValor, { color: corAdesao }]}>{adesao}%</Text>
            </View>
          </View>
          <View style={styles.adesaoBarraFundo}>
            <View style={[styles.adesaoBarraFill, {
              width: `${adesao}%` as `${number}%`,
              backgroundColor: corAdesao,
            }]} />
          </View>
        </View>
      </View>

      {/* Container glass da lista */}
      <View style={styles.listaContainer}>
        {/* Filtros de tempo */}
        <View style={[styles.filtrosRow, { backgroundColor: "rgba(0,0,0,0.04)" }]}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFiltroTempo(f.id)}
              activeOpacity={0.7}
              style={styles.filtroItem}
            >
              {filtroTempo === f.id ? (
                <LinearGradient
                  colors={["#52C98A", "#2D6A4F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filtroBtnActive}
                >
                  <Text style={styles.filtroTextoActive}>{f.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.filtroBtn}>
                  <Text style={[styles.filtroTexto, { color: colors.textSecondary }]}>{f.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtros de medicamento */}
        <FlatList
          horizontal
          data={[
            { id: null as string | null, nome: "Todos", cor: null },
            ...medicamentos.map((m) => ({ id: m.id as string | null, nome: m.nome, cor: m.cor })),
          ]}
          keyExtractor={(item) => item.id ?? "todos"}
          showsHorizontalScrollIndicator={false}
          style={styles.medFiltrosWrap}
          contentContainerStyle={styles.medFiltros}
          renderItem={({ item }) => {
            const ativo = filtroMed === item.id;
            return (
              <TouchableOpacity
                onPress={() => setFiltroMed(item.id)}
                activeOpacity={0.7}
              >
                {ativo ? (
                  <LinearGradient
                    colors={item.cor ? [item.cor + "CC", item.cor] : ["#52C98A", "#2D6A4F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.medChipActive}
                  >
                    {item.cor && <View style={[styles.medDot, { backgroundColor: "#fff" }]} />}
                    <Text style={styles.medChipTextoActive}>{item.nome}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.medChip, { borderColor: colors.border }]}>
                    {item.cor && <View style={[styles.medDot, { backgroundColor: item.cor }]} />}
                    <Text style={[styles.medChipTexto, { color: colors.textSecondary }]}>{item.nome}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        {/* Lista de registos */}
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
              <View style={styles.grupoHeader}>
                <Text style={[styles.grupoTitulo, { color: colors.textSecondary }]}>
                  {formatarDia(grupo.dia)}
                </Text>
                <View style={[styles.grupoDivisor, { backgroundColor: colors.border }]} />
                <Text style={[styles.grupoCount, { color: colors.mutedForeground }]}>
                  {grupo.registos.length}
                </Text>
              </View>
              {grupo.registos.map((r) => {
                const tomado = r.status === "tomado";
                const med = medicamentos.find((m) => m.id === r.medicamentoId);
                return (
                  <View key={r.id} style={[styles.registoCard, { backgroundColor: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.95)" }]}>
                    {/* Fundo gradiente sutil */}
                    <LinearGradient
                      colors={[tomado ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)", "rgba(255,255,255,0)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />

                    {/* Ícone de status */}
                    <LinearGradient
                      colors={tomado ? ["#D1FAE5", "#A7F3D0"] : ["#FEE2E2", "#FECACA"]}
                      style={styles.registoIcone}
                    >
                      <Ionicons
                        name={tomado ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={tomado ? colors.success : colors.danger}
                      />
                    </LinearGradient>

                    {/* Info */}
                    <View style={styles.registoInfo}>
                      <Text style={[styles.registoNome, { color: colors.text }]} numberOfLines={1}>
                        {r.nomeMedicamento}
                      </Text>
                      <Text style={[styles.registoDosagem, { color: colors.textSecondary }]}>
                        {r.dosagem}
                        {med && <Text> · </Text>}
                        {r.horario}
                      </Text>
                    </View>

                    {/* Hora + badge */}
                    <View style={styles.registoDireita}>
                      <Text style={[styles.registoHora, { color: colors.mutedForeground }]}>
                        {formatarHora(r.dataHora)}
                      </Text>
                      <LinearGradient
                        colors={tomado ? ["#D1FAE5", "#A7F3D0"] : ["#FEE2E2", "#FECACA"]}
                        style={styles.badge}
                      >
                        <Text style={[styles.badgeTexto, { color: tomado ? colors.success : colors.danger }]}>
                          {tomado ? "Tomado" : "Saltado"}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <LinearGradient
                colors={["#D1FAE5", "#A7F3D0"]}
                style={styles.vazioIcone}
              >
                <Ionicons name="calendar-outline" size={40} color="#1B5E3C" />
              </LinearGradient>
              <Text style={[styles.vazioTitulo, { color: colors.text }]}>Sem registos</Text>
              <Text style={[styles.vazioSub, { color: colors.textSecondary }]}>
                Nenhuma toma registada para este período.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999, opacity: 0.18 },
  blob1: { width: 280, height: 280, backgroundColor: "#52B788", top: -60, right: -80 },
  blob2: { width: 200, height: 200, backgroundColor: "#95D5B2", top: 120, left: -70 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    zIndex: 1,
  },
  headerTitulo: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  adesaoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adesaoEsq: { gap: 4 },
  adesaoLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  adesaoPeriodo: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  adesaoCirculo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  adesaoValor: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  adesaoBarraFundo: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  adesaoBarraFill: {
    height: 5,
    borderRadius: 3,
  },

  // Container lista glass
  listaContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    zIndex: 1,
  },

  // Filtros
  filtrosRow: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 4,
    gap: 2,
  },
  filtroItem: { flex: 1 },
  filtroBtnActive: {
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
  },
  filtroTextoActive: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  filtroBtn: {
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 11,
  },
  filtroTexto: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  medFiltrosWrap: { flexGrow: 0 },
  medFiltros: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  medChipActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  medChipTextoActive: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  medChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  medChipTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  medDot: { width: 8, height: 8, borderRadius: 4 },

  // Lista
  lista: { paddingHorizontal: 16 },

  // Grupo dia
  grupoContainer: { marginBottom: 16 },
  grupoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  grupoTitulo: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  grupoDivisor: { flex: 1, height: 1 },
  grupoCount: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },

  // Card de registo
  registoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
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
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  registoDosagem: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  registoDireita: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  registoHora: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgeTexto: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },

  // Vazio
  vazio: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  vazioIcone: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  vazioTitulo: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  vazioSub: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    maxWidth: 240,
  },
});
