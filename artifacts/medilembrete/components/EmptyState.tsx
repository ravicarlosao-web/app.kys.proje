// Estado vazio — glassmorphism + gradiente
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  titulo?: string;
  subtitulo?: string;
  onAdicionar?: () => void;
}

export default function EmptyState({
  titulo = "Nenhum medicamento",
  subtitulo = "Adiciona o teu primeiro medicamento e fica sempre em dia com o tratamento.",
  onAdicionar,
}: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {/* Ícone em gradiente */}
      <LinearGradient
        colors={["#D1FAE5", "#A7F3D0", "#6EE7B7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconeGradient}
      >
        <View style={styles.iconeInner}>
          <Ionicons name="medkit-outline" size={52} color="#1B5E3C" />
        </View>
      </LinearGradient>

      {/* Textos */}
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>{subtitulo}</Text>
      </View>

      {/* Cards glass de funcionalidades */}
      <View style={styles.features}>
        {[
          { icone: "notifications" as const, texto: "Notificações nos horários que escolheres", grad: ["#D1FAE5", "#ECFDF5"] as [string, string] },
          { icone: "checkmark-circle" as const, texto: "Regista cada dose tomada com um toque", grad: ["#DBEAFE", "#EFF6FF"] as [string, string] },
          { icone: "stats-chart" as const, texto: "Acompanha a aderência ao tratamento", grad: ["#EDE9FE", "#F5F3FF"] as [string, string] },
        ].map((f, i) => (
          <LinearGradient
            key={i}
            colors={f.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.featureCard, {
              borderColor: "rgba(255,255,255,0.8)",
            }]}
          >
            <View style={[styles.featureIcone, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
              <Ionicons name={f.icone} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.featureTexto, { color: colors.text }]}>{f.texto}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* Botão CTA com gradiente */}
      {onAdicionar && (
        <TouchableOpacity onPress={onAdicionar} activeOpacity={0.85} style={styles.botaoWrapper}>
          <LinearGradient
            colors={["#52C98A", "#2D6A4F", "#1A4D38"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.botao}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.botaoTexto}>Adicionar primeiro medicamento</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 20,
  },
  iconeGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  iconeInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  textos: { alignItems: "center", gap: 8 },
  titulo: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  features: { width: "100%", gap: 8 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIcone: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTexto: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  botaoWrapper: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  botaoTexto: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
