/// <reference types="nativewind/types" />

// Explicit fallback augmentation: react-native-css-interop is nested (not hoisted)
// in this monorepo, so the transitive type reference above may not resolve under tsc.
// NativeWind injects `className` at runtime via the Babel preset regardless.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
  }
}
