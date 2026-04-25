declare module "@react-native/assets-registry/registry" {
  const registry: unknown;
  export default registry;
}

declare module "./vendor/react-native-vector-icons/lib/create-icon-set" {
  export type GlyphMap = Record<string, number | string>;

  export interface IconSet {
    getImageSource: (
      name: string,
      size?: number,
      color?: string,
    ) => Promise<unknown>;
    getImageSourceSync: (
      name: string,
      size?: number,
      color?: string,
    ) => unknown;
  }

  export default function createIconSet(
    glyphMap: GlyphMap,
    fontFamily: string,
    fontFile?: string,
  ): IconSet;
}
