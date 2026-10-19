import { ColorSchemeName } from 'react-native';

/**
 * Force light mode only - ignore system preference
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  return 'light';
}
