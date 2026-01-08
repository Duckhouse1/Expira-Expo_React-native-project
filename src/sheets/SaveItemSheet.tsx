import { Pressable, Text } from "react-native";
import { ScannedData, VaultItem, VaultItemCard } from "../components/VaultItemCard";
import { Dispatch, useContext, useEffect, useState } from "react";
import { ui } from "../components/UI";
import { View } from "react-native";
import { styles } from "../styles/styles";
import { TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { HideNavBarContext, NewVaultItemSheetContext, VaultItemsContext } from "../Contexts";
import CreateService, { CreateVaultItemRequest } from "../Services/CreateService";
import { VaultItemType } from "./NewVaultItemSheet";
import ExpiresServices from "../Services/ExpiresServices";


export interface iAIReponds {
    title?: string | null;
    description?: string | null;
    expiryDate?: string | null;
    amount?: number | null;
}

interface SaveItemSheetProps {
    photoUri?: string | null;
    value: VaultItemType
    aiResponds: iAIReponds
    setLoading: Dispatch<React.SetStateAction<boolean>>;
    loading: boolean;
    scannedData: string | null;
    dataType: string | null;
}

export const SaveItemSheet: React.FC<SaveItemSheetProps> = ({ photoUri, value, aiResponds, setLoading, loading, scannedData, dataType }) => {
    const [VaultItem, setVaultItem] = useState<VaultItemCard | null>(null);
    const [isfetched, setIsFetched] = useState(false);
    const { setShowNewVaultItem } = useContext(NewVaultItemSheetContext);
    const [dateOpen, setDateOpen] = useState(false);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const { setVaultItems } = useContext(VaultItemsContext);
    const { setHideBar: setShowBar } = useContext(HideNavBarContext)

    // console.log(scannedData + "Fra save item");
    useEffect(() => {
        // Placeholder for any side effects when the sheet is mounted
        if (!isfetched) {
            // Simulate fetching or initializing data
            const newItem: VaultItemCard = {
                title: aiResponds.title || "Sample Item",
                description: aiResponds.description || "This is a description of the sample item.",
                Type: value,
                ExpiryDate: aiResponds.expiryDate || new Date().toISOString(),
                MoneyAmount: aiResponds.amount || 400,
                ImageUri: photoUri || undefined,
                scannedData: null,
                dataType: null
            };
            setVaultItem(newItem);
            setIsFetched(true);
        }
    }, []);
    return (
        <>
            <KeyboardAwareScrollView
                enableOnAndroid
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={20}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* <Text>Item</Text> */}
                {/* {loading && (<Text style={{ alignSelf: "center", marginTop: 20 }}>Analyzing image...</Text>)} */}
                {!loading && (
                    <>
                        <VaultItemCard vaultItem={VaultItem} />

                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginVertical: 20, paddingHorizontal: 20, width: "100%" }}>
                            {/* Expiry */}
                            <View style={{ width: "48%" }}>
                                <Text style={[styles.title, { fontSize: 16 }]}>Expiry Date</Text>

                                <DateTimePicker
                                    value={expiryDate ?? new Date(VaultItem?.ExpiryDate ?? Date.now())}
                                    style={{ marginLeft: -15, marginTop: 8 }}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selected) => {
                                        // Android: user cancelled¨
                                        if (event.type === "dismissed") {
                                            setDateOpen(false);
                                            return;
                                        }

                                        if (!selected) return;

                                        setDateOpen(false);
                                        setExpiryDate(selected);

                                        setVaultItem(prev =>
                                            prev ? { ...prev, ExpiryDate: selected.toISOString() } : prev
                                        );
                                    }}
                                />

                            </View>

                            {/* Price */}
                            <View style={{ width: "48%" }}>
                                <Text style={[styles.title, { fontSize: 16 }]}>Price</Text>
                                <TextInput
                                    value={VaultItem ? VaultItem.MoneyAmount.toString() : ""}
                                    onChangeText={(text) =>
                                        setVaultItem(prev =>
                                            prev ? { ...prev, MoneyAmount: parseFloat(text) || 0 } : prev
                                        )
                                    }
                                    keyboardType="decimal-pad"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#ddd",
                                        borderRadius: 10,
                                        padding: 12,
                                        marginTop: 6,
                                        backgroundColor: "#fff",
                                    }}
                                />
                            </View>

                            {/* Title */}
                            <View style={{ width: "48%" }}>
                                <Text style={[styles.title, { fontSize: 16 }]}>Title</Text>
                                <TextInput
                                    value={VaultItem ? VaultItem.title : ""}
                                    onChangeText={(text) =>
                                        setVaultItem(prev =>
                                            prev ? { ...prev, title: text } : prev
                                        )
                                    }
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#ddd",
                                        borderRadius: 10,
                                        padding: 12,
                                        marginTop: 6,
                                        backgroundColor: "#fff",
                                    }}
                                />
                            </View>

                            {/* Description */}
                            <View style={{ width: "48%" }}>
                                <Text style={[styles.title, { fontSize: 16 }]}>Description</Text>
                                <TextInput
                                    value={VaultItem ? VaultItem.description : ""}
                                    // onChangeText={setDescription}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#ddd",
                                        borderRadius: 10,
                                        padding: 12,
                                        marginTop: 6,
                                        backgroundColor: "#fff",
                                    }}
                                />
                            </View>
                        </View>
                    </>
                )}

            </KeyboardAwareScrollView>

            <Pressable
                style={[ui.primaryButton, { width: "30%", alignSelf: "center" }]}
                onPress={async () => {
                    if (!photoUri) return;
                    setLoading(true)
                    try {
                        const vaultItem: CreateVaultItemRequest = {
                            title: VaultItem?.title || "Untitled",
                            type: VaultItem?.Type || "GiftCard",
                            expiryDate: VaultItem?.ExpiryDate,
                            amount: VaultItem?.MoneyAmount,
                            description: VaultItem?.description,
                            blobPath: "",
                            id: "",
                            scannedData: scannedData || null,
                            dataType: dataType || null
                        };

                        const newVaultItem: VaultItem = {
                            vaultItem: {
                                title: VaultItem?.title || "Untitled",
                                description: VaultItem?.description || "",
                                Type: VaultItem?.Type || "GiftCard",
                                ExpiryDate: VaultItem!.ExpiryDate,
                                MoneyAmount: VaultItem!.MoneyAmount,
                                ImageUri: photoUri,
                                scannedData: scannedData || null,
                                dataType: dataType || null,
                            }
                        }
                        await CreateService.CreateVaultItemFromImage(photoUri, vaultItem);
                        setVaultItems(prev => [...prev, newVaultItem]);
                    } catch (error) {
                        console.log("❌ Error creating vault item", error);
                    }
                    try {
                        console.log(VaultItem?.ExpiryDate);
                        await ExpiresServices.scheduleExpiryReminder(
                            new Date(VaultItem?.ExpiryDate ?? Date.now()), VaultItem?.title!
                        );
                    } catch (err) {
                        console.log("❌ Error scheduling notification", err);
                    }

                    console.log("✅ Notification scheduled");

                    setLoading(false);
                    setShowBar(true)
                    setShowNewVaultItem(false);
                }}
            >
                <Text style={{ color: "white" }}>Continue</Text>
            </Pressable>
        </>
    );
}