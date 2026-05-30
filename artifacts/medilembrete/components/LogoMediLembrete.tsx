// Logo oficial do MediLembrete — construída em código com gradiente
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

interface Props {
  size?: number;
}

export default function LogoMediLembrete({ size = 100 }: Props) {
  const s = size;
  const r = s / 2;

  return (
    <View style={{ width: s, height: s }}>
      {/* Sombra / glow */}
      <View
        style={[
          styles.glow,
          {
            width: s + 24,
            height: s + 24,
            borderRadius: (s + 24) / 2,
            top: -12,
            left: -12,
          },
        ]}
      />

      {/* Fundo gradiente circular */}
      <LinearGradient
        colors={["#52C98A", "#2D6A4F", "#1A4D38"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.circulo, { width: s, height: s, borderRadius: r }]}
      >
        {/* Reflexo interno (simulação de glass) */}
        <View
          style={[
            styles.reflexo,
            {
              width: s * 0.7,
              height: s * 0.45,
              borderRadius: s * 0.35,
              top: s * 0.06,
              left: s * 0.15,
            },
          ]}
        />

        {/* Ícone SVG central */}
        <Svg
          width={s * 0.54}
          height={s * 0.54}
          viewBox="0 0 64 64"
          style={styles.icone}
        >
          {/* Comprimido / pílula */}
          <Rect
            x="4"
            y="24"
            width="36"
            height="16"
            rx="8"
            fill="white"
            opacity={0.95}
          />
          {/* Cruz médica */}
          <Rect x="44" y="10" width="16" height="44" rx="3" fill="white" opacity={0.92} />
          <Rect x="36" y="18" width="32" height="16" rx="3" fill="white" opacity={0.92} />
          {/* Linha separadora da pílula */}
          <Rect x="22" y="24" width="2" height="16" rx="1" fill="#2D6A4F" opacity={0.4} />
          {/* Círculo decorativo */}
          <Circle cx="13" cy="32" r="4" fill="#2D6A4F" opacity={0.25} />
        </Svg>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    backgroundColor: "#52B788",
    opacity: 0.25,
  },
  circulo: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  reflexo: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  icone: {
    zIndex: 1,
  },
});
