// Ecrã de histórico de tomas
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
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
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mês" },
];

function formatarDataHora(iso: string): string {
  try {
    return format(new Date(iso), "d MMM, HH:mm", { locale: ptBR });
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

  // Filtrar por tempo
  const historicoFiltrado = useMemo(() => {
    const agora = new Date();
    const inicio = new Date();

    if (filtroTempo === "hoje") {
      inicio.setHours(0, 0, 0, 0);
    } else if (filtroTempo === "semana") {
      inicio.setDate(agora.getDate() - 7);
    } else {
      inicio.setDate(agora.getDate() - 30);
    }

    return historico.filter((r) => {
      const data = new Date(r.dataHora);
      const dentroTempo = data >= inicio;
      const dentroMed = filtroMed === null || r.medicamentoId === filtroMed;
      return dentroTempo && dentroMed;
    });
  }, [historico, filtroTempo, filtroMed]);

  // Calcular adesão
  const percentualAdesao = useMemo(() => {
    if (historicoFiltrado.length === 0) return 0;
    const tomados = historicoFiltrado.filter((r) => r.status === "tomado").length;
    return Math.round((tomados / historicoFiltrado.length) * 100);
  }, [historicoFiltrado]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const renderItem = ({ item }: { item: RegistoHistorico }) => {
    const tomado = item.status === "tomado";
    return (
      <View
        style={[styles.item, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.itemIcone,
            { backgroundColor: (tomado ? colors.success : colors.danger) + "15" },
          ]}
        >
          <Ionicons
            name={tomado ? "checkmark-circle" : "close-circle"}
            size={22}
            color={tomado ? colors.success : colors.danger}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNome, { color: colors.text }]} numberOfLines={1}>
            {item.nomeMedicamento}
          </Text>
          <Text style={[styles.itemDosagem, { color: colors.textSecondary }]}>
            {item.dosagem} · {item.horario}
          </Text>
          <Text style={[styles.itemData, { color: colors.mutedForeground }]}>
            {formatarDataHora(item.dataHora)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (tomado ? colors.success : colors.danger) + "15" },
          ]}
        >
          <Text
            style={[
              styles.statusTexto,
              { color: tomado ? colors.success : colors.danger },
            ]}
          >
            {tomado ? "Tomado" : "Saltado"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 8, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.titulo, { color: colors.text }]}>Histórico</Text>

        {/* Adesão */}
        <View style={[styles.adesaoCard, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.adesaoLabel, { color: colors.textSecondary }]}>
            Adesão ao tratamento
          </Text>
          <Text style={[styles.adesaoValor, { color: colors.primary }]}>
            {percentualAdesao}%
          </Text>
        </View>

        {/* Filtro de tempo */}
        <View style={[styles.filtroRow, { backgroundColor: colors.card }]}>
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
                  {
                    color:
                      filtroTempo === f.id ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtro de medicamento */}
        <FlatList
          horizontal
          data={[
            { id: null, nome: "Todos" },
            ...medicamentos.map((m) => ({ id: m.id, nome: m.nome })),
          ]}
          keyExtractor={(item) => item.id ?? "todos"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.medFiltros}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.medFiltroChip,
                {
                  backgroundColor:
                    filtroMed === item.id ? colors.primary : colors.card,
                  borderColor:
                    filtroMed === item.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFiltroMed(item.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.medFiltroTexto,
                  { color: filtroMed === item.id ? "#fff" : colors.textSecondary },
                ]}
              >
                {item.nome}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista de registos */}
      <FlatList
        data={historicoFiltrado}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.lista,
          { paddingBottom: insets.bottom + 90, flexGrow: 1 },
        ]}
        scrollEnabled={!!historicoFiltrado.length}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="calendar-outline" size={56} color={colors.accent} />
            <Text style={[styles.vazioTexto, { color: colors.textSecondary }]}>
              Nenhum registo para este período
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  titulo: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
  },
  adesaoCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adesaoLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  adesaoValor: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  filtroRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  filtroBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  filtroTexto: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  medFiltros: {
    paddingBottom: 4,
    gap: 8,
  },
  medFiltroChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 6,
  },
  medFiltroTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  lista: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNome: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  itemDosagem: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  itemData: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusTexto: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  vazioTexto: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
});
