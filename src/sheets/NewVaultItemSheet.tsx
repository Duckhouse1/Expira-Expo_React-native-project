import { Pressable, Animated, View, Dimensions, Text, Easing, Image } from "react-native";
import { useContext, useEffect, useRef, useState } from "react";
import { NewVaultItemSheetContext } from "../Contexts";
import { ui } from "../components/UI";
import { iAIReponds, SaveItemSheet } from "./SaveItemSheet";
import OpenAIServices from "../Services/OpenAIServices";
import LoadingIcon from "../components/LoadingIcon";
import { QRorBarcodeSheet } from "./QRorBarcodeSheet";
import { QRandBarcodeScanner } from "../screens/QRandBarcodeScanner";
import { QRandBarcodeScannerModal } from "../components/QRAndBarcodeModal";
import QRCode from "react-native-qrcode-svg";
import { set } from "zod";

export type VaultItemType = "receipt" | "GiftCard" | "email" | "subscription" | "other";


interface NewVaultItemSheetProps {
    photoUri: string | null;
}

export const NewVaultItemSheet: React.FC<NewVaultItemSheetProps> = ({ photoUri }) => {
    const { height } = Dimensions.get("window");
    const [AIResponse, setAIResponse] = useState<iAIReponds>({});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<VaultItemType | null>(null);
    const { showNewVaultItem, setShowNewVaultItem } = useContext(NewVaultItemSheetContext);
    const [showSaveItemSheet, setShowSaveItemSheet] = useState(false);
    const [showQRorBarCodeSheet, setShowQRorBarCodeSheet] = useState(false);
    const [showCameraForCodeScanner, setShowCameraForCodeScanner] = useState(false);
    const [codeType, setCodeType] = useState<"qr" | "barcode">("qr");
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [scannedFormat, setScannedFormat] = useState<string | null>(null); // NEW
    // const [barcodeW, setBarcodeW] = useState<number>(0);
    // const payload = scannedData ?? "";

    // const shouldUseQR =
    //     scannedFormat === "code128" &&
    //     /^\d{18,}$/.test(payload!); //¨


    const options: VaultItemType[] = [
        "receipt",
        "GiftCard",
        "email",
        "other",
    ];
    const sheetH = height * 0.6;
    const translateY = useRef(new Animated.Value(sheetH)).current;

    // const safeValue = (scannedData ?? "").trim();
    // const maxW = Math.max(1, Math.min(320, (barcodeW ?? 0) - 40));
    // const canRender = maxW > 10 && (scannedData?.length ?? 0) > 0;

    // useEffect(() => {
    //     console.log("barcode debug", { barcodeW, maxW, scannedLen: scannedData?.length });
    // }, [barcodeW, maxW, scannedData]);
    useEffect(() => {
        if (scannedData) {
            // Process scanned data here
            console.log("Scanned data received in NewVaultItemSheet:", scannedData);
            // You can set it to state or use it as needed
            // For example, you might want to set it in AIResponse or elsewhere
        }
    }, [scannedData]);
    // ✅ Only render sheet while open/animating
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (showNewVaultItem) setIsMounted(true);

        Animated.timing(translateY, {
            toValue: showNewVaultItem ? 0 : sheetH,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            // ✅ after closing animation, unmount so no “little window” shows
            if (finished && !showNewVaultItem) setIsMounted(false);
        });
    }, [showNewVaultItem, sheetH, translateY]);


    // ✅ Nothing rendered when fully closed
    if (!isMounted) return null;
    const handleBarcodeError = (err: unknown) => {
        // Narrowing
        if (err instanceof Error) {
            console.warn("Barcode error:", err.message);
            return;
        }
        console.warn("Barcode error:", err);
    };


    return (
        <>
            {showNewVaultItem && (
                <Pressable
                    style={ui.sheetBackdrop}
                    onPress={() => setShowNewVaultItem(false)}
                />
            )}
            <QRandBarcodeScannerModal
                visible={showCameraForCodeScanner}
                type={codeType === "qr" ? "qr" : "barcode"}
                onClose={() => setShowCameraForCodeScanner(false)}
                onScanned={async (data, scannedType) => {
                    setScannedData(String(data).trim());
                    setScannedFormat(scannedType); // e.g. "code128"
                    setCodeType(scannedType === "qr" ? "qr" : "barcode"); // ✅ map to your union
                    setShowCameraForCodeScanner(false);
                    setLoading(true);
                    await OpenAIServices.ExtractGiftCardMetadata(photoUri!).then((res) => {
                        setAIResponse((prev) => ({
                            ...prev,
                            title: res.title,
                            description: res.from,
                            expiryDate: res.expiresOn,   // ✅ null -> undefined
                            amount: res.amount.value,    // optional: if your type is number | undefined
                            currency: res.amount.currency,
                            
                        }));
                    });
                    setLoading(false);
                    setShowSaveItemSheet(true);
                }}
            />
            <Animated.View
                pointerEvents={showNewVaultItem ? "auto" : "none"}
                style={[ui.sheet, { height: sheetH, transform: [{ translateY }] }]}
            >
                {!showSaveItemSheet && !loading && !showQRorBarCodeSheet && !showCameraForCodeScanner && (
                    <>
                        <Text style={ui.brand}>New Vault Item</Text>

                        {/* Select + dropdown wrapper */}
                        <View style={{ position: "relative", marginTop: 12, width: "100%" }}>
                            <Pressable
                                onPress={() => setOpen((v) => !v)}
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#929292ff",
                                    borderRadius: 12,
                                    padding: 14,
                                    backgroundColor: "#FFF",
                                    justifyContent: "center",
                                    width: "100%",
                                }}
                            >
                                <Text>{value ?? "Select category"}</Text>
                            </Pressable>
                            {open && (
                                <View
                                    style={{
                                        position: "absolute",
                                        top: 54, // ~ pressable height (padding) + small gap
                                        left: 0,
                                        right: 0,

                                        borderWidth: 1,
                                        borderColor: "#EEE",
                                        borderRadius: 12,
                                        backgroundColor: "#FFF",
                                        overflow: "hidden",

                                        zIndex: 999,
                                        elevation: 999, // Android
                                    }}
                                >
                                    {options.map((opt) => (
                                        <Pressable
                                            key={opt}
                                            onPress={() => {
                                                setValue(opt);
                                                setOpen(false);
                                            }}
                                            style={{ padding: 14 }}
                                        >
                                            <Text>{opt}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* {payload ? (
                            <QRCode value={payload} size={200} />
                        ) : null} */}
                        <Image
                            source={{ uri: photoUri ?? undefined }}
                            style={{ width: 300, height: 300, borderRadius: 12, marginTop: 12, justifyContent: 'center', alignSelf: 'center' }}
                        />
                        {value !== null && (
                            <Pressable
                                style={([ui.primaryButton, { width: "30%", alignSelf: "flex-end" }])}
                                onPress={async () => {
                                    if (value === "GiftCard" || value === "receipt") {
                                        setShowQRorBarCodeSheet(true);
                                    } else {
                                        setLoading(true);
                                        await OpenAIServices.ExtractGiftCardMetadata(photoUri!).then((res) => {
                                            setAIResponse((prev) => ({
                                                ...prev,
                                                title: res.title,
                                                description: res.from,
                                                expiryDate: res.expiresOn,   // ✅ null -> undefined
                                                amount: res.amount.value,    // optional: if your type is number | undefined
                                                currency: res.amount.currency,

                                            }));
                                        });
                                        setLoading(false);
                                        setShowSaveItemSheet(true);
                                    }
                                }}
                            >
                                <Text style={{ color: "white" }}>Continue</Text>
                            </Pressable>
                        )}


                    </>
                )}
                {loading && !showSaveItemSheet && <Text style={{ alignSelf: "center", marginTop: 20, fontSize: 22 }}>Analyzing image...</Text>}
                {loading && (<LoadingIcon size={78} color="#000" />)}

                {loading && showSaveItemSheet && <Text style={{ alignSelf: "center", marginTop: 20, fontSize: 22 }}>Saving to vault</Text>}

                {showSaveItemSheet && (
                    <SaveItemSheet 
                    photoUri={photoUri} value={value!} aiResponds={AIResponse} 
                    setLoading={setLoading} loading={loading} dataType={codeType} scannedData={scannedData} />
                )}

                {showQRorBarCodeSheet && (
                    <QRorBarcodeSheet
                        noContinue={async () => {
                            setShowQRorBarCodeSheet(false)
                            setLoading(true);
                            await OpenAIServices.ExtractGiftCardMetadata(photoUri!).then((res) => {
                                setAIResponse((prev) => ({
                                    ...prev,
                                    title: res.title,
                                    description: res.from,
                                    expiryDate: res.expiresOn,   // ✅ null -> undefined
                                    amount: res.amount.value,    // optional: if your type is number | undefined
                                    currency: res.amount.currency,

                                }));
                            });
                            setLoading(false);
                            setShowSaveItemSheet(true);
                        }}
                        onAddPress={(type) => {
                            setShowQRorBarCodeSheet(false);
                            setCodeType(type.toLowerCase() as "qr" | "barcode");
                            setShowCameraForCodeScanner(true);
                            // setShowSaveItemSheet(true);
                            // setCodeType(type);
                            // Handle adding QR or Barcode
                        }} />
                )}

            </Animated.View>

        </>
    );
};
