// Estado vazio — design premium
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
      <View style={styles.iconeContainer}>
        <LinearGradient
          colors={["#E8F5EF", "#D1EEE2"]}
          style={styles.iconeGradient}
        >
          <View style={[styles.iconeInner, { backgroundColor: colors.accent + "40" }]}>
            <Ionicons name="medkit-outline" size={52} color={colors.primary} />
          </View>
        </LinearGradient>
      </View>

      {/* Texto */}
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
          {subtitulo}
        </Text>
      </View>

      {/* Features list */}
      <View style={[styles.featuresList, { backgroundColor: colors.card }]}>
        {[
          { icone: "notifications", texto: "Lembretes nos horários que escolheres" },
          { icone: "checkmark-circle", texto: "Regista cada dose tomada" },
          { icone: "stats-chart", texto: "Acompanha a tua aderência ao tratamento" },
        ].map((f, i) => (
          <View key={i} style={[styles.featureItem, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.featureIcone, { backgroundColor: colors.primary + "12" }]}>
              <Ionicons name={f.icone as keyof typeof Ionicons.glyphMap} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.featureTexto, { color: colors.text }]}>{f.texto}</Text>
          </View>
        ))}
      </View>

      {/* CTA button */}
      {onAdicionar && (
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: colors.primary }]}
          onPress={onAdicionar}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.botaoTexto}>Adicionar primeiro medicamento</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  iconeContainer: {
    marginBottom: 4,
  },
  iconeGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  iconeInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    alignItems: "center",
    gap: 8,
  },
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
  featuresList: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  featureIcone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTexto: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    flex: 1,
    lineHeight: 20,
  },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: "100%",
    justifyContent: "center",
  },
  botaoTexto: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
