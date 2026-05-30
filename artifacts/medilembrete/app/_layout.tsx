import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MedicamentosProvider } from "@/context/MedicamentosContext";
import SplashAnimado from "@/components/SplashAnimado";

// Impede o splash nativo de desaparecer sozinho
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Voltar",
        headerTintColor: "#2D6A4F",
        headerStyle: { backgroundColor: "#F8FAF9" },
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 18,
          color: "#1B1F1E",
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="adicionar"
        options={{ title: "Novo Medicamento" }}
      />
      <Stack.Screen
        name="editar/[id]"
        options={{ title: "Editar Medicamento" }}
      />
      <Stack.Screen
        name="detalhes/[id]"
        options={{ title: "Detalhes" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Controla se o splash animado ainda está visível
  const [splashVisivel, setSplashVisivel] = useState(true);
  // Controla se as fontes já estão prontas para o splash as usar
  const [fontsProntas, setFontsProntas] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Esconde o splash nativo do Expo imediatamente
      SplashScreen.hideAsync();
      setFontsProntas(true);
    }
  }, [fontsLoaded, fontError]);

  // Enquanto as fontes não carregam, não mostra nada
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MedicamentosProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                {/* App principal (renderizada por baixo do splash) */}
                <RootLayoutNav />

                {/* Splash animado sobreposto — desaparece após a animação */}
                {splashVisivel && fontsProntas && (
                  <SplashAnimado onFim={() => setSplashVisivel(false)} />
                )}
              </KeyboardProvider>
            </GestureHandlerRootView>
          </MedicamentosProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
