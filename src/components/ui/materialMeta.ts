import type React from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { Material } from "../../domain/types/collection";
import colors from "../../styles/colors";

export const MATERIAL_ICON: Record<
  Material,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  papel: "document-text-outline",
  plastico: "water-outline",
  metal: "hardware-chip-outline",
  vidro: "wine-outline",
  outros: "layers-outline",
};

export const MATERIAL_COLOR: Record<Material, string> = {
  papel: colors.paper,
  plastico: colors.plastic,
  metal: colors.metal,
  vidro: colors.glass,
  outros: colors.other,
};

export const MATERIAL_LABEL: Record<Material, string> = {
  papel: "Papel",
  plastico: "Plastico",
  metal: "Metal",
  vidro: "Vidro",
  outros: "Outros",
};
