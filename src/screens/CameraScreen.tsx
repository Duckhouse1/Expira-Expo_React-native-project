import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRef, useState } from "react";

export function CameraScreen({
  onClose,
  onPhotoTaken,
}: {
  onClose: () => void;
  onPhotoTaken: (uri: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={ui.permission}>
        <Text style={ui.permissionText}>Camera permission required</Text>
        <Pressable style={ui.permissionButton} onPress={requestPermission}>
          <Text style={ui.permissionButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  async function handleTakePhoto() {
    if (!cameraReady || !cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
      skipProcessing: false,
    });

    if (!photo?.uri) return;

    onPhotoTaken(photo.uri);
    // onClose();
  }

  return (
    <View style={ui.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Top bar */}
      <View style={ui.topBar}>
        <Pressable onPress={onClose} style={ui.closeButton}>
          <Text style={ui.closeText}>✕</Text>
        </Pressable>
      </View>

      {/* Shutter */}
      <View style={ui.bottomBar}>
        <Pressable
          onPress={handleTakePhoto}
          style={({ pressed }) => [
            ui.shutter,
            pressed && ui.shutterPressed,
          ]}
          accessibilityRole="button"
        >
          <View style={ui.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

const ui = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
  },

  permission: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  permissionText: { color: "#fff", opacity: 0.8 },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  permissionButtonText: { fontWeight: "700" },

  topBar: {
    position: "absolute",
    top: 0,
    width: "100%",
    paddingTop: 48, // manual safe-area
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingBottom: 36, // manual safe-area
    alignItems: "center",
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterPressed: { opacity: 0.7 },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
});
