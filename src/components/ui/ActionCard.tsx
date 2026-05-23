import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../../styles/colors";

interface ActionCardProps {
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  accentColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  trailingText?: string | undefined;
  selected?: boolean;
}

const ActionCard = ({
  title,
  description,
  iconName,
  accentColor = colors.primary,
  onPress,
  style,
  trailingText,
  selected = false,
}: ActionCardProps): React.JSX.Element => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const content = (
    <>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
          <Ionicons name={iconName} size={20} color={colors.textLight} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.trailingWrap}>
        {trailingText ? (
          <Text style={styles.trailingText}>{trailingText}</Text>
        ) : null}
        {onPress ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[
            styles.card,
            selected ? styles.cardSelected : null,
            style,
          ]}
          onPress={onPress}
          activeOpacity={0.96}
          onPressIn={() => animateTo(0.988)}
          onPressOut={() => animateTo(1)}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        selected ? styles.cardSelected : null,
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  trailingWrap: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },
  trailingText: {
    color: colors.primaryStrong,
    fontSize: 13,
    fontWeight: "800",
  },
});

export default ActionCard;
