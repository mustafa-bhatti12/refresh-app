import { useColorScheme } from "react-native";
import { lightColors, darkColors } from "./colors";

export function useColors() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}
