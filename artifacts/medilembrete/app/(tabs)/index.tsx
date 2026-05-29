// Ecrã inicial — lista de medicamentos e resumo do dia
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMedicamentos } from "@/context/MedicamentosContext";
import MedicamentoCard from "@/components/MedicamentoCard";
import EmptyState from "@/components/EmptyState";
import { Medicamento } from "@/types";

// Formata a data de hoje em português
function formatarDataHoje(): string {
  return format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Capitaliza a primeira letra
function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Verifica se o medicamento deve ser tomado hoje
function eMedicamentoDeHoje(med: Medicamento): boolean {
  const hoje = new Date().getDay(); // 0=Dom, 1=Seg...
  return med.diasSemana.includes(hoje) && med.ativo;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { medicamentos, historico, loading, marcarComoTomado, recarregar } =
    useMedicamentos();

  // Medicamentos de hoje
  const medsHoje = useMemo(
    () => medicamentos.filter(eMedicamentoDeHoje),
    [medicamentos]
  );

  // IDs das doses tomadas hoje
  const dosesTomadasHoje = useMemo(() => {
    const hoje = new Date().toISOString().split("T")[0];
    return new Set(
      historico
        .filter((r) => r.dataHora.startsWith(hoje) && r.status === "tomado")
        .map((r) => `${r.medicamentoId}-${r.horario}`)
    );
  }, [historico]);

  // Contagens para o resumo
  const totalMeds = medicamentos.filter((m) => m.ativo).length;
  const totalDosesHoje = medsHoje.reduce((acc, m) => acc + m.horarios.length, 0);
  const dosesTomadas = dosesTomadasHoje.size;
  const dosesPendentes = Math.max(0, totalDosesHoje - dosesTomadas);

  const handleMarcarTomado = useCallback(
    async (med: Medicamento) => {
      // Usa o próximo horário pendente
      const hoje = new Date().toISOString().split("T")[0];
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
    (med: Medicamento): boolean => {
      return med.horarios.every((h) => dosesTomadasHoje.has(`${med.id}-${h}`));
    },
    [dosesTomadasHoje]
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 8, backgroundColor: colors.background },
        ]}
      >
        <View>
          <Text style={[styles.titulo, { color: colors.primary }]}>
            MediLembrete
          </Text>
          <Text style={[styles.subtitulo, { color: colors.text }]}>
            Os teus medicamentos de hoje
          </Text>
          <Text style={[styles.data, { color: colors.textSecondary }]}>
            {capitalizar(formatarDataHoje())}
          </Text>
        </View>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary + "15" }]}>
          <Ionicons name="medkit" size={28} color={colors.primary} />
        </View>
      </View>

      {/* Cards de resumo */}
      <View style={[styles.resumoRow, { paddingHorizontal: 20 }]}>
        <ResumoCard
          titulo="Total"
          valor={totalMeds}
          icone="albums-outline"
          cor={colors.primary}
          fundo={colors.primary + "15"}
          colors={colors}
        />
        <ResumoCard
          titulo="Tomados"
          valor={dosesTomadas}
          icone="checkmark-circle-outline"
          cor={colors.success}
          fundo={colors.success + "15"}
          colors={colors}
        />
        <ResumoCard
          titulo="Pendentes"
          valor={dosesPendentes}
          icone="time-outline"
          cor={dosesPendentes > 0 ? colors.warning : colors.textSecondary}
          fundo={(dosesPendentes > 0 ? colors.warning : colors.textSecondary) + "15"}
          colors={colors}
        />
      </View>

      {/* Lista de medicamentos */}
      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            />
          }
          ListEmptyComponent={
            <EmptyState
              onAdicionar={() => router.push("/adicionar")}
            />
          }
          renderItem={({ item }) => (
            <MedicamentoCard
              medicamento={item}
              tomadoHoje={isMedTomadoHoje(item)}
              onPress={() => router.push(`/detalhes/${item.id}`)}
              onMarcarTomado={() => handleMarcarTomado(item)}
            />
          )}
        />
      )}

      {/* FAB — botão flutuante */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, bottom: insets.bottom + 70 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/adicionar");
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// Card de resumo
interface ResumoCardProps {
  titulo: string;
  valor: number;
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  fundo: string;
  colors: ReturnType<typeof useColors>;
}

function ResumoCard({ titulo, valor, icone, cor, fundo, colors }: ResumoCardProps) {
  return (
    <View
      style={[styles.resumoCard, { backgroundColor: colors.card }]}
    >
      <View style={[styles.resumoIcone, { backgroundColor: fundo }]}>
        <Ionicons name={icone} size={20} color={cor} />
      </View>
      <Text style={[styles.resumoValor, { color: colors.text }]}>{valor}</Text>
      <Text style={[styles.resumoTitulo, { color: colors.textSecondary }]}>
        {titulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titulo: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    lineHeight: 32,
  },
  subtitulo: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  data: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  resumoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  resumoCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  resumoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  resumoValor: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    lineHeight: 26,
  },
  resumoTitulo: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
    textAlign: "center",
  },
  lista: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
