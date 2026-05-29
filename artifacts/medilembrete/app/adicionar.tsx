// Ecrã para adicionar um novo medicamento
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useMedicamentos } from "@/context/MedicamentosContext";
import FormularioMedicamento, {
  FormData,
  getFormDataInicial,
} from "@/components/FormularioMedicamento";

export default function AdicionarScreen() {
  const { adicionarMedicamento } = useMedicamentos();
  const [dados, setDados] = useState<FormData>(getFormDataInicial());
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await adicionarMedicamento({
        nome: dados.nome.trim(),
        dosagem: dados.dosagem.trim(),
        categoria: dados.categoria,
        cor: dados.cor,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim || null,
        horarios: dados.horarios,
        diasSemana: dados.diasSemana,
        instrucoes: dados.instrucoes.trim(),
        estoque: dados.estoque ? parseInt(dados.estoque, 10) : null,
        ativo: true,
      });
      Alert.alert(
        "Medicamento guardado",
        `${dados.nome} foi adicionado com sucesso!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Erro", "Não foi possível guardar o medicamento. Tenta novamente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FormularioMedicamento
        dados={dados}
        onChange={setDados}
        onGuardar={handleGuardar}
        onCancelar={() => router.back()}
        guardando={guardando}
        modoEdicao={false}
      />
    </View>
  );
}
