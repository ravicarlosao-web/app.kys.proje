// Seletor de hora personalizado em formato de tambor
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visivel: boolean;
  onFechar: () => void;
  onConfirmar: (horario: string) => void;
  horarioInicial?: string;
}

const ITEM_HEIGHT = 50;
const HORAS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTOS = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

export default function TimePicker({
  visivel,
  onFechar,
  onConfirmar,
  horarioInicial = "08:00",
}: Props) {
  const colors = useColors();
  const [hora, setHora] = useState(horarioInicial.split(":")[0]);
  const [minuto, setMinuto] = useState(
    () => {
      const m = parseInt(horarioInicial.split(":")[1]);
      return (Math.round(m / 5) * 5).toString().padStart(2, "0");
    }
  );

  const horaRef = useRef<FlatList>(null);
  const minutoRef = useRef<FlatList>(null);

  const onScrollHora = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    if (index >= 0 && index < HORAS.length) {
      setHora(HORAS[index]);
    }
  };

  const onScrollMinuto = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    if (index >= 0 && index < MINUTOS.length) {
      setMinuto(MINUTOS[index]);
    }
  };

  const confirmar = () => {
    onConfirmar(`${hora}:${minuto}`);
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onFechar}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.titulo, { color: colors.text }]}>
              Selecionar hora
            </Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Hora atual selecionada */}
          <Text style={[styles.horaAtual, { color: colors.primary }]}>
            {hora}:{minuto}
          </Text>

          {/* Seletores */}
          <View style={styles.seletores}>
            {/* Horas */}
            <View style={styles.coluna}>
              <Text style={[styles.colunaLabel, { color: colors.textSecondary }]}>Hora</Text>
              <View style={[styles.colunaContainer, { borderColor: colors.border }]}>
                <View style={[styles.selecaoIndicador, { borderColor: colors.primary }]} />
                <FlatList
                  ref={horaRef}
                  data={HORAS}
                  keyExtractor={(item) => item}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={onScrollHora}
                  initialScrollIndex={parseInt(hora)}
                  getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <View style={[styles.item]}>
                      <Text
                        style={[
                          styles.itemTexto,
                          { color: item === hora ? colors.primary : colors.textSecondary },
                          item === hora && styles.itemSelecionado,
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                />
              </View>
            </View>

            <Text style={[styles.separador, { color: colors.primary }]}>:</Text>

            {/* Minutos */}
            <View style={styles.coluna}>
              <Text style={[styles.colunaLabel, { color: colors.textSecondary }]}>Min</Text>
              <View style={[styles.colunaContainer, { borderColor: colors.border }]}>
                <View style={[styles.selecaoIndicador, { borderColor: colors.primary }]} />
                <FlatList
                  ref={minutoRef}
                  data={MINUTOS}
                  keyExtractor={(item) => item}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={onScrollMinuto}
                  initialScrollIndex={MINUTOS.indexOf(minuto) >= 0 ? MINUTOS.indexOf(minuto) : 0}
                  getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <View style={[styles.item]}>
                      <Text
                        style={[
                          styles.itemTexto,
                          { color: item === minuto ? colors.primary : colors.textSecondary },
                          item === minuto && styles.itemSelecionado,
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                />
              </View>
            </View>
          </View>

          {/* Botão confirmar */}
          <TouchableOpacity
            style={[styles.botaoConfirmar, { backgroundColor: colors.primary }]}
            onPress={confirmar}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoTexto}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  horaAtual: {
    fontSize: 48,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  seletores: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  coluna: {
    alignItems: "center",
    gap: 8,
  },
  colunaLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  colunaContainer: {
    width: 100,
    height: 150,
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  selecaoIndicador: {
    position: "absolute",
    left: 8,
    right: 8,
    top: "50%",
    marginTop: -ITEM_HEIGHT / 2,
    height: ITEM_HEIGHT,
    borderWidth: 2,
    borderRadius: 8,
    zIndex: 1,
    pointerEvents: "none",
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTexto: {
    fontSize: 22,
    fontFamily: "Poppins_500Medium",
  },
  itemSelecionado: {
    fontFamily: "Poppins_700Bold",
  },
  separador: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    marginTop: 24,
  },
  botaoConfirmar: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
