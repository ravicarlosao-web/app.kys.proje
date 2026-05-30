// Logo oficial do MediLembrete — imagem PNG com efeito premium
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface Props {
  size?: number;
}

export default function LogoMediLembrete({ size = 100 }: Props) {
  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Glow exterior */}
      <View
        style={[
          styles.glow,
          {
            width: size + 32,
            height: size + 32,
            borderRadius: (size + 32) * 0.28,
            top: -16,
            left: -16,
          },
        ]}
      />
      {/* Sombra intermédia */}
      <View
        style={[
          styles.sombra,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) * 0.26,
            top: -4,
            left: -4,
          },
        ]}
      />
      {/* Imagem da logo */}
      <Image
        source={require("../assets/logo.png")}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.24,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    backgroundColor: "#52B788",
    opacity: 0.22,
  },
  sombra: {
    position: "absolute",
    backgroundColor: "#1A4D38",
    opacity: 0.45,
  },
});
