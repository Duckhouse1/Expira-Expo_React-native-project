import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Purchases from "react-native-purchases";
import { styles } from "../styles/styles";
import { PrimaryButton } from "../components/PrimaryButton";

type Props = {
  onPurchased: () => void;
};

export function PaywallScreen({ onPurchased }: Props) {
  const [offering, setOffering] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const packages = useMemo(() => offering?.availablePackages ?? [], [offering]);

  useEffect(() => {
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current =
          offerings.current ?? offerings.all?.default ?? null;

        setOffering(current);
      } catch (e) {
        console.error(e);
        Alert.alert("Paywall error", "Could not load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function buy(pkg: any) {
    try {
      setPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      if (customerInfo.entitlements.active["pro"]) {
        onPurchased();
      }
    } catch (e: any) {
      if (String(e?.code).toLowerCase().includes("cancel")) return;
      console.error(e);
      Alert.alert("Purchase failed");
    } finally {
      setPurchasing(false);
    }
  }

  async function restore() {
    try {
      setPurchasing(true);
      const info = await Purchases.restorePurchases();

      if (info.entitlements.active["pro"]) {
        onPurchased();
      } else {
        Alert.alert("No active subscription found");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Restore failed");
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DeadlineVault</Text>
      <Text style={styles.subtitle}>19 kr / måned</Text>

      <View style={styles.card}>
        {loading ? (
          <Text>Loading...</Text>
        ) : packages.length === 0 ? (
          <Text>No products found</Text>
        ) : (
          packages.map((p: any) => (
            <PrimaryButton
              key={p.identifier}
              title={`Subscribe (${p.product.priceString})`}
              onPress={() => buy(p)}
              disabled={purchasing}
            />
          ))
        )}

        <Pressable onPress={restore} style={styles.linkButton}>
          <Text style={styles.linkText}>Restore purchase</Text>
        </Pressable>

        <Text style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>
          Auto-renewing subscription. Cancel anytime.
        </Text>
      </View>
    </View>
  );
}
