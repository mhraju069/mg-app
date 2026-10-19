import { ColorSchemeName } from 'react-native';

// Force light mode only - ignore system preference
export function useColorScheme(): NonNullable<ColorSchemeName> {
  return 'light';
}
