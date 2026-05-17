import { StyleSheet } from "react-native";
import colors from "./colors";

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.6,
  },
  subheading: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  largeButton: {
    backgroundColor: colors.primary,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  largeButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  materialIcon: {
    width: 80,
    height: 80,
    margin: 10,
    borderRadius: 10,
  },
  materialIconText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 5,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
});

export default globalStyles;
