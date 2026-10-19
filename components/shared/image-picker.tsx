import * as ImagePicker from "expo-image-picker";
import * as ExpoImageManipulator from "expo-image-manipulator";

type Size = {
    width: number;
    height: number;
};

export async function imagePicker(
    cb: (uri: string | null) => void,
    size?: Size,
    multi?: boolean
) {
    const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
        alert("Permission to access camera roll is required!");
        cb(null);
        return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: multi ? true : false,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });

    if (!result.canceled) {
        const context = ExpoImageManipulator.ImageManipulator.manipulate(
            result.assets[0].uri,
        );

        context.resize({
            width: size?.width || 200,
            height: size?.height || 200,
        });

        const renderedImage = await context.renderAsync();

        const res = await renderedImage.saveAsync({
            format: ExpoImageManipulator.SaveFormat.PNG,
        });

        cb(res.uri);
    } else {
        cb(null);
    }
}
