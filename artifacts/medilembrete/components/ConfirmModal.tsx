// Modal de confirmação para ações destrutivas
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  tipo?: "perigo" | "aviso";
}

export default function ConfirmModal({
  visivel,
  titulo,
  mensagem,
  textoBotaoConfirmar = "Confirmar",
  textoBotaoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
  tipo = "perigo",
}: Props) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visivel, scaleAnim, opacityAnim]);

  const corBotao = tipo === "perigo" ? colors.danger : colors.warning;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onCancelar}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            { backgroundColor: colors.card },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Ícone */}
          <View style={[styles.iconeWrapper, { backgroundColor: corBotao + "20" }]}>
            <Ionicons
              name={tipo === "perigo" ? "warning" : "alert-circle"}
              size={32}
              color={corBotao}
            />
          </View>

          {/* Textos */}
          <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
          <Text style={[styles.mensagem, { color: colors.textSecondary }]}>
            {mensagem}
          </Text>

          {/* Botões */}
          <View style={styles.botoes}>
            <TouchableOpacity
              style={[styles.botao, styles.botaoCancelar, { borderColor: colors.border }]}
              onPress={onCancelar}
              activeOpacity={0.7}
            >
              <Text style={[styles.textoCancelar, { color: colors.text }]}>
                {textoBotaoCancelar}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, styles.botaoConfirmar, { backgroundColor: corBotao }]}
              onPress={onConfirmar}
              activeOpacity={0.85}
            >
              <Text style={styles.textoConfirmar}>{textoBotaoConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconeWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  mensagem: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  botoes: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  botao: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoCancelar: {
    borderWidth: 1.5,
  },
  botaoConfirmar: {},
  textoCancelar: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  textoConfirmar: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
