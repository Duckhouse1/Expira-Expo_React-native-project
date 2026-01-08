import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from "react-native";
import { VaultItem, VaultItemCard } from "./VaultItemCard";
import { VaultItemLayout } from "./MyVaultInfoModal";

interface MyVaultItemCardProps {
  vaultItem: VaultItem;
  onClick: (payload: { item: VaultItem; origin: VaultItemLayout }) => void;
}

export const MyVaultItemCard: React.FC<MyVaultItemCardProps> = ({ vaultItem, onClick }) => {
  const item = vaultItem.vaultItem;
  const containerRef = useRef<View>(null);
  const [currentDisplay, setCurrentDisplay] = useState("info")

  if (!item) return null;


  const handlePress = (vaultItem: VaultItemCard) => {
    console.log("PRESSED");
    containerRef.current?.measureInWindow((x, y, width, height) => {

      onClick({
        item: { vaultItem },
        origin: { x, y, width, height },
      });
    });
  };
  return (
    <Pressable
      onPress={() => handlePress(item)}>
      <View style={styles.card} ref={containerRef}>

        {/* Image */}
        {/* {item.ImageUri && (
        <Image
          source={{ uri: item.ImageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      )} */}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>

            {item.ExpiryDate && (
              <View style={styles.expiryBadge}>
                <Text style={styles.expiryText}>
                  Expires {formatDate(item.ExpiryDate)}
                </Text>

              </View>
            )}

          </View>

          <View style={styles.footerRow}>
            {item.MoneyAmount && (
              <Text style={styles.amount}>
                {item.MoneyAmount},-
              </Text>
            )}
            <Text style={{ color: "#e0dcdcff", fontSize: 16, fontWeight: "700" }}>
              {item.Type ?? "N/A"}
            </Text>
            {/* <Text style={{ color: "blue", fontSize: 16 }}>
              RAW: {JSON.stringify(item)}
            </Text> */}
            {/* <Text style={styles.status}>
            {vaultItem.vaultItem}
          </Text> */}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f1f1fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    // borderColor: "#2f2f2fff",
    // borderWidth: 1,
    // shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },

    // shadow (Android)
    elevation: 6,
  },
  image: {
    width: "100%",
    height: 140,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#dcdcdcff",
    flex: 1,
    marginRight: 8,
  },
  expiryBadge: {
    backgroundColor: "#c0c0c0ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  expiryText: {
    fontSize: 12,
    color: "#202020ff",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#777777ff",
  },
  status: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "capitalize",
  },
});
