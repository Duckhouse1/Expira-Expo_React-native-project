import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated, StyleSheet, Pressable } from "react-native";
import { Accelerometer } from "expo-sensors";
import { VaultItemType } from "../sheets/NewVaultItemSheet";
import { ui } from "./UI";
import { ScannerType } from "../screens/QRandBarcodeScanner";

export interface VaultItemCard {
    title: string;
    description: string;
    ImageUri?: string;
    Type: VaultItemType;
    ExpiryDate: string;
    MoneyAmount: number;
    scannedData: string | null;
    dataType: string | null;
}

export interface ScannedData {
    codeType: ScannerType;
    data: string;
}

export interface VaultItem {
    vaultItem: VaultItemCard | null;
}

export const VaultItemCard: React.FC<VaultItem> = ({ vaultItem }) => {
    const tiltX = useRef(new Animated.Value(0)).current;
    const tiltY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Accelerometer.setUpdateInterval(50);

        const sub = Accelerometer.addListener(({ x, y }) => {
            // small values: subtle movement
            Animated.spring(tiltX, { toValue: y, useNativeDriver: true, speed: 12, bounciness: 6 }).start();
            Animated.spring(tiltY, { toValue: x, useNativeDriver: true, speed: 12, bounciness: 6 }).start();
        });

        return () => sub.remove();
    }, [tiltX, tiltY]);

    if (!vaultItem) return null;

    const rotateX = tiltX.interpolate({
        inputRange: [-1, 1],
        outputRange: ["6deg", "-6deg"],
    });

    const rotateY = tiltY.interpolate({
        inputRange: [-1, 1],
        outputRange: ["-6deg", "6deg"],
    });

    const translateX = tiltY.interpolate({
        inputRange: [-1, 1],
        outputRange: [-10, 10],
    });

    const translateY = tiltX.interpolate({
        inputRange: [-1, 1],
        outputRange: [-10, 10],
    });

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    transform: [
                        { perspective: 800 },
                        { rotateX },
                        { rotateY },
                        { translateX },
                        { translateY },
                    ],
                },
            ]}
        >
            <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                <Text style={styles.title} numberOfLines={1}>
                    {vaultItem.title}
                </Text>
                {/* <Pressable
                    style={({alignSelf: "center" })}
                    onPress={() => console.log("object")}
                >

                    <Text style={{ color: "black", borderRadius:8, borderWidth:1,borderColor:"black", padding:5, marginRight:10}}>Edit</Text>
                </Pressable> */}
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1 }}>

                    <Text style={styles.desc} numberOfLines={2}>
                        {vaultItem.description}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>{vaultItem.Type}</Text>
                        </View>
                    </View>
                    <Text style={styles.metaText}>Expires: {vaultItem.ExpiryDate}</Text>

                    <Text style={styles.amount}>{vaultItem.MoneyAmount.toFixed(2)}</Text>
                </View>

                {vaultItem.ImageUri ? (
                    <Image source={{ uri: vaultItem.ImageUri }} style={[styles.thumb, { width: 130, height: 130 }]} />
                ) : (
                    <View style={styles.thumbPlaceholder} />
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 16,
        // marginBottom: 16,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#EEE",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
        marginTop: 16,
    },
    row: { flexDirection: "row", gap: 12, alignItems: "center" },
    title: { fontSize: 18, fontWeight: "800" },
    desc: { marginTop: 6, fontSize: 13, opacity: 0.7, lineHeight: 18 },
    metaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#F3F3F5",
    },
    pillText: { fontSize: 12, fontWeight: "700", opacity: 0.85 },
    metaText: { fontSize: 12, opacity: 0.6 },
    amount: { marginTop: 10, fontSize: 16, fontWeight: "800", opacity: 0.9 },
    thumb: { width: 72, height: 92, borderRadius: 16, backgroundColor: "#F2F2F2" },
    thumbPlaceholder: {
        width: 72,
        height: 92,
        borderRadius: 16,
        backgroundColor: "#F3F3F5",
        borderWidth: 1,
        borderColor: "#EEE",
    },
});
