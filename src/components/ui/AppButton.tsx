import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../../styles/colors";

type Variant = "primary" | "secondary";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AppButton = ({
  label,
  onPress,
  variant = "primary",
  iconName,
  disabled = false,
  style,
  textStyle,
}: AppButtonProps): React.JSX.Element => {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {iconName ? (
        <View style={styles.iconWrap}>
          <Ionicons
            name={iconName}
            size={18}
            color={isPrimary ? colors.textLight : colors.text}
          />
        </View>
      ) : null}
      <Text
        style={[
          styles.text,
          isPrimary ? styles.textPrimary : styles.textSecondary,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  iconWrap: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: "800",
  },
  textPrimary: {
    color: colors.textLight,
  },
  textSecondary: {
    color: colors.text,
  },
});

export default AppButton;
