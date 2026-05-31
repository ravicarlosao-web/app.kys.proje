// Ecrã de detalhes premium — glassmorphism + gráfico semanal + stock inline + pausa
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMedicamentos } from "@/context/MedicamentosContext";
import { DIAS_SEMANA, DIAS_SEMANA_COMPLETOS } from "@/types";

const EMOJI: Record<string, string> = {
  comprimido: "💊", xarope: "🥄", injecao: "💉",
  pomada: "🧴", colurio: "👁️", inalador: "💨",
};
const ICONE: Record<string, keyof typeof Ionicons.glyphMap> = {
  comprimido: "medical", xarope: "water", injecao: "fitness",
  pomada: "bandage", colurio: "eye", inalador: "cloud",
};

function formatarData(str: string | null): string {
  if (!str) return "—";
  try { return format(new Date(str), "d 'de' MMMM 'de' yyyy", { locale: ptBR }); }
  catch { return str; }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function DetalhesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    medicamentos, historico,
    marcarComoTomado, eliminarMedicamento,
    togglePausa, atualizarStock,
  } = useMedicamentos();

  const [carregando, setCarregando] = useState(false);

  // Esconder header nativo — usamos o nosso
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const medicamento = medicamentos.find((m) => m.id === id);

  // ─── Histórico filtrado ────────────────────────────────────────────────────
  const historicoMed = useMemo(
    () => historico.filter((r) => r.medicamentoId === id).slice(0, 30),
    [historico, id]
  );

  const hoje = new Date().toISOString().split("T")[0];
  const dosesTomadasHoje = useMemo(
    () => new Set(historicoMed.filter((r) => r.dataHora.startsWith(hoje)).map((r) => r.horario)),
    [historicoMed, hoje]
  );

  // ─── Dados do gráfico semanal (últimos 7 dias) ────────────────────────────
  const dadosSemana = useMemo(() => {
    if (!medicamento) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().split("T")[0];
      const weekday = d.getDay();
      const isAgendado = medicamento.diasSemana.includes(weekday);
      const agendadas = isAgendado ? medicamento.horarios.length : 0;
      const tomadas = historico.filter(
        (r) => r.medicamentoId === id && r.dataHora.startsWith(dayStr) && r.status === "tomado"
      ).length;
      const pct = agendadas > 0 ? Math.min(100, Math.round((tomadas / agendadas) * 100)) : null;
      return {
        dia: DIAS_SEMANA[weekday],
        data: d.getDate(),
        isHoje: i === 6,
        isAgendado,
        agendadas,
        tomadas,
        pct,
      };
    });
  }, [medicamento, historico, id]);

  const aderenciaMedia = useMemo(() => {
    const validos = dadosSemana.filter((d) => d.pct !== null);
    if (!validos.length) return null;
    return Math.round(validos.reduce((acc, d) => acc + (d.pct ?? 0), 0) / validos.length);
  }, [dadosSemana]);

  if (!medicamento) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: "Poppins_400Regular" }}>
          Medicamento não encontrado.
        </Text>
      </View>
    );
  }

  const cor = medicamento.cor;
  const emoji = EMOJI[medicamento.categoria] ?? "💊";
  const icone = ICONE[medicamento.categoria] ?? "medical";
  const esgotado = medicamento.estoque !== null && medicamento.estoque === 0;
  const stockBaixo = medicamento.estoque !== null && medicamento.estoque > 0 && medicamento.estoque <= 5;
  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const handleEliminar = () => {
    Alert.alert(
      "Eliminar medicamento",
      `Tens a certeza que queres eliminar "${medicamento.nome}"? Esta acção não pode ser revertida.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await eliminarMedicamento(medicamento.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleTogglePausa = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCarregando(true);
    await togglePausa(medicamento.id);
    setCarregando(false);
  };

  const handleStock = async (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await atualizarStock(medicamento.id, delta);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ─── Gradiente de fundo ─────────────────────────────────────────── */}
      <LinearGradient
        colors={["#0D2E1F", "#1A4D38", "#2D6A4F", hexToRgba(cor, 0.55), cor]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.blob, { backgroundColor: cor, top: -50, right: -70 }]} />
      <View style={[styles.blob, { backgroundColor: "#52B788", top: 130, left: -60, width: 160, height: 160 }]} />

      {/* ─── Header personalizado ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        {/* Navegação */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitulo} numberOfLines={1}>{medicamento.nome}</Text>
          <TouchableOpacity onPress={() => router.push(`/editar/${id}`)} style={styles.navBtn}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Hero — ícone grande + info */}
        <View style={styles.hero}>
          <View style={[styles.heroIconeWrap, { backgroundColor: hexToRgba(cor, 0.25), borderColor: hexToRgba(cor, 0.5) }]}>
            <Text style={styles.heroEmoji}>{emoji}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroNome}>{medicamento.nome}</Text>
            <Text style={styles.heroDosagem}>{medicamento.dosagem}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, { backgroundColor: hexToRgba(cor, 0.3), borderColor: hexToRgba(cor, 0.5) }]}>
                <Text style={[styles.badgeTexto, { color: "#fff" }]}>
                  {medicamento.categoria.charAt(0).toUpperCase() + medicamento.categoria.slice(1)}
                </Text>
              </View>
              <View style={[
                styles.badge,
                { backgroundColor: medicamento.ativo ? "rgba(110,231,183,0.25)" : "rgba(252,165,165,0.25)",
                  borderColor: medicamento.ativo ? "rgba(110,231,183,0.5)" : "rgba(252,165,165,0.5)" }
              ]}>
                <View style={[styles.statusPonto, { backgroundColor: medicamento.ativo ? "#6EE7B7" : "#FCA5A5" }]} />
                <Text style={[styles.badgeTexto, { color: medicamento.ativo ? "#6EE7B7" : "#FCA5A5" }]}>
                  {medicamento.ativo ? "Activo" : "Pausado"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Corpo scrollável ────────────────────────────────────────────── */}
      <View style={styles.corpo}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        >

          {/* ── Acções rápidas ───────────────────────────────────────────── */}
          <View style={styles.acoesRapidas}>
            <TouchableOpacity
              style={[styles.acaoBtn, { backgroundColor: medicamento.ativo ? "#FEF3C7" : "#D1FAE5" }]}
              onPress={handleTogglePausa}
              disabled={carregando}
            >
              <Ionicons
                name={medicamento.ativo ? "pause-circle-outline" : "play-circle-outline"}
                size={20}
                color={medicamento.ativo ? "#D97706" : "#059669"}
              />
              <Text style={[styles.acaoBtnTexto, { color: medicamento.ativo ? "#D97706" : "#059669" }]}>
                {medicamento.ativo ? "Pausar" : "Activar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acaoBtn, { backgroundColor: "#DBEAFE" }]}
              onPress={() => router.push(`/editar/${id}`)}
            >
              <Ionicons name="create-outline" size={20} color="#2563EB" />
              <Text style={[styles.acaoBtnTexto, { color: "#2563EB" }]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acaoBtn, { backgroundColor: "#FEE2E2" }]}
              onPress={handleEliminar}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={[styles.acaoBtnTexto, { color: "#DC2626" }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>

          {/* ── Informações gerais ───────────────────────────────────────── */}
          <SecaoTitulo titulo="Informações" />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <InfoRow icone="calendar-outline" label="Início" valor={formatarData(medicamento.dataInicio)} cor={cor} colors={colors} />
            {medicamento.dataFim && (
              <>
                <Divisor colors={colors} />
                <InfoRow icone="calendar" label="Fim" valor={formatarData(medicamento.dataFim)} cor={cor} colors={colors} />
              </>
            )}
            <Divisor colors={colors} />
            <InfoRow
              icone="repeat-outline"
              label="Dias"
              valor={medicamento.diasSemana.length === 7
                ? "Todos os dias"
                : medicamento.diasSemana.sort().map((d) => DIAS_SEMANA_COMPLETOS[d]).join(", ")}
              cor={cor}
              colors={colors}
            />
            {medicamento.instrucoes ? (
              <>
                <Divisor colors={colors} />
                <InfoRow icone="information-circle-outline" label="Instruções" valor={medicamento.instrucoes} cor={cor} colors={colors} />
              </>
            ) : null}
          </View>

          {/* ── Stock com edição inline ──────────────────────────────────── */}
          {medicamento.estoque !== null && (
            <>
              <SecaoTitulo titulo="Stock" />
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.stockRow}>
                  <View style={styles.stockInfo}>
                    <View style={[styles.stockIcone, {
                      backgroundColor: esgotado ? "#FEE2E2" : stockBaixo ? "#FEF3C7" : "#D1FAE5"
                    }]}>
                      <Ionicons
                        name="cube-outline"
                        size={20}
                        color={esgotado ? "#DC2626" : stockBaixo ? "#D97706" : "#059669"}
                      />
                    </View>
                    <View>
                      <Text style={[styles.stockNumero, {
                        color: esgotado ? "#DC2626" : stockBaixo ? "#D97706" : colors.text,
                        fontSize: 28,
                      }]}>
                        {medicamento.estoque}
                      </Text>
                      <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>
                        {esgotado ? "Esgotado" : stockBaixo ? "Baixo — reabastecer" : "unidades restantes"}
                      </Text>
                    </View>
                  </View>

                  {/* Botões +/- */}
                  <View style={styles.stockBotoes}>
                    <TouchableOpacity
                      style={[styles.stockBtn, { backgroundColor: colors.border + "60" }]}
                      onPress={() => handleStock(-1)}
                      disabled={medicamento.estoque === 0}
                    >
                      <Ionicons name="remove" size={20} color={medicamento.estoque === 0 ? colors.border : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stockBtn, { backgroundColor: cor + "20", borderColor: cor + "40", borderWidth: 1 }]}
                      onPress={() => handleStock(+1)}
                    >
                      <Ionicons name="add" size={20} color={cor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stockBtnLarge, { backgroundColor: cor + "15", borderColor: cor + "30", borderWidth: 1 }]}
                      onPress={() => {
                        Alert.prompt
                          ? Alert.prompt("Repor stock", "Introduz a nova quantidade:", (val) => {
                              const n = parseInt(val, 10);
                              if (!isNaN(n) && n >= 0) handleStock(n - (medicamento.estoque ?? 0));
                            }, "plain-text", String(medicamento.estoque))
                          : handleStock(30 - (medicamento.estoque ?? 0));
                      }}
                    >
                      <Ionicons name="refresh" size={14} color={cor} />
                      <Text style={[styles.stockBtnLargeTexto, { color: cor }]}>+30</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Barra de progresso de stock */}
                <View style={[styles.stockBarra, { backgroundColor: colors.border }]}>
                  <View style={[styles.stockProgresso, {
                    width: `${Math.min(100, (medicamento.estoque / 30) * 100)}%` as `${number}%`,
                    backgroundColor: esgotado ? "#DC2626" : stockBaixo ? "#D97706" : "#059669",
                  }]} />
                </View>
              </View>
            </>
          )}

          {/* ── Horários de hoje ─────────────────────────────────────────── */}
          <SecaoTitulo titulo="Hoje" />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {!medicamento.diasSemana.includes(new Date().getDay()) ? (
              <View style={styles.semDadosRow}>
                <Ionicons name="moon-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.semDados, { color: colors.textSecondary }]}>
                  Não agendado para hoje
                </Text>
              </View>
            ) : medicamento.horarios.length === 0 ? (
              <Text style={[styles.semDados, { color: colors.textSecondary }]}>
                Sem horários definidos.
              </Text>
            ) : (
              medicamento.horarios.map((h, idx) => {
                const tomado = dosesTomadasHoje.has(h);
                return (
                  <React.Fragment key={h}>
                    {idx > 0 && <Divisor colors={colors} />}
                    <View style={styles.horarioRow}>
                      <View style={[styles.horarioIcone, {
                        backgroundColor: tomado ? "#D1FAE5" : "#FEF3C7",
                      }]}>
                        <Ionicons
                          name={tomado ? "checkmark-circle" : "time-outline"}
                          size={22}
                          color={tomado ? "#059669" : "#D97706"}
                        />
                      </View>
                      <Text style={[styles.horarioHora, { color: colors.text }]}>{h}</Text>
                      <Text style={[styles.horarioStatus, {
                        color: tomado ? "#059669" : "#D97706",
                      }]}>
                        {tomado ? "Tomado" : "Pendente"}
                      </Text>
                      {!tomado && (
                        <TouchableOpacity
                          style={[styles.botaoTomar, { backgroundColor: cor }]}
                          onPress={async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            await marcarComoTomado(medicamento.id, h);
                          }}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                          <Text style={styles.botaoTomarTexto}>Marcar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </View>

          {/* ── Gráfico de aderência semanal ────────────────────────────── */}
          <SecaoTitulo
            titulo="Aderência semanal"
            detalhe={aderenciaMedia !== null ? `${aderenciaMedia}% média` : undefined}
            corDetalhe={aderenciaMedia !== null
              ? aderenciaMedia >= 80 ? "#059669" : aderenciaMedia >= 50 ? "#D97706" : "#DC2626"
              : undefined}
          />
          <View style={[styles.card, { backgroundColor: colors.card, paddingBottom: 16 }]}>
            <View style={styles.grafico}>
              {dadosSemana.map((d, i) => {
                const corBarra = d.pct === null
                  ? colors.border
                  : d.pct >= 80 ? "#059669"
                  : d.pct >= 50 ? "#D97706"
                  : d.pct === 0 && d.isAgendado ? "#DC2626"
                  : colors.border;

                const alturaMax = 80;
                const altura = d.pct !== null && d.isAgendado
                  ? Math.max(6, (d.pct / 100) * alturaMax)
                  : d.isAgendado ? 6 : 0;

                return (
                  <View key={i} style={styles.graficoColuna}>
                    {/* Valor % */}
                    <Text style={[styles.graficoValor, {
                      color: d.pct !== null && d.isAgendado ? corBarra : "transparent",
                    }]}>
                      {d.pct !== null && d.isAgendado ? `${d.pct}%` : ""}
                    </Text>

                    {/* Barra */}
                    <View style={[styles.graficoBarraWrap, { height: alturaMax }]}>
                      {d.isAgendado ? (
                        <LinearGradient
                          colors={[corBarra + "99", corBarra]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[styles.graficoBarra, { height: altura }]}
                        />
                      ) : (
                        <View style={[styles.graficoNaoAgendado]} />
                      )}
                    </View>

                    {/* Dia + data */}
                    <Text style={[styles.graficoDia, {
                      color: d.isHoje ? cor : colors.text,
                      fontFamily: d.isHoje ? "Poppins_700Bold" : "Poppins_400Regular",
                    }]}>
                      {d.dia}
                    </Text>
                    <Text style={[styles.graficoData, { color: colors.mutedForeground }]}>
                      {d.data}
                    </Text>
                    {d.isHoje && <View style={[styles.graficoPonto, { backgroundColor: cor }]} />}
                  </View>
                );
              })}
            </View>

            {/* Legenda */}
            <View style={styles.graficoLegenda}>
              <LegendaItem cor="#059669" texto="≥80%" />
              <LegendaItem cor="#D97706" texto="50-79%" />
              <LegendaItem cor="#DC2626" texto="<50%" />
              <LegendaItem cor={colors.border} texto="N/A" />
            </View>
          </View>

          {/* ── Histórico recente ────────────────────────────────────────── */}
          <SecaoTitulo titulo="Histórico" detalhe={`${historicoMed.length} registos`} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {historicoMed.length === 0 ? (
              <View style={styles.semDadosRow}>
                <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.semDados, { color: colors.textSecondary }]}>
                  Sem registos ainda.
                </Text>
              </View>
            ) : (
              historicoMed.map((r, idx) => {
                const tomado = r.status === "tomado";
                return (
                  <React.Fragment key={r.id}>
                    {idx > 0 && <Divisor colors={colors} />}
                    <View style={styles.historicoRow}>
                      <View style={[styles.historicoIcone, {
                        backgroundColor: tomado ? "#D1FAE5" : "#FEE2E2",
                      }]}>
                        <Ionicons
                          name={tomado ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={tomado ? "#059669" : "#DC2626"}
                        />
                      </View>
                      <View style={styles.historicoInfo}>
                        <Text style={[styles.historicoHorario, { color: colors.text }]}>
                          {r.horario}
                        </Text>
                        <Text style={[styles.historicoData, { color: colors.textSecondary }]}>
                          {format(new Date(r.dataHora), "EEEE, d MMM · HH:mm", { locale: ptBR })}
                        </Text>
                      </View>
                      <View style={[styles.historicoBadge, {
                        backgroundColor: tomado ? "#D1FAE5" : "#FEE2E2",
                      }]}>
                        <Text style={[styles.historicoBadgeTexto, {
                          color: tomado ? "#059669" : "#DC2626",
                        }]}>
                          {tomado ? "Tomado" : "Saltado"}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SecaoTitulo({ titulo, detalhe, corDetalhe }: {
  titulo: string; detalhe?: string; corDetalhe?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.secaoHeader}>
      <Text style={[styles.secaoTitulo, { color: colors.text }]}>{titulo}</Text>
      {detalhe && (
        <Text style={[styles.secaoDetalhe, { color: corDetalhe ?? colors.mutedForeground }]}>
          {detalhe}
        </Text>
      )}
    </View>
  );
}

function Divisor({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divisor, { backgroundColor: colors.border }]} />;
}

function InfoRow({ icone, label, valor, cor, colors }: {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
  valor: string;
  cor: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcone, { backgroundColor: cor + "15" }]}>
        <Ionicons name={icone} size={16} color={cor} />
      </View>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValor, { color: colors.text }]} numberOfLines={2}>{valor}</Text>
    </View>
  );
}

function LegendaItem({ cor, texto }: { cor: string; texto: string }) {
  const colors = useColors();
  return (
    <View style={styles.legendaItem}>
      <View style={[styles.legendaPonto, { backgroundColor: cor }]} />
      <Text style={[styles.legendaTexto, { color: colors.textSecondary }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centrado: { flex: 1, alignItems: "center", justifyContent: "center" },
  blob: { position: "absolute", width: 220, height: 220, borderRadius: 999, opacity: 0.2 },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24, gap: 16, zIndex: 1 },
  headerNav: { flexDirection: "row", alignItems: "center", gap: 12 },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitulo: {
    flex: 1, fontSize: 18, fontFamily: "Poppins_700Bold",
    color: "#fff", textAlign: "center",
  },

  // Hero
  hero: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroIconeWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, flexShrink: 0,
  },
  heroEmoji: { fontSize: 34 },
  heroInfo: { flex: 1, gap: 4 },
  heroNome: { fontSize: 20, fontFamily: "Poppins_700Bold", color: "#fff", lineHeight: 26 },
  heroDosagem: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)" },
  heroBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  badgeTexto: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  statusPonto: { width: 6, height: 6, borderRadius: 3 },

  // Corpo
  corpo: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.93)",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: "hidden", zIndex: 1,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },

  // Acções rápidas
  acoesRapidas: { flexDirection: "row", gap: 8, marginBottom: 4 },
  acaoBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12,
  },
  acaoBtnTexto: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },

  // Secção
  secaoHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "baseline", marginTop: 8, marginBottom: 4, paddingHorizontal: 2,
  },
  secaoTitulo: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  secaoDetalhe: { fontSize: 13, fontFamily: "Poppins_500Medium" },

  // Card
  card: {
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.04)",
  },
  divisor: { height: 1, marginHorizontal: 16 },

  // Info rows
  infoRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 10, padding: 14,
  },
  infoIcone: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoLabel: { fontSize: 13, fontFamily: "Poppins_500Medium", width: 80, paddingTop: 6 },
  infoValor: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", paddingTop: 6, lineHeight: 20 },

  // Stock
  stockRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  stockInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  stockIcone: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stockNumero: { fontFamily: "Poppins_700Bold" },
  stockLabel: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  stockBotoes: { flexDirection: "row", gap: 6, alignItems: "center" },
  stockBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  stockBtnLarge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, height: 38, borderRadius: 12,
  },
  stockBtnLargeTexto: { fontSize: 12, fontFamily: "Poppins_700Bold" },
  stockBarra: { height: 6, borderRadius: 3, marginHorizontal: 16, marginBottom: 16, overflow: "hidden" },
  stockProgresso: { height: 6, borderRadius: 3 },

  // Horários
  horarioRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  horarioIcone: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  horarioHora: { fontSize: 18, fontFamily: "Poppins_700Bold", flex: 1 },
  horarioStatus: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  botaoTomar: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  botaoTomarTexto: { color: "#fff", fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  semDadosRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  semDados: { fontSize: 14, fontFamily: "Poppins_400Regular", padding: 16, textAlign: "center" },

  // Gráfico semanal
  grafico: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  graficoColuna: { flex: 1, alignItems: "center", gap: 4 },
  graficoValor: { fontSize: 9, fontFamily: "Poppins_600SemiBold", height: 14 },
  graficoBarraWrap: { justifyContent: "flex-end", width: "100%", alignItems: "center" },
  graficoBarra: { width: "75%", borderRadius: 4, minHeight: 4 },
  graficoNaoAgendado: { width: 4, height: 4, borderRadius: 2, backgroundColor: "transparent" },
  graficoDia: { fontSize: 10, marginTop: 4 },
  graficoData: { fontSize: 9, fontFamily: "Poppins_400Regular" },
  graficoPonto: { width: 5, height: 5, borderRadius: 3 },
  graficoLegenda: {
    flexDirection: "row", justifyContent: "center", gap: 16,
    marginTop: 12, paddingHorizontal: 16,
  },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendaPonto: { width: 8, height: 8, borderRadius: 4 },
  legendaTexto: { fontSize: 10, fontFamily: "Poppins_400Regular" },

  // Histórico
  historicoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  historicoIcone: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  historicoInfo: { flex: 1, gap: 1 },
  historicoHorario: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  historicoData: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  historicoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  historicoBadgeTexto: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
});
