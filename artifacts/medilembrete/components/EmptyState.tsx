// Estado vazio — mostrado quando não há medicamentos
import { Ionicons } from "@expo/vector-icons";
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
  subtitulo = "Toca no botão + para adicionar o teu primeiro medicamento",
  onAdicionar,
}: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconeWrapper, { backgroundColor: colors.accent + "30" }]}>
        <Ionicons name="medkit-outline" size={64} color={colors.accent} />
      </View>
      <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
      <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
        {subtitulo}
      </Text>
      {onAdicionar && (
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: colors.primary }]}
          onPress={onAdicionar}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.botaoTexto}>Adicionar agora</Text>
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
    paddingHorizontal: 32,
    gap: 12,
  },
  iconeWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  titulo: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  botaoTexto: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
