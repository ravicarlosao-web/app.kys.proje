// Ecrã de detalhes de um medicamento
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMedicamentos } from "@/context/MedicamentosContext";
import { DIAS_SEMANA_COMPLETOS } from "@/types";
import { CategoriaMedicamento } from "@/constants/colors";

function getIconeCategoria(cat: CategoriaMedicamento): keyof typeof Ionicons.glyphMap {
  const m: Record<string, keyof typeof Ionicons.glyphMap> = {
    comprimido: "medical",
    xarope: "water",
    injecao: "fitness",
    pomada: "bandage",
    colurio: "eye",
    inalador: "cloud",
  };
  return m[cat] ?? "medical";
}

function formatarData(str: string | null): string {
  if (!str) return "—";
  try {
    return format(new Date(str), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return str;
  }
}

export default function DetalhesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { medicamentos, historico, marcarComoTomado } = useMedicamentos();

  const medicamento = medicamentos.find((m) => m.id === id);

  // Configura botão de editar no header
  useEffect(() => {
    if (!medicamento) return;
    navigation.setOptions({
      title: medicamento.nome,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push(`/editar/${id}`)}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [medicamento, navigation, id, colors.primary]);

  // Histórico recente (últimos 7 dias)
  const historicoRecente = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);
    return historico
      .filter((r) => r.medicamentoId === id && new Date(r.dataHora) >= limite)
      .slice(0, 20);
  }, [historico, id]);

  // Doses de hoje
  const hoje = new Date().toISOString().split("T")[0];
  const dosesTomadasHoje = useMemo(
    () =>
      new Set(
        historico
          .filter((r) => r.medicamentoId === id && r.dataHora.startsWith(hoje))
          .map((r) => r.horario)
      ),
    [historico, id, hoje]
  );

  if (!medicamento) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: "Poppins_400Regular" }}>
          Medicamento não encontrado.
        </Text>
      </View>
    );
  }

  const esgotado = medicamento.estoque !== null && medicamento.estoque === 0;
  const stockBaixo = medicamento.estoque !== null && medicamento.estoque > 0 && medicamento.estoque < 5;
  const stockPercent =
    medicamento.estoque !== null
      ? Math.min(100, (medicamento.estoque / 30) * 100)
      : 100;

  const diasNomes = medicamento.diasSemana
    .sort()
    .map((d) => DIAS_SEMANA_COMPLETOS[d])
    .join(", ");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
    >
      {/* Card principal */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Barra de cor e ícone */}
        <View style={[styles.cardTopo, { backgroundColor: medicamento.cor + "15" }]}>
          <View
            style={[styles.iconeGrande, { backgroundColor: medicamento.cor + "25" }]}
          >
            <Ionicons
              name={getIconeCategoria(medicamento.categoria as CategoriaMedicamento)}
              size={40}
              color={medicamento.cor}
            />
          </View>
          <View style={styles.cardTopoInfo}>
            <Text style={[styles.nomeGrande, { color: colors.text }]}>
              {medicamento.nome}
            </Text>
            <Text style={[styles.dosagemGrande, { color: colors.textSecondary }]}>
              {medicamento.dosagem}
            </Text>
            <View
              style={[styles.categoriaTag, { backgroundColor: medicamento.cor + "20" }]}
            >
              <Text style={[styles.categoriaTexto, { color: medicamento.cor }]}>
                {medicamento.categoria.charAt(0).toUpperCase() +
                  medicamento.categoria.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Datas */}
          <InfoRow
            icone="calendar-outline"
            label="Início"
            valor={formatarData(medicamento.dataInicio)}
            cor={medicamento.cor}
            colors={colors}
          />
          {medicamento.dataFim && (
            <InfoRow
              icone="calendar"
              label="Fim"
              valor={formatarData(medicamento.dataFim)}
              cor={medicamento.cor}
              colors={colors}
            />
          )}

          {/* Dias */}
          <InfoRow
            icone="repeat-outline"
            label="Dias"
            valor={diasNomes}
            cor={medicamento.cor}
            colors={colors}
          />

          {/* Instruções */}
          {medicamento.instrucoes ? (
            <InfoRow
              icone="information-circle-outline"
              label="Instruções"
              valor={medicamento.instrucoes}
              cor={medicamento.cor}
              colors={colors}
            />
          ) : null}

          {/* Estoque */}
          {medicamento.estoque !== null && (
            <View style={styles.stockSection}>
              <View style={styles.stockHeader}>
                <Ionicons name="cube-outline" size={16} color={medicamento.cor} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Stock disponível
                </Text>
                <Text
                  style={[
                    styles.stockValor,
                    {
                      color: esgotado
                        ? colors.danger
                        : stockBaixo
                        ? colors.warning
                        : colors.success,
                    },
                  ]}
                >
                  {esgotado
                    ? "Esgotado"
                    : stockBaixo
                    ? `${medicamento.estoque} restantes`
                    : `${medicamento.estoque} unidades`}
                </Text>
              </View>
              <View style={[styles.stockBarra, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.stockProgresso,
                    {
                      width: `${stockPercent}%` as `${number}%`,
                      backgroundColor: esgotado
                        ? colors.danger
                        : stockBaixo
                        ? colors.warning
                        : colors.success,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Horários de hoje */}
      <Text style={[styles.secaoTitulo, { color: colors.text }]}>
        Horários de hoje
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {medicamento.horarios.length === 0 ? (
          <Text style={[styles.semDados, { color: colors.textSecondary }]}>
            Nenhum horário definido.
          </Text>
        ) : (
          medicamento.horarios.map((h) => {
            const tomado = dosesTomadasHoje.has(h);
            return (
              <View key={h} style={styles.horarioRow}>
                <View
                  style={[
                    styles.horarioIcone,
                    { backgroundColor: (tomado ? colors.success : colors.warning) + "20" },
                  ]}
                >
                  <Ionicons
                    name={tomado ? "checkmark-circle" : "time-outline"}
                    size={20}
                    color={tomado ? colors.success : colors.warning}
                  />
                </View>
                <Text style={[styles.horarioHora, { color: colors.text }]}>{h}</Text>
                <View style={styles.horarioStatus}>
                  <Text
                    style={[
                      styles.horarioStatusTexto,
                      { color: tomado ? colors.success : colors.warning },
                    ]}
                  >
                    {tomado ? "Tomado" : "Pendente"}
                  </Text>
                </View>
                {!tomado && (
                  <TouchableOpacity
                    style={[styles.botaoTomar, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      await marcarComoTomado(medicamento.id, h);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.botaoTomarTexto}>Marcar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Histórico recente */}
      <Text style={[styles.secaoTitulo, { color: colors.text }]}>
        Histórico recente
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {historicoRecente.length === 0 ? (
          <Text style={[styles.semDados, { color: colors.textSecondary }]}>
            Nenhum registo nos últimos 7 dias.
          </Text>
        ) : (
          historicoRecente.slice(0, 10).map((r) => {
            const tomado = r.status === "tomado";
            return (
              <View key={r.id} style={styles.historicoRow}>
                <Ionicons
                  name={tomado ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={tomado ? colors.success : colors.danger}
                />
                <Text style={[styles.historicoTexto, { color: colors.text }]}>
                  {r.horario}
                </Text>
                <Text style={[styles.historicoData, { color: colors.textSecondary }]}>
                  {format(new Date(r.dataHora), "d MMM HH:mm", { locale: ptBR })}
                </Text>
                <View
                  style={[
                    styles.historicoBadge,
                    { backgroundColor: (tomado ? colors.success : colors.danger) + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.historicoBadgeTexto,
                      { color: tomado ? colors.success : colors.danger },
                    ]}
                  >
                    {tomado ? "Tomado" : "Saltado"}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// Componente de linha de informação
interface InfoRowProps {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
  valor: string;
  cor: string;
  colors: ReturnType<typeof useColors>;
}
function InfoRow({ icone, label, valor, cor, colors }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icone} size={16} color={cor} />
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValor, { color: colors.text }]} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 8,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  iconeGrande: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTopoInfo: {
    flex: 1,
    gap: 4,
  },
  nomeGrande: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    lineHeight: 28,
  },
  dosagemGrande: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  categoriaTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  categoriaTexto: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    width: 70,
  },
  infoValor: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  stockSection: {
    gap: 8,
  },
  stockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stockValor: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: "auto",
  },
  stockBarra: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  stockProgresso: {
    height: 8,
    borderRadius: 4,
  },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  horarioIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  horarioHora: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    flex: 1,
  },
  horarioStatus: {},
  horarioStatusTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  botaoTomar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  botaoTomarTexto: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  historicoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  historicoTexto: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  historicoData: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    flex: 1,
    textAlign: "right",
  },
  historicoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historicoBadgeTexto: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  semDados: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    padding: 16,
    textAlign: "center",
  },
});
