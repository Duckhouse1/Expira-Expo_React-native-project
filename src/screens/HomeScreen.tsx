import { Pressable, Text, View, Image } from "react-native";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, } from "react-native";
import { Dimensions } from "react-native";
import { ui } from "../components/UI";

const { height } = Dimensions.get("window");

import type { User } from "../types/user";
import { CameraScreen } from "./CameraScreen";
import { HideNavBarContext, NewVaultItemSheetContext, ShowCameraContext, TabContext, VaultItemsContext } from "../Contexts";
import { NewVaultItemSheet } from "../sheets/NewVaultItemSheet";
import { VaultItem } from "../components/VaultItemCard";
import LoadingIcon from "../components/LoadingIcon";

// type Tab = "scan" | "home" | "vault";

export function HomeScreen({ user, onLogout }: { user: User; onLogout: () => void; showCamera: boolean; }) {
  const { showCamera, setShowCamera } = useContext(ShowCameraContext);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showNewVaultItem, setShowNewVaultItem] = useState(false);
  const [nextToExpire, setNextToExpire] = useState<VaultItem | null>(null);
  const { height } = Dimensions.get("window");
  const sheetH = height * 0.6;
  const translateY = useRef(new Animated.Value(sheetH)).current;
  // const { currentTab, setCurrentTab } = useContext(TabContext);
  const { VaultItems, setVaultItems } = useContext(VaultItemsContext);
  const { hideBar, setHideBar } = useContext(HideNavBarContext)

  useEffect(() => {
    var expiresNext = VaultItems.sort((a, b) => {
      const dateA = new Date(a.vaultItem?.ExpiryDate || "").getTime();
      const dateB = new Date(b.vaultItem?.ExpiryDate || "").getTime();
      return dateA - dateB;
    });
    setNextToExpire(expiresNext[0] || null);
  }, [VaultItems]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: showNewVaultItem ? 0 : sheetH,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showNewVaultItem, sheetH, translateY]);

  const initials = useMemo(() => {
    const name = user?.email?.split("@")[0] ?? "U";
    return name.slice(0, 2).toUpperCase();
  }, [user?.email]);


  if (showCamera) {
    return (
      <CameraScreen
        onClose={() => {
          setShowCamera(false)
        }}
        onPhotoTaken={(uri) => {
          setPhotoUri(uri);
          setHideBar(true);

          // let the camera finish releasing
          setTimeout(() => {
            setShowCamera(false);
            setShowNewVaultItem(true);
          }, 80);
        }}

      />
    );
  }

  return (
    <View style={ui.screen}>
      <NewVaultItemSheetContext.Provider value={{ showNewVaultItem, setShowNewVaultItem }}>

        {/* Header */}
        <View style={ui.header}>
          <View>
            <Text style={ui.brand}>Expira</Text>
            <Text style={ui.subBrand}>Keep track of what expires</Text>
          </View>

          <View style={ui.headerRight}>
            <Pressable
              onPress={onLogout}
              style={({ pressed }) => [ui.iconButton, pressed && ui.pressed]}
              accessibilityRole="button"
            >
              <Text style={ui.iconButtonText}>⎋</Text>
            </Pressable>

            <View style={ui.avatar}>
              <Text style={ui.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* Hero card */}
        <View style={ui.heroCard}>
          <Text style={ui.heroTitle}>Scan an object</Text>
          <Text style={ui.heroBody}>
            Take a photo to capture details and store it in your vault.
          </Text>

          <Pressable
            onPress={() => setShowCamera(true)}
            style={({ pressed }) => [ui.primaryButton, pressed && ui.primaryPressed]}
            accessibilityRole="button"
          >
            <Text style={ui.primaryButtonText}>Open camera</Text>
          </Pressable>
        </View>

        {/* Preview */}
        <View style={ui.sectionHeader}>
          <Text style={ui.sectionTitle}>Next to expire:</Text>
          <Text style={ui.sectionHint}>{nextToExpire ? "Saved locally" : "No scans yet"}</Text>
        </View>

        {nextToExpire ? (
          <View style={ui.previewCard}>
            <Image source={{ uri: nextToExpire.vaultItem?.ImageUri }} style={ui.previewImage} />
            <View style={ui.previewMeta}>
              <Text style={ui.previewTitle}>{nextToExpire.vaultItem?.title}</Text>
              <Text style={ui.previewSubtitle} numberOfLines={1}>
                Expires on {nextToExpire.vaultItem?.ExpiryDate}
              </Text>
              <Text style={ui.previewSubtitle} numberOfLines={1}>
                Amount: {nextToExpire.vaultItem?.MoneyAmount.toFixed(2)}
              </Text>
              {/* <Text style={ui.previewSubtitle} numberOfLines={1}>
                {user.email}
              </Text> */}

              <View style={ui.previewActions}>
                <Pressable
                  onPress={() => setShowCamera(true)}
                  style={({ pressed }) => [ui.secondaryButton, pressed && ui.pressed]}
                >
                  <Text style={ui.secondaryButtonText}>Rescan</Text>
                </Pressable>

                <Pressable
                  onPress={() => setPhotoUri(null)}
                  style={({ pressed }) => [ui.ghostButton, pressed && ui.pressed]}
                >
                  <Text style={ui.ghostButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={ui.emptyCard}>
            <Text style={ui.emptyIcon}>📷</Text>
            <Text style={ui.emptyTitle}>Nothing here yet</Text>
            <Text style={ui.emptyBody}>Tap “Open camera” to add your first scan.</Text>
          </View>
        )}

        {/* Bottom nav */}


        <NewVaultItemSheet photoUri={photoUri} />

      </NewVaultItemSheetContext.Provider>
    </View>
  );
}

export function NavItem({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void; }) {

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [ui.navItem, pressed && ui.pressed]}>
      <View style={[ui.navIconWrap, active && ui.navIconWrapActive]}>
        <Text style={[ui.navIcon, active && ui.navIconActive]}>{icon}</Text>
      </View>
      <Text style={[ui.navLabel, active && ui.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

