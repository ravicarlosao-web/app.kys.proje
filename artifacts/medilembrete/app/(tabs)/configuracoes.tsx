// Ecrã de Configurações — notificações push e preferências
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Image } from "react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMedicamentos } from "@/context/MedicamentosContext";
import { requestPermissions } from "@/services/notificationService";

const CHAVE_CONFIG = "@medilembrete:config_notificacoes";

interface ConfigNotificacoes {
  lembretesMedicamentos: boolean;
  alertasStockBaixo: boolean;
  silencioNoturnoAtivo: boolean;
  silencioInicio: string;
  silencioFim: string;
}

const CONFIG_PADRAO: ConfigNotificacoes = {
  lembretesMedicamentos: true,
  alertasStockBaixo: true,
  silencioNoturnoAtivo: false,
  silencioInicio: "22:00",
  silencioFim: "07:00",
};

async function carregarConfig(): Promise<ConfigNotificacoes> {
  try {
    const raw = await AsyncStorage.getItem(CHAVE_CONFIG);
    if (raw) return { ...CONFIG_PADRAO, ...JSON.parse(raw) };
  } catch {}
  return CONFIG_PADRAO;
}

async function guardarConfig(config: ConfigNotificacoes): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  } catch {}
}

async function enviarNotificacaoTeste(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ Notificações activas!",
        body: "O MediLembrete irá lembrá-lo das suas tomas no horário certo.",
        sound: true,
      },
      trigger: null,
    });
  } catch {}
}

export default function ConfiguracoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { temPermissaoNotificacoes } = useMedicamentos();
  const [permissao, setPermissao] = useState(temPermissaoNotificacoes);
  const [config, setConfig] = useState<ConfigNotificacoes>(CONFIG_PADRAO);
  const [carregando, setCarregando] = useState(true);

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  useEffect(() => {
    carregarConfig().then((c) => {
      setConfig(c);
      setCarregando(false);
    });
    setPermissao(temPermissaoNotificacoes);
  }, [temPermissaoNotificacoes]);

  const atualizarConfig = async (campo: keyof ConfigNotificacoes, valor: boolean | string) => {
    const nova = { ...config, [campo]: valor };
    setConfig(nova);
    await guardarConfig(nova);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pedirPermissao = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (permissao) {
      // Já tem permissão — abrir definições do sistema
      if (Platform.OS === "ios" || Platform.OS === "android") {
        Linking.openSettings();
      }
      return;
    }
    const concedida = await requestPermissions();
    setPermissao(concedida);
    if (!concedida) {
      Alert.alert(
        "Permissão negada",
        "Para receber lembretes, acede às Definições do teu telefone e ativa as notificações para o MediLembrete.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir Definições", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const testarNotificacao = async () => {
    if (!permissao) {
      Alert.alert("Sem permissão", "Ativa as notificações primeiro para poderes testá-las.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await enviarNotificacaoTeste();
    Alert.alert("Notificação enviada!", "Verifica a barra de notificações do teu dispositivo.");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fundo gradiente */}
      <LinearGradient
        colors={["#0D2E1F", "#1A4D38", "#2D6A4F", "#3D8B6A", "#74C69D"]}
        locations={[0, 0.2, 0.4, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerTopo}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.headerTitulo}>Configurações</Text>
            <Text style={styles.headerSub}>Notificações e preferências</Text>
          </View>
        </View>

        {/* Card de status de permissão */}
        <TouchableOpacity onPress={pedirPermissao} activeOpacity={0.85}>
          <View style={[styles.glassPanel, styles.statusCard]}>
            <View style={[styles.statusDot, { backgroundColor: permissao ? "#6EE7B7" : "#FCA5A5" }]} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitulo}>
                {permissao ? "Notificações activas" : "Notificações desactivadas"}
              </Text>
              <Text style={styles.statusSub}>
                {permissao
                  ? "O MediLembrete pode enviar lembretes"
                  : "Toca para activar nas Definições"}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: permissao ? "rgba(110,231,183,0.2)" : "rgba(252,165,165,0.2)" }]}>
              <Ionicons
                name={permissao ? "checkmark-circle" : "alert-circle"}
                size={22}
                color={permissao ? "#6EE7B7" : "#FCA5A5"}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Conteúdo glass */}
      <View style={styles.conteudo}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Secção: Tipos de notificação */}
          <Text style={[styles.secaoTitulo, { color: colors.textSecondary }]}>TIPOS DE NOTIFICAÇÃO</Text>

          <View style={[styles.secaoCard, { backgroundColor: colors.card, borderColor: "rgba(255,255,255,0.6)" }]}>
            <ConfigRow
              icone="medical"
              iconeCor="#2D6A4F"
              iconeFundo="#D1FAE5"
              titulo="Lembretes de medicamentos"
              descricao="Notificação nos horários agendados de cada medicamento"
              valor={config.lembretesMedicamentos}
              onChange={(v) => atualizarConfig("lembretesMedicamentos", v)}
              disabled={!permissao}
              separador
            />
            <ConfigRow
              icone="warning"
              iconeCor="#D97706"
              iconeFundo="#FEF3C7"
              titulo="Alertas de stock baixo"
              descricao="Aviso quando os comprimidos estão a acabar (≤5 doses)"
              valor={config.alertasStockBaixo}
              onChange={(v) => atualizarConfig("alertasStockBaixo", v)}
              disabled={!permissao}
            />
          </View>

          {/* Secção: Silêncio noturno */}
          <Text style={[styles.secaoTitulo, { color: colors.textSecondary }]}>SILÊNCIO NOTURNO</Text>

          <View style={[styles.secaoCard, { backgroundColor: colors.card, borderColor: "rgba(255,255,255,0.6)" }]}>
            <ConfigRow
              icone="moon"
              iconeCor="#6366F1"
              iconeFundo="#EDE9FE"
              titulo="Silêncio noturno"
              descricao="Suspender notificações durante a noite"
              valor={config.silencioNoturnoAtivo}
              onChange={(v) => atualizarConfig("silencioNoturnoAtivo", v)}
              disabled={!permissao}
              separador
            />

            {config.silencioNoturnoAtivo && (
              <View style={styles.silencioHorarios}>
                <HorarioChip
                  label="Início"
                  horario={config.silencioInicio}
                  icone="moon-outline"
                  cor="#6366F1"
                  onChange={(h) => atualizarConfig("silencioInicio", h)}
                  opcoesHorario={["20:00", "21:00", "22:00", "23:00", "00:00"]}
                />
                <View style={styles.silencioSeta}>
                  <Ionicons name="arrow-forward" size={16} color={colors.mutedForeground} />
                </View>
                <HorarioChip
                  label="Fim"
                  horario={config.silencioFim}
                  icone="sunny-outline"
                  cor="#D97706"
                  onChange={(h) => atualizarConfig("silencioFim", h)}
                  opcoesHorario={["05:00", "06:00", "07:00", "08:00", "09:00"]}
                />
              </View>
            )}
          </View>

          {/* Secção: Ferramentas */}
          <Text style={[styles.secaoTitulo, { color: colors.textSecondary }]}>FERRAMENTAS</Text>

          <View style={[styles.secaoCard, { backgroundColor: colors.card, borderColor: "rgba(255,255,255,0.6)" }]}>
            {/* Testar notificação */}
            <TouchableOpacity
              style={styles.acaoRow}
              onPress={testarNotificacao}
              activeOpacity={0.7}
            >
              <View style={[styles.acaoIcone, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="notifications" size={20} color="#2563EB" />
              </View>
              <View style={styles.acaoInfo}>
                <Text style={[styles.acaoTitulo, { color: colors.text }]}>Enviar notificação de teste</Text>
                <Text style={[styles.acaoDescricao, { color: colors.textSecondary }]}>
                  Verifica se as notificações chegam correctamente
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </TouchableOpacity>

            <View style={[styles.separador, { backgroundColor: colors.border }]} />

            {/* Abrir definições do sistema */}
            <TouchableOpacity
              style={styles.acaoRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openSettings();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.acaoIcone, { backgroundColor: "#F3F4F6" }]}>
                <Ionicons name="settings-outline" size={20} color="#6B7280" />
              </View>
              <View style={styles.acaoInfo}>
                <Text style={[styles.acaoTitulo, { color: colors.text }]}>Definições do sistema</Text>
                <Text style={[styles.acaoDescricao, { color: colors.textSecondary }]}>
                  Gerir permissões nas definições do telefone
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.border} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.infoTexto, { color: colors.primary }]}>
              O MediLembrete usa apenas notificações locais — os teus dados nunca saem do dispositivo e não é necessária ligação à Internet.
            </Text>
          </View>

          {/* Versão */}
          <Text style={[styles.versao, { color: colors.mutedForeground }]}>
            MediLembrete v1.0 · 100% offline
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

// Linha de configuração com switch
function ConfigRow({
  icone,
  iconeCor,
  iconeFundo,
  titulo,
  descricao,
  valor,
  onChange,
  disabled,
  separador,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  iconeCor: string;
  iconeFundo: string;
  titulo: string;
  descricao: string;
  valor: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  separador?: boolean;
}) {
  const colors = useColors();
  return (
    <>
      <View style={[styles.configRow, disabled && { opacity: 0.5 }]}>
        <View style={[styles.configIcone, { backgroundColor: iconeFundo }]}>
          <Ionicons name={icone} size={19} color={iconeCor} />
        </View>
        <View style={styles.configInfo}>
          <Text style={[styles.configTitulo, { color: colors.text }]}>{titulo}</Text>
          <Text style={[styles.configDescricao, { color: colors.textSecondary }]}>{descricao}</Text>
        </View>
        <Switch
          value={valor}
          onValueChange={disabled ? undefined : onChange}
          trackColor={{ false: colors.border, true: "#2D6A4F" + "80" }}
          thumbColor={valor ? "#2D6A4F" : "#f4f3f4"}
          ios_backgroundColor={colors.border}
          disabled={disabled}
        />
      </View>
      {separador && <View style={[styles.separador, { backgroundColor: colors.border }]} />}
    </>
  );
}

// Chip de horário com seleção
function HorarioChip({
  label,
  horario,
  icone,
  cor,
  onChange,
  opcoesHorario,
}: {
  label: string;
  horario: string;
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  onChange: (h: string) => void;
  opcoesHorario: string[];
}) {
  const colors = useColors();
  const [aberto, setAberto] = useState(false);

  return (
    <View style={styles.horarioWrap}>
      <Text style={[styles.horarioLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setAberto(!aberto);
        }}
        style={[styles.horarioChip, { borderColor: cor + "50", backgroundColor: cor + "10" }]}
      >
        <Ionicons name={icone} size={14} color={cor} />
        <Text style={[styles.horarioTexto, { color: cor }]}>{horario}</Text>
      </TouchableOpacity>
      {aberto && (
        <View style={[styles.horarioDropdown, { backgroundColor: colors.card }]}>
          {opcoesHorario.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.horarioOpcao, h === horario && { backgroundColor: cor + "15" }]}
              onPress={() => {
                onChange(h);
                setAberto(false);
              }}
            >
              <Text style={[styles.horarioOpcaoTexto, { color: h === horario ? cor : colors.text }]}>
                {h}
              </Text>
              {h === horario && <Ionicons name="checkmark" size={14} color={cor} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999, opacity: 0.18 },
  blob1: { width: 280, height: 280, backgroundColor: "#52B788", top: -60, right: -80 },
  blob2: { width: 200, height: 200, backgroundColor: "#95D5B2", top: 120, left: -70 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    zIndex: 1,
  },
  headerTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoWrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 16,
  },
  logoImg: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  headerTitulo: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },

  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  statusInfo: { flex: 1 },
  statusTitulo: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  statusSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Conteúdo
  conteudo: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.93)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    zIndex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },

  secaoTitulo: {
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  secaoCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 4,
  },

  // Linha de configuração
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  configIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  configInfo: { flex: 1, gap: 2 },
  configTitulo: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  configDescricao: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    lineHeight: 17,
  },
  separador: { height: 1, marginHorizontal: 16 },

  // Silêncio noturno
  silencioHorarios: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  silencioSeta: { paddingHorizontal: 4 },
  horarioWrap: { flex: 1, gap: 6, position: "relative" },
  horarioLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  horarioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  horarioTexto: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  horarioDropdown: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
    overflow: "hidden",
  },
  horarioOpcao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  horarioOpcaoTexto: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },

  // Ações
  acaoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  acaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  acaoInfo: { flex: 1, gap: 2 },
  acaoTitulo: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  acaoDescricao: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  infoTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },

  versao: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 8,
    marginBottom: 4,
  },
});
