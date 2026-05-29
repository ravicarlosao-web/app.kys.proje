// Ecrã inicial — design premium nível X / Facebook
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
import { Medicamento } from "@/types";

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia!";
  if (h >= 12 && h < 18) return "Boa tarde!";
  return "Boa noite!";
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
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      activeOpacity={1}
      style={[styles.fab, style]}
    >
      <LinearGradient
        colors={["#3D8B6A", "#2D6A4F"]}
        style={styles.fabGradient}
      >
        <Ionicons name="add" size={28} color="#fff" />
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
  const aderencia = totalDosesHoje > 0
    ? Math.round((dosesTomadas / totalDosesHoje) * 100)
    : 0;

  // Alertas de stock baixo
  const medsStockBaixo = useMemo(
    () => medicamentos.filter(
      (m) => m.ativo && m.estoque !== null && m.estoque <= 5
    ),
    [medicamentos]
  );

  const handleMarcarTomado = useCallback(
    async (med: Medicamento) => {
      const horarioPendente = med.horarios.find(
        (h) => !dosesTomadasHoje.has(`${med.id}-${h}`)
      );
      if (!horarioPendente) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await marcarComoTomado(med.id, horarioPendente);
    },
    [dosesTomadasHoje, marcarComoTomado]
  );

  const isMedTomadoHoje = useCallback(
    (med: Medicamento): boolean =>
      med.horarios.every((h) => dosesTomadasHoje.has(`${med.id}-${h}`)),
    [dosesTomadasHoje]
  );

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const ListHeader = (
    <View>
      {/* Banner de alertas de stock */}
      {medsStockBaixo.length > 0 && (
        <View style={[styles.stockBanner, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="warning" size={16} color="#D97706" />
          <Text style={[styles.stockBannerTexto, { color: "#92400E" }]}>
            {medsStockBaixo.length === 1
              ? `"${medsStockBaixo[0].nome}" com stock baixo`
              : `${medsStockBaixo.length} medicamentos com stock baixo`}
          </Text>
        </View>
      )}

      {/* Secção título */}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header gradiente */}
      <LinearGradient
        colors={["#1A4D38", "#2D6A4F", "#3D8B6A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        {/* Linha superior: saudação + ícone */}
        <View style={styles.headerTopo}>
          <View style={styles.saudacaoWrapper}>
            <Text style={styles.saudacao}>{getSaudacao()}</Text>
            <Text style={styles.headerData}>{formatarData()}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconeBtn}
            onPress={() => router.push("/adicionar")}
          >
            <Ionicons name="add-circle-outline" size={28} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Stats chips */}
        <View style={styles.statsRow}>
          <StatChip label="Total" valor={totalMeds} icone="albums-outline" />
          <View style={styles.statsDivisor} />
          <StatChip label="Tomados" valor={dosesTomadas} icone="checkmark-circle-outline" destaque={dosesTomadas > 0} />
          <View style={styles.statsDivisor} />
          <StatChip label="Pendentes" valor={dosesPendentes} icone="time-outline" alerta={dosesPendentes > 0} />
        </View>

        {/* Barra de aderência */}
        {totalDosesHoje > 0 && (
          <View style={styles.aderenciaContainer}>
            <View style={styles.aderenciaHeader}>
              <Text style={styles.aderenciaLabel}>Aderência de hoje</Text>
              <Text style={styles.aderenciaPercent}>{aderencia}%</Text>
            </View>
            <View style={styles.aderenciaBarra}>
              <Animated.View
                style={[
                  styles.aderenciaProgresso,
                  { width: `${aderencia}%` as `${number}%` },
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Lista de medicamentos */}
      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.carregandoTexto, { color: colors.textSecondary }]}>
            A carregar...
          </Text>
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState onAdicionar={() => router.push("/adicionar")} />
          }
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

      {/* FAB animado */}
      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/adicionar");
        }}
      />
      {/* Posicionar FAB */}
      <View
        pointerEvents="none"
        style={[styles.fabAnchor, { bottom: insets.bottom + 72 }]}
      />
    </View>
  );
}

// Chip de estatística no header
function StatChip({
  label,
  valor,
  icone,
  destaque,
  alerta,
}: {
  label: string;
  valor: number;
  icone: keyof typeof Ionicons.glyphMap;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <View style={styles.statChip}>
      <View style={styles.statChipIcone}>
        <Ionicons
          name={icone}
          size={14}
          color={alerta ? "#FCD34D" : destaque ? "#6EE7B7" : "rgba(255,255,255,0.7)"}
        />
      </View>
      <Text
        style={[
          styles.statValor,
          alerta && { color: "#FCD34D" },
          destaque && { color: "#6EE7B7" },
        ]}
      >
        {valor}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  headerTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  saudacaoWrapper: { gap: 2 },
  saudacao: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    lineHeight: 30,
  },
  headerData: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  headerIconeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statChipIcone: { marginBottom: 2 },
  statValor: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.65)",
  },
  statsDivisor: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // Aderência
  aderenciaContainer: { gap: 8 },
  aderenciaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aderenciaLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  aderenciaPercent: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#6EE7B7",
  },
  aderenciaBarra: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 3,
    overflow: "hidden",
  },
  aderenciaProgresso: {
    height: 6,
    backgroundColor: "#6EE7B7",
    borderRadius: 3,
  },

  // Stock banner
  stockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 0,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  stockBannerTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    flex: 1,
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

  // Lista
  lista: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  carregandoTexto: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 82,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  fabGradient: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  fabAnchor: {
    position: "absolute",
    right: 20,
    height: 58,
    width: 58,
  },
});
