// Ecrã inicial — glassmorphism + gradiente premium
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMedicamentos } from "@/context/MedicamentosContext";
import MedicamentoCard from "@/components/MedicamentoCard";
import EmptyState from "@/components/EmptyState";
import ProximaDose from "@/components/ProximaDose";
import { Medicamento } from "@/types";

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia ☀️";
  if (h >= 12 && h < 18) return "Boa tarde 🌤️";
  return "Boa noite 🌙";
}

function formatarData(): string {
  const str = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function eMedicamentoDeHoje(med: Medicamento): boolean {
  return med.diasSemana.includes(new Date().getDay()) && med.ativo;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function FAB({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedTouchable
      onPressIn={() => { scale.value = withSpring(0.88); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      activeOpacity={1}
      style={[styles.fab, style]}
    >
      <LinearGradient
        colors={["#52C98A", "#2D6A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabInner}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </LinearGradient>
    </AnimatedTouchable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { medicamentos, historico, loading, marcarComoTomado, recarregar } = useMedicamentos();

  const medsHoje = useMemo(() => medicamentos.filter(eMedicamentoDeHoje), [medicamentos]);

  const dosesTomadasHoje = useMemo(() => {
    const hoje = new Date().toISOString().split("T")[0];
    return new Set(
      historico
        .filter((r) => r.dataHora.startsWith(hoje) && r.status === "tomado")
        .map((r) => `${r.medicamentoId}-${r.horario}`)
    );
  }, [historico]);

  const totalMeds = medicamentos.filter((m) => m.ativo).length;
  const totalDosesHoje = medsHoje.reduce((acc, m) => acc + m.horarios.length, 0);
  const dosesTomadas = dosesTomadasHoje.size;
  const dosesPendentes = Math.max(0, totalDosesHoje - dosesTomadas);
  const aderencia = totalDosesHoje > 0 ? Math.round((dosesTomadas / totalDosesHoje) * 100) : 0;

  const medsStockBaixo = useMemo(
    () => medicamentos.filter((m) => m.ativo && m.estoque !== null && m.estoque <= 5),
    [medicamentos]
  );

  const handleMarcarTomado = useCallback(async (med: Medicamento) => {
    const horarioPendente = med.horarios.find((h) => !dosesTomadasHoje.has(`${med.id}-${h}`));
    if (!horarioPendente) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await marcarComoTomado(med.id, horarioPendente);
  }, [dosesTomadasHoje, marcarComoTomado]);

  const isMedTomadoHoje = useCallback(
    (med: Medicamento) => med.horarios.every((h) => dosesTomadasHoje.has(`${med.id}-${h}`)),
    [dosesTomadasHoje]
  );

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const ListHeader = (
    <View>
      {medsStockBaixo.length > 0 && (
        <View style={styles.stockBanner}>
          <LinearGradient
            colors={["rgba(245,158,11,0.15)", "rgba(245,158,11,0.05)"]}
            style={styles.stockBannerGradient}
          >
            <Ionicons name="warning" size={16} color="#D97706" />
            <Text style={styles.stockBannerTexto}>
              {medsStockBaixo.length === 1
                ? `"${medsStockBaixo[0].nome}" com stock baixo`
                : `${medsStockBaixo.length} medicamentos com stock baixo`}
            </Text>
          </LinearGradient>
        </View>
      )}
      <View style={styles.secaoHeader}>
        <Text style={[styles.secaoTitulo, { color: colors.text }]}>
          {totalMeds === 0 ? "Os teus medicamentos" : `${totalMeds} medicamento${totalMeds === 1 ? "" : "s"}`}
        </Text>
        {totalMeds > 0 && (
          <TouchableOpacity onPress={() => router.push("/adicionar")}>
            <Text style={[styles.adicionarLink, { color: colors.primary }]}>+ Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fundo gradiente de toda a tela */}
      <LinearGradient
        colors={["#0D2E1F", "#1A4D38", "#2D6A4F", "#3D8B6A", "#74C69D"]}
        locations={[0, 0.2, 0.4, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Círculos decorativos glassmorphism */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerTopo}>
          <View>
            <Text style={styles.saudacao}>{getSaudacao()}</Text>
            <Text style={styles.headerData}>{formatarData()}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBotao}
            onPress={() => router.push("/adicionar")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Painel glass de estatísticas */}
        <View style={styles.glassPanel}>
          <View style={styles.statsRow}>
            <StatItem icone="albums-outline" valor={totalMeds} label="Total" />
            <View style={styles.statDiv} />
            <StatItem icone="checkmark-circle-outline" valor={dosesTomadas} label="Tomados" verde />
            <View style={styles.statDiv} />
            <StatItem icone="time-outline" valor={dosesPendentes} label="Pendentes" alerta={dosesPendentes > 0} />
          </View>

          {totalDosesHoje > 0 && (
            <View style={styles.aderenciaWrap}>
              <View style={styles.aderenciaTextos}>
                <Text style={styles.aderenciaLabel}>Aderência hoje</Text>
                <Text style={[styles.aderenciaValor, { color: aderencia >= 80 ? "#6EE7B7" : aderencia >= 50 ? "#FCD34D" : "#FCA5A5" }]}>
                  {aderencia}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${aderencia}%` as `${number}%`,
                  backgroundColor: aderencia >= 80 ? "#6EE7B7" : aderencia >= 50 ? "#FCD34D" : "#FCA5A5",
                }]} />
              </View>
            </View>
          )}
        </View>

        {/* Widget de próxima dose com contagem decrescente */}
        <ProximaDose
          medicamentos={medicamentos}
          dosesTomadasHoje={dosesTomadasHoje}
          totalDosesHoje={totalDosesHoje}
          dosesTomadas={dosesTomadas}
        />
      </View>

      {/* Lista sobre fundo glass claro */}
      <View style={styles.listaContainer}>
        {loading ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#2D6A4F" />
          </View>
        ) : (
          <FlatList
            data={medicamentos.filter((m) => m.ativo)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.lista,
              { paddingBottom: insets.bottom + 110, flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={recarregar}
                tintColor="#2D6A4F"
                colors={["#2D6A4F"]}
              />
            }
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={<EmptyState onAdicionar={() => router.push("/adicionar")} />}
            renderItem={({ item }) => (
              <MedicamentoCard
                medicamento={item}
                tomadoHoje={isMedTomadoHoje(item)}
                dosesTomadasHoje={dosesTomadasHoje}
                onPress={() => router.push(`/detalhes/${item.id}`)}
                onMarcarTomado={() => handleMarcarTomado(item)}
              />
            )}
          />
        )}
      </View>

      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/adicionar");
        }}
      />
    </View>
  );
}

function StatItem({
  icone,
  valor,
  label,
  verde,
  alerta,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  valor: number;
  label: string;
  verde?: boolean;
  alerta?: boolean;
}) {
  const cor = alerta ? "#FCD34D" : verde ? "#6EE7B7" : "rgba(255,255,255,0.85)";
  return (
    <View style={styles.statItem}>
      <Ionicons name={icone} size={14} color={cor} style={{ marginBottom: 4 }} />
      <Text style={[styles.statValor, { color: cor }]}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Blobs decorativos (simulam glassmorphism depth)
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.18,
  },
  blob1: {
    width: 280,
    height: 280,
    backgroundColor: "#52B788",
    top: -60,
    right: -80,
  },
  blob2: {
    width: 200,
    height: 200,
    backgroundColor: "#95D5B2",
    top: 120,
    left: -70,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    zIndex: 1,
  },
  headerTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  saudacao: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    lineHeight: 32,
  },
  headerData: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  headerBotao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Glass panel
  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValor: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    lineHeight: 28,
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.6)",
  },
  statDiv: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Aderência
  aderenciaWrap: { gap: 8 },
  aderenciaTextos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aderenciaLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.65)",
  },
  aderenciaValor: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  progressBar: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },

  // Lista glass container
  listaContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    zIndex: 1,
  },
  lista: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Seção
  secaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  secaoTitulo: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
  },
  adicionarLink: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  // Stock banner
  stockBanner: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  stockBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stockBannerTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "#92400E",
    flex: 1,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 82,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: 30,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
});
