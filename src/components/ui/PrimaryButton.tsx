import React from "react";
import {
  Animated,
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

type PrimaryButtonVariant = "primary" | "secondary";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  variant?: PrimaryButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const PrimaryButton = ({
  label,
  onPress,
  iconName,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}: PrimaryButtonProps): React.JSX.Element => {
  const isPrimary = variant === "primary";
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
          disabled ? styles.buttonDisabled : null,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.96}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
      >
        {iconName ? (
          <View style={styles.iconWrap}>
            <Ionicons
              name={iconName}
              size={18}
              color={isPrimary ? colors.textLight : colors.primaryStrong}
            />
          </View>
        ) : null}
        <Text
          style={[
            styles.label,
            isPrimary ? styles.labelPrimary : styles.labelSecondary,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    marginRight: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
  },
  labelPrimary: {
    color: colors.textLight,
  },
  labelSecondary: {
    color: colors.primaryStrong,
  },
});

export default PrimaryButton;
