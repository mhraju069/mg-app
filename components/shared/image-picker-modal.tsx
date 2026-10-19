// import * as ExpoImageManipulator from 'expo-image-manipulator';
// import * as ImagePicker from 'expo-image-picker';
// import { Camera, Image as ImageIcon, Trash2, X } from 'lucide-react-native';
// import React from 'react';
// import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// type Props = {
//   visible: boolean;
//   onClose: () => void;
//   onImageSelected: (uri: string) => void;
//   onRemoveImage?: () => void;
//   hasImage?: boolean;
// };

// export function ImagePickerModal({ visible, onClose, onImageSelected, onRemoveImage, hasImage }: Props) {
//   const processImage = async (uri: string) => {
//     try {
//       // Manipulate image to optimize size
//       const context = ExpoImageManipulator.ImageManipulator.manipulate(uri);

//       context.resize({
//         width: 400,
//         height: 400,
//       });

//       const renderedImage = await context.renderAsync();

//       const res = await renderedImage.saveAsync({
//         format: ExpoImageManipulator.SaveFormat.JPEG,
//         compress: 0.8,
//       });

//       onImageSelected(res.uri);
//       onClose();
//     } catch (error) {
//       console.error('Image processing error:', error);
//       Alert.alert('Error', 'Failed to process image. Please try again.');
//     }
//   };

//   const handleCamera = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

//       if (!permissionResult.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Camera permission is required to take photos.',
//           [{ text: 'OK' }]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         await processImage(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error('Camera error:', error);
//       Alert.alert('Error', 'Failed to take photo. Please try again.');
//     }
//   };

//   const handleGallery = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (!permissionResult.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Gallery permission is required to select photos.',
//           [{ text: 'OK' }]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ['images'],
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         await processImage(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error('Gallery error:', error);
//       Alert.alert('Error', 'Failed to select image. Please try again.');
//     }
//   };

//   const handleRemove = () => {
//     Alert.alert(
//       'Remove Profile Picture',
//       'Are you sure you want to remove your profile picture?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Remove',
//           style: 'destructive',
//           onPress: () => {
//             onRemoveImage?.();
//             onClose();
//           }
//         }
//       ]
//     );
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.overlay}>
//         <View style={styles.modal}>
//           <View style={styles.header}>
//             <Text style={styles.title}>Change Profile Picture</Text>
//             <Pressable onPress={onClose} style={styles.closeButton}>
//               <X color={colors.dark.textSecondary} size={24} />
//             </Pressable>
//           </View>

//           <View style={styles.options}>
//             <Pressable style={styles.option} onPress={handleCamera}>
//               <View style={styles.optionIcon}>
//                 <Camera color={colors.dark.primary} size={24} />
//               </View>
//               <Text style={styles.optionText}>Take Photo</Text>
//             </Pressable>

//             <Pressable style={styles.option} onPress={handleGallery}>
//               <View style={styles.optionIcon}>
//                 <ImageIcon color={colors.dark.primary} size={24} />
//               </View>
//               <Text style={styles.optionText}>Choose from Gallery</Text>
//             </Pressable>

//             {hasImage && onRemoveImage && (
//               <Pressable style={[styles.option, styles.removeOption]} onPress={handleRemove}>
//                 <View style={[styles.optionIcon, styles.removeIcon]}>
//                   <Trash2 color={colors.dark.danger} size={24} />
//                 </View>
//                 <Text style={[styles.optionText, styles.removeText]}>Remove Photo</Text>
//               </Pressable>
//             )}
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modal: {
//     backgroundColor: colors.dark.cardBackground,
//     borderRadius: 16,
//     padding: 20,
//     width: '100%',
//     maxWidth: 300,
//     borderWidth: 1,
//     borderColor: colors.dark.border,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.dark.text,
//   },
//   closeButton: {
//     padding: 4,
//   },
//   options: {
//     gap: 12,
//   },
//   option: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: colors.dark.background,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: colors.dark.border,
//   },
//   removeOption: {
//     borderColor: colors.dark.danger + '30',
//   },
//   optionIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: colors.dark.cardBackground,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   removeIcon: {
//     backgroundColor: colors.dark.danger + '20',
//   },
//   optionText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.dark.text,
//   },
//   removeText: {
//     color: colors.dark.danger,
//   },
// });
