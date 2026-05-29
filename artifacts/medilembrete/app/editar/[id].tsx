// Ecrã para editar um medicamento existente
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useMedicamentos } from "@/context/MedicamentosContext";
import ConfirmModal from "@/components/ConfirmModal";
import FormularioMedicamento, {
  FormData,
  medicamentoToFormData,
} from "@/components/FormularioMedicamento";

export default function EditarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medicamentos, editarMedicamento, eliminarMedicamento } = useMedicamentos();
  const [dados, setDados] = useState<FormData | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const medicamento = medicamentos.find((m) => m.id === id);

  useEffect(() => {
    if (medicamento) {
      setDados(medicamentoToFormData(medicamento));
    }
  }, [medicamento]);

  if (!dados || !medicamento) return null;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await editarMedicamento(id, {
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
        ativo: medicamento.ativo,
      });
      Alert.alert("Guardado", "Medicamento atualizado com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível guardar as alterações.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    setModalEliminar(false);
    try {
      await eliminarMedicamento(id);
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível eliminar o medicamento.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FormularioMedicamento
        dados={dados}
        onChange={setDados}
        onGuardar={handleGuardar}
        onCancelar={() => router.back()}
        onEliminar={() => setModalEliminar(true)}
        guardando={guardando}
        modoEdicao
      />
      <ConfirmModal
        visivel={modalEliminar}
        titulo="Eliminar medicamento"
        mensagem={`Tens a certeza que queres eliminar "${medicamento.nome}"? Esta ação não pode ser revertida.`}
        textoBotaoConfirmar="Eliminar"
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(false)}
        tipo="perigo"
      />
    </View>
  );
}
