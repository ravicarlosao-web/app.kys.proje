// Splash screen animado com logo MediLembrete
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import LogoMediLembrete from "./LogoMediLembrete";

interface Props {
  onFim: () => void;
}

export default function SplashAnimado({ onFim }: Props) {
  // Animações de entrada
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const nomeOpacity = useSharedValue(0);
  const nomeY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(12);
  const pontinhos = useSharedValue(0);

  // Animação de saída
  const saidaOpacity = useSharedValue(1);
  const saidaScale = useSharedValue(1);

  useEffect(() => {
    // 1. Logo entra com spring (0 → 1)
    logoScale.value = withSpring(1, { damping: 14, stiffness: 130 });
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });

    // 2. Nome desliza para cima
    nomeOpacity.value = withDelay(350, withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));
    nomeY.value = withDelay(350, withSpring(0, { damping: 16, stiffness: 120 }));

    // 3. Tagline aparece
    taglineOpacity.value = withDelay(550, withTiming(1, { duration: 400 }));
    taglineY.value = withDelay(550, withSpring(0, { damping: 16, stiffness: 100 }));

    // 4. Pontinho de loading pulsa
    pontinhos.value = withDelay(800, withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0.4, { duration: 400 }),
      withTiming(1, { duration: 400 }),
      withTiming(0.4, { duration: 400 }),
      withTiming(1, { duration: 400 }),
    ));

    // 5. Depois de 2.6s → animação de saída
    const timer = setTimeout(() => {
      saidaOpacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onFim)();
      });
      saidaScale.value = withTiming(1.08, { duration: 500, easing: Easing.in(Easing.quad) });
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const estiloConteiner = useAnimatedStyle(() => ({
    opacity: saidaOpacity.value,
    transform: [{ scale: saidaScale.value }],
  }));

  const estiloLogo = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const estiloNome = useAnimatedStyle(() => ({
    opacity: nomeOpacity.value,
    transform: [{ translateY: nomeY.value }],
  }));

  const estiloTagline = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const estiloPontinhos = useAnimatedStyle(() => ({
    opacity: pontinhos.value,
  }));

  return (
    <Animated.View style={[styles.container, estiloConteiner]}>
      {/* Fundo gradiente profundo */}
      <LinearGradient
        colors={["#061B11", "#0D2E1F", "#1A4D38", "#2D6A4F"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blobs decorativos de luz */}
      <View style={[styles.blob, styles.blobTopo]} />
      <View style={[styles.blob, styles.blobBase]} />

      {/* Conteúdo central */}
      <View style={styles.centro}>
        {/* Logo animada */}
        <Animated.View style={estiloLogo}>
          <LogoMediLembrete size={120} />
        </Animated.View>

        {/* Nome da app */}
        <Animated.View style={[styles.nomeWrap, estiloNome]}>
          <Text style={styles.nomeParte1}>Medi</Text>
          <Text style={styles.nomeParte2}>Lembrete</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, estiloTagline]}>
          O teu lembrete de saúde
        </Animated.Text>
      </View>

      {/* Pontinho de carregamento */}
      <Animated.View style={[styles.loadingWrap, estiloPontinhos]}>
        <View style={styles.pontinho} />
        <View style={[styles.pontinho, { opacity: 0.65 }]} />
        <View style={[styles.pontinho, { opacity: 0.35 }]} />
      </Animated.View>

      {/* Versão */}
      <Text style={styles.versao}>v1.0</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.12,
  },
  blobTopo: {
    width: 340,
    height: 340,
    backgroundColor: "#52B788",
    top: -100,
    right: -100,
  },
  blobBase: {
    width: 260,
    height: 260,
    backgroundColor: "#95D5B2",
    bottom: -60,
    left: -80,
  },
  centro: {
    alignItems: "center",
    gap: 20,
  },
  nomeWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  nomeParte1: {
    fontSize: 38,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.5,
  },
  nomeParte2: {
    fontSize: 38,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.5,
    marginTop: -8,
  },
  loadingWrap: {
    position: "absolute",
    bottom: 90,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  pontinho: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#52B788",
  },
  versao: {
    position: "absolute",
    bottom: 50,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.2)",
    letterSpacing: 1,
  },
});
