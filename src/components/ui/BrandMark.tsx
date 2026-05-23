import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import colors from "../../styles/colors";

interface BrandMarkProps {
  size?: number;
  style?: ViewStyle;
  muted?: boolean;
}

const BrandMark = ({
  size = 180,
  style,
  muted = false,
}: BrandMarkProps): React.JSX.Element => {
  const ringColor = muted ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.14)";
  const innerLeafColor = muted ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.12)";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ringColor,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.innerRing,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            borderColor: ringColor,
          },
        ]}
      />
      <View
        style={[
          styles.leafTop,
          {
            width: size * 0.52,
            height: size * 0.28,
            borderTopLeftRadius: size * 0.28,
            borderTopRightRadius: size * 0.28,
            backgroundColor: innerLeafColor,
          },
        ]}
      />
      <View
        style={[
          styles.leafLeft,
          {
            width: size * 0.24,
            height: size * 0.34,
            borderTopLeftRadius: size * 0.18,
            borderBottomLeftRadius: size * 0.18,
            backgroundColor: innerLeafColor,
          },
        ]}
      />
      <View
        style={[
          styles.leafRight,
          {
            width: size * 0.24,
            height: size * 0.34,
            borderTopRightRadius: size * 0.18,
            borderBottomRightRadius: size * 0.18,
            backgroundColor: innerLeafColor,
          },
        ]}
      />
      <View
        style={[
          styles.bottomMark,
          {
            borderLeftWidth: size * 0.14,
            borderRightWidth: size * 0.14,
            borderTopWidth: size * 0.16,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: innerLeafColor,
          },
        ]}
      />
      <View
        style={[
          styles.centerDot,
          {
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: size * 0.06,
            backgroundColor: colors.primarySoft,
            opacity: muted ? 0.12 : 0.22,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 12,
  },
  innerRing: {
    position: "absolute",
    borderWidth: 10,
  },
  leafTop: {
    position: "absolute",
    top: 38,
  },
  leafLeft: {
    position: "absolute",
    left: 28,
    bottom: 34,
    transform: [{ rotate: "28deg" }],
  },
  leafRight: {
    position: "absolute",
    right: 28,
    bottom: 34,
    transform: [{ rotate: "-28deg" }],
  },
  bottomMark: {
    position: "absolute",
    bottom: 36,
  },
  centerDot: {
    position: "absolute",
  },
});

export default BrandMark;
