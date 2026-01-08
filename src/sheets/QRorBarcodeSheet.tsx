import React from "react";
import { Pressable, Text, View } from "react-native";

interface QRorBarcodeSheetProps {
    noContinue: () => void;
    onAddPress: (type: "QR" | "Barcode") => void;
}

export const QRorBarcodeSheet: React.FC<QRorBarcodeSheetProps> = ({ noContinue, onAddPress }) => {
    return (
        <View
            style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 28,
                backgroundColor: "#FFFFFF",
                flexDirection: "column",
            }}
        >
            {/* Title */}
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#111",
                    marginBottom: 24,
                }}
            >
                Do you want to…
            </Text>

            {/* Primary actions */}
            <View style={{ gap: 12 }}>
                <Pressable
                    style={({ pressed }) => ({
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: "#111",
                        opacity: pressed ? 0.9 : 1,
                        alignItems: "center",
                    })}
                    onPress={() => onAddPress("QR")}
                >
                    <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
                        Add QR-code
                    </Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => ({
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: "#F2F3F5",
                        opacity: pressed ? 0.9 : 1,
                        alignItems: "center",
                    })}
                    onPress={() => onAddPress("Barcode")}
                >
                    <Text style={{ color: "#111", fontSize: 16, fontWeight: "600" }}>
                        Add bar-code
                    </Text>
                </Pressable>
            </View>

            {/* Bottom left action */}
            <View style={{ marginTop: 68, alignItems: "flex-end" }}>
                <Pressable
                    style={{ borderRadius: 8, padding: 8, backgroundColor: "#000000ff" }}
                    onPress={noContinue}
                >
                    <Text style={{ fontSize: 14, color: "#ecececff" }}
                    >
                        No, continue
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};
