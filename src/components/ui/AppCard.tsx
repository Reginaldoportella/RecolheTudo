import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import colors from "../../styles/colors";

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
}

const AppCard = ({
  children,
  style,
  muted = false,
}: AppCardProps): React.JSX.Element => {
  return (
    <View
      style={[
        styles.card,
        muted ? styles.cardMuted : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMuted: {
    backgroundColor: colors.surfaceMuted,
  },
});

export default AppCard;
