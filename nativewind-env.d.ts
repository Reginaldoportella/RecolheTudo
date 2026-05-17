// Torna este arquivo um módulo para que `declare module` seja augmentation (não replacement)
export {};

// NativeWind v4 — augmenta react-native para aceitar a prop `className`
declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
  interface SectionListProps<ItemT, SectionT> {
    className?: string;
  }
  interface ModalBaseProps {
    className?: string;
  }
  interface SafeAreaViewProps {
    className?: string;
  }
  interface KeyboardAvoidingViewProps {
    className?: string;
  }
}
