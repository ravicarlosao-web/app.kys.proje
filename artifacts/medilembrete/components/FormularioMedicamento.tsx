// Formulário partilhado para adicionar/editar medicamento
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Medicamento, CategoriaMedicamento, DIAS_SEMANA } from "@/types";
import { CORES_MEDICAMENTO } from "@/constants/colors";
import TimePicker from "@/components/TimePicker";

// Categorias disponíveis
const CATEGORIAS: { id: CategoriaMedicamento; label: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { id: "comprimido", label: "Comprimido", icone: "medical" },
  { id: "xarope", label: "Xarope", icone: "water" },
  { id: "injecao", label: "Injeção", icone: "fitness" },
  { id: "pomada", label: "Pomada", icone: "bandage" },
  { id: "colurio", label: "Colírio", icone: "eye" },
  { id: "inalador", label: "Inalador", icone: "cloud" },
];

// Estado inicial do formulário
export interface FormData {
  nome: string;
  dosagem: string;
  categoria: CategoriaMedicamento;
  cor: string;
  dataInicio: string;
  dataFim: string | null;
  horarios: string[];
  diasSemana: number[];
  instrucoes: string;
  estoque: string;
}

export function getFormDataInicial(): FormData {
  const hoje = new Date().toISOString().split("T")[0];
  return {
    nome: "",
    dosagem: "",
    categoria: "comprimido",
    cor: "#2D6A4F",
    dataInicio: hoje,
    dataFim: null,
    horarios: [],
    diasSemana: [0, 1, 2, 3, 4, 5, 6],
    instrucoes: "",
    estoque: "",
  };
}

export function medicamentoToFormData(m: Medicamento): FormData {
  return {
    nome: m.nome,
    dosagem: m.dosagem,
    categoria: m.categoria,
    cor: m.cor,
    dataInicio: m.dataInicio,
    dataFim: m.dataFim,
    horarios: m.horarios,
    diasSemana: m.diasSemana,
    instrucoes: m.instrucoes,
    estoque: m.estoque !== null ? m.estoque.toString() : "",
  };
}

interface Props {
  dados: FormData;
  onChange: (dados: FormData) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onEliminar?: () => void;
  guardando: boolean;
  modoEdicao?: boolean;
}

export default function FormularioMedicamento({
  dados,
  onChange,
  onGuardar,
  onCancelar,
  onEliminar,
  guardando,
  modoEdicao = false,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [timePickerVisivel, setTimePickerVisivel] = useState(false);
  const [temDataFim, setTemDataFim] = useState(!!dados.dataFim);

  const set = (campo: keyof FormData, valor: FormData[typeof campo]) => {
    onChange({ ...dados, [campo]: valor });
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  };

  const toggleDiaSemana = (dia: number) => {
    Haptics.selectionAsync();
    const novos = dados.diasSemana.includes(dia)
      ? dados.diasSemana.filter((d) => d !== dia)
      : [...dados.diasSemana, dia].sort();
    set("diasSemana", novos);
  };

  const adicionarHorario = (horario: string) => {
    if (dados.horarios.includes(horario)) {
      Alert.alert("Horário duplicado", "Este horário já foi adicionado.");
      return;
    }
    if (dados.horarios.length >= 6) {
      Alert.alert("Máximo atingido", "Podes adicionar no máximo 6 horários.");
      return;
    }
    const novos = [...dados.horarios, horario].sort();
    set("horarios", novos);
    setTimePickerVisivel(false);
  };

  const removerHorario = (horario: string) => {
    set("horarios", dados.horarios.filter((h) => h !== horario));
  };

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {};
    if (!dados.nome.trim()) novosErros.nome = "O nome é obrigatório";
    if (!dados.dosagem.trim()) novosErros.dosagem = "A dosagem é obrigatória";
    if (dados.horarios.length === 0)
      novosErros.horarios = "Adiciona pelo menos um horário";
    if (dados.diasSemana.length === 0)
      novosErros.diasSemana = "Seleciona pelo menos um dia";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleGuardar = () => {
    if (validar()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onGuardar();
    }
  };

  const { width } = Dimensions.get("window");
  const numColunasCategorias = width < 360 ? 2 : 3;
  const larguraCategoria = (width - 40 - (numColunasCategorias - 1) * 10) / numColunasCategorias;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nome */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>
            Nome do medicamento *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: erros.nome ? colors.danger : colors.border,
                color: colors.text,
                backgroundColor: colors.card,
              },
            ]}
            placeholder="Ex: Paracetamol"
            placeholderTextColor={colors.mutedForeground}
            value={dados.nome}
            onChangeText={(v) => set("nome", v)}
            autoCapitalize="words"
          />
          {erros.nome && (
            <Text style={[styles.erro, { color: colors.danger }]}>{erros.nome}</Text>
          )}
        </View>

        {/* Dosagem */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Dosagem *</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: erros.dosagem ? colors.danger : colors.border,
                color: colors.text,
                backgroundColor: colors.card,
              },
            ]}
            placeholder="Ex: 500mg, 10ml, 1 comprimido"
            placeholderTextColor={colors.mutedForeground}
            value={dados.dosagem}
            onChangeText={(v) => set("dosagem", v)}
          />
          {erros.dosagem && (
            <Text style={[styles.erro, { color: colors.danger }]}>{erros.dosagem}</Text>
          )}
        </View>

        {/* Categoria */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Categoria *</Text>
          <View style={styles.grelha}>
            {CATEGORIAS.map((cat) => {
              const selecionada = dados.categoria === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoriaItem,
                    {
                      width: larguraCategoria,
                      backgroundColor: selecionada ? colors.primary + "15" : colors.card,
                      borderColor: selecionada ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    set("categoria", cat.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icone}
                    size={24}
                    color={selecionada ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.categoriaLabel,
                      { color: selecionada ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cor */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Cor identificadora</Text>
          <View style={styles.coresRow}>
            {CORES_MEDICAMENTO.map((cor) => (
              <TouchableOpacity
                key={cor}
                style={[
                  styles.corChip,
                  { backgroundColor: cor },
                  dados.cor === cor && styles.corSelecionada,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  set("cor", cor);
                }}
                activeOpacity={0.8}
              >
                {dados.cor === cor && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data de início */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Data de início *</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
            ]}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            value={dados.dataInicio}
            onChangeText={(v) => set("dataInicio", v)}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Data de fim */}
        <View style={styles.grupo}>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
              Tem data de fim?
            </Text>
            <TouchableOpacity
              style={[
                styles.toggle,
                { backgroundColor: temDataFim ? colors.primary : colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setTemDataFim(!temDataFim);
                set("dataFim", !temDataFim ? new Date().toISOString().split("T")[0] : null);
              }}
            >
              <View
                style={[
                  styles.toggleKnob,
                  temDataFim && styles.toggleKnobAtivo,
                ]}
              />
            </TouchableOpacity>
          </View>
          {temDataFim && (
            <TextInput
              style={[
                styles.input,
                {
                  marginTop: 8,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={dados.dataFim ?? ""}
              onChangeText={(v) => set("dataFim", v)}
              keyboardType="numbers-and-punctuation"
            />
          )}
        </View>

        {/* Horários */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Horários *</Text>
          <View style={styles.horariosWrap}>
            {dados.horarios.map((h) => (
              <View
                key={h}
                style={[styles.horarioChip, { backgroundColor: colors.primary + "15" }]}
              >
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={[styles.horarioTexto, { color: colors.primary }]}>{h}</Text>
                <TouchableOpacity onPress={() => removerHorario(h)}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            {dados.horarios.length < 6 && (
              <TouchableOpacity
                style={[styles.adicionarHorario, { borderColor: colors.primary }]}
                onPress={() => setTimePickerVisivel(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.adicionarHorarioTexto, { color: colors.primary }]}>
                  Adicionar horário
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {erros.horarios && (
            <Text style={[styles.erro, { color: colors.danger }]}>{erros.horarios}</Text>
          )}
        </View>

        {/* Dias da semana */}
        <View style={styles.grupo}>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
              Dias da semana *
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                set("diasSemana", dados.diasSemana.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]);
              }}
            >
              <Text style={[styles.todosOsDias, { color: colors.primary }]}>
                {dados.diasSemana.length === 7 ? "Nenhum" : "Todos"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.diasRow}>
            {DIAS_SEMANA.map((dia, i) => {
              const selecionado = dados.diasSemana.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.diaChip,
                    {
                      backgroundColor: selecionado ? colors.primary : colors.card,
                      borderColor: selecionado ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleDiaSemana(i)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.diaTexto,
                      { color: selecionado ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {dia}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {erros.diasSemana && (
            <Text style={[styles.erro, { color: colors.danger }]}>{erros.diasSemana}</Text>
          )}
        </View>

        {/* Instruções */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Instruções / Observações</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultilinha,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
            ]}
            placeholder="Ex: Tomar com água, após as refeições"
            placeholderTextColor={colors.mutedForeground}
            value={dados.instrucoes}
            onChangeText={(v) => set("instrucoes", v)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Estoque */}
        <View style={styles.grupo}>
          <Text style={[styles.label, { color: colors.text }]}>Quantidade em stock</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
            ]}
            placeholder="Ex: 30"
            placeholderTextColor={colors.mutedForeground}
            value={dados.estoque}
            onChangeText={(v) => set("estoque", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>

        {/* Botão eliminar (modo edição) */}
        {modoEdicao && onEliminar && (
          <TouchableOpacity
            style={[styles.botaoEliminar, { borderColor: colors.danger }]}
            onPress={onEliminar}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.botaoEliminarTexto, { color: colors.danger }]}>
              Eliminar Medicamento
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Botões de ação fixos */}
      <View
        style={[
          styles.rodape,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.botaoCancelar, { borderColor: colors.border }]}
          onPress={onCancelar}
          activeOpacity={0.7}
        >
          <Text style={[styles.botaoCancelarTexto, { color: colors.text }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.botaoGuardar,
            { backgroundColor: guardando ? colors.secondary : colors.primary },
          ]}
          onPress={handleGuardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          <Ionicons name={guardando ? "hourglass-outline" : "checkmark"} size={18} color="#fff" />
          <Text style={styles.botaoGuardarTexto}>
            {guardando ? "A guardar..." : "Guardar medicamento"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <TimePicker
        visivel={timePickerVisivel}
        onFechar={() => setTimePickerVisivel(false)}
        onConfirmar={adicionarHorario}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 4,
  },
  grupo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  inputMultilinha: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  erro: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
  grelha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoriaItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  categoriaLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  coresRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  corChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  corSelecionada: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleKnobAtivo: {
    alignSelf: "flex-end",
  },
  horariosWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  horarioChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  horarioTexto: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  adicionarHorario: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    gap: 4,
  },
  adicionarHorarioTexto: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  diasRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  diaChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 42,
    alignItems: "center",
  },
  diaTexto: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  todosOsDias: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  botaoEliminar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 8,
  },
  botaoEliminarTexto: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  rodape: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  botaoCancelar: {
    flex: 0.4,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  botaoCancelarTexto: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  botaoGuardar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  botaoGuardarTexto: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
