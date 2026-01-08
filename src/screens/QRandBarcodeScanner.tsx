import React, { useMemo, useState } from "react";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeType,
  type BarcodeScanningResult,
} from "expo-camera";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ScannerType = "qr" | "barcode";

type Props = {
  type: ScannerType;
  onClose: () => void;
  onScanned: (data: string, scannedType: string) => void;
};

// IMPORTANT: make this a normal mutable array (no "as const", no readonly)
const BARCODE_TYPES_1D: BarcodeType[] = [
  "code128", // super common for gift cards
  "ean13",   // common product stregkode
  "ean8",
  "upc_a",
  "upc_e",
  "code39",
  "code93",
  "itf14",
  "codabar",
];

export function QRandBarcodeScanner({ type, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // MUST return BarcodeType[] (mutable), not readonly
  const barcodeTypes: BarcodeType[] = useMemo(() => {
    return type === "qr" ? (["qr"] as BarcodeType[]) : BARCODE_TYPES_1D;
  }, [type]);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ marginTop: 12, opacity: 0.8 }}>
          <Text style={{ color: "#fff" }}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    
    if (scanned) return;
    setScanned(true);

    // result.type is now properly typed as BarcodeType
    console.log("Scanned type:", result.type);
    onScanned(result.data, result.type);
  };

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {scanned ? (
          <Pressable
            onPress={() => setScanned(false)}
            style={({ pressed }) => [styles.againBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.againText}>Scan again</Text>
          </Pressable>
        ) : (
          <Text style={styles.bottomNote}>Hold steady — it scans automatically</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

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
    paddingTop: 48,
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
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  bottomNote: { color: "rgba(255,255,255,0.75)", fontSize: 13 },

  againBtn: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  againText: { color: "#111", fontWeight: "700" },
});
