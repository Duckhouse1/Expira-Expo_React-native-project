import React from "react";
import { Modal, Platform } from "react-native";
import { QRandBarcodeScanner, type ScannerType } from "../screens/QRandBarcodeScanner";
import type { BarcodeType } from "expo-camera";

type Props = {
    visible: boolean;
    type: ScannerType; // "qr" | "barcode"
    onClose: () => void;
    onScanned: (data: string, scannedType: string) => void;
};

export function QRandBarcodeScannerModal({
    visible,
    type,
    onClose,
    onScanned,
}: Props) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            onDismiss={onClose}   // iOS helpful
        >

            <QRandBarcodeScanner type={type} onClose={onClose} onScanned={onScanned} />
        </Modal>
    );
}
