import { Image } from "expo-image";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { imagePicker } from "./image-picker";
import { useColor } from "@/hooks/useColor";

type Props = {
  defaultValue?: string;
  onChange?: (uri: string) => void;
  editable?: boolean;
};

export function Avatar({ defaultValue, onChange, editable = false }: Props) {
  const primary = useColor("primary");
  const background = useColor("card");
  const [imgUri, setImgUri] = useState<string | null>(defaultValue || "https://i.pravatar.cc/150?u=akash");

  return (
    <Pressable
      disabled={!editable}
      onPress={() =>
        imagePicker((uri) => {
          if (!uri) return;
          setImgUri(uri);
          if (onChange) {
            onChange(uri);
          }
        })
      }
      style={styles.container}
    >
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          style={styles.image}
        />
      ) : (
        <View
          style={[styles.placeholder, { backgroundColor: background }]}
        />
      )}

      {editable && (
        <View style={styles.cameraBadge}>
          <Camera color="black" size={20} strokeWidth={2.5} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  placeholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
