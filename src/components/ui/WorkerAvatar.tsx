import React from "react";
import { StyleSheet, View, Text } from "react-native";

import colors from "../../styles/colors";

interface WorkerAvatarProps {
  size?: number;
}

const WorkerAvatar = ({ size = 120 }: WorkerAvatarProps): React.JSX.Element => {
  const skin = "#F2B287";
  const dark = "#1A3327";
  const shirt = "#2F6F4F";
  const cap = "#2B8A4A";

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />

      <View
        style={[
          styles.body,
          {
            width: size * 0.62,
            height: size * 0.34,
            borderTopLeftRadius: size * 0.22,
            borderTopRightRadius: size * 0.22,
          },
        ]}
      />

      <View
        style={[
          styles.head,
          {
            width: size * 0.48,
            height: size * 0.52,
            borderRadius: size * 0.24,
            backgroundColor: skin,
          },
        ]}
      >
        <View style={styles.eyesRow}>
          <View style={[styles.eye, { backgroundColor: dark }]} />
          <View style={[styles.eye, { backgroundColor: dark }]} />
        </View>
        <View style={styles.mouthWrap}>
          <View style={styles.mouth} />
        </View>
      </View>

      <View
        style={[
          styles.capTop,
          {
            width: size * 0.52,
            height: size * 0.22,
            borderTopLeftRadius: size * 0.2,
            borderTopRightRadius: size * 0.2,
            backgroundColor: cap,
          },
        ]}
      />
      <View
        style={[
          styles.capBrim,
          {
            width: size * 0.46,
            height: size * 0.1,
            borderRadius: size * 0.05,
            backgroundColor: "#226A39",
          },
        ]}
      />
      <View
        style={[
          styles.capBadge,
          {
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size * 0.08,
          },
        ]}
      >
        <Text style={styles.capBadgeText}>♻</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  halo: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  body: {
    position: "absolute",
    bottom: 8,
    backgroundColor: colors.primary,
  },
  head: {
    position: "absolute",
    bottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  eyesRow: {
    width: "42%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mouthWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  mouth: {
    width: 22,
    height: 10,
    borderBottomWidth: 3,
    borderBottomColor: "#D96C3F",
    borderRadius: 12,
  },
  capTop: {
    position: "absolute",
    top: 20,
  },
  capBrim: {
    position: "absolute",
    top: 40,
  },
  capBadge: {
    position: "absolute",
    top: 26,
    backgroundColor: colors.textLight,
    alignItems: "center",
    justifyContent: "center",
  },
  capBadgeText: {
    fontSize: 12,
  },
});

export default WorkerAvatar;
