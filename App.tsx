import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { HomeScreen, NavItem } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MyVaultScreen } from "./src/screens/MyVaultScreen";
import { TrophiesScreen } from "./src/screens/TrophiesScreen";

import { styles } from "./src/styles/styles";
import { ui } from "./src/components/UI";

import type { User } from "./src/types/user";
import { HideNavBarContext, ShowCameraContext, Tab, TabContext, VaultItemsContext } from "./src/Contexts";

import CreateService from "./src/Services/CreateService";
import ExpiresServices from "./src/Services/ExpiresServices";

import LoadingIcon from "./src/components/LoadingIcon";
import { VaultItem, VaultItemCard } from "./src/components/VaultItemCard";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [showCamera, setShowCamera] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [hideNavBar, setHideNavBar] = useState(false)
  const pagerRef = useRef<PagerView>(null);

  // Order of pages in the pager:
  // 0 = Trophies, 1 = Home, 2 = Vault
  const tabToIndex = useMemo(
    () => ({ Trophies: 0, home: 1, vault: 2 } as const),
    []
  );

  const indexToTab = useMemo(() => (["Trophies", "home", "vault"] as const), []);

  const goToTab = (nextTab: Tab) => {
    setTab(nextTab);
    pagerRef.current?.setPage(tabToIndex[nextTab]);
  };

  // Keep pager position in sync if tab is changed somewhere else
  useEffect(() => {
    if (!user) return;
    pagerRef.current?.setPageWithoutAnimation(tabToIndex[tab]);
  }, [tab, tabToIndex, user]);

  useEffect(() => {
    ExpiresServices.enableLocalNotifs();
    if (!user) return;

    CreateService.GetAllVaultItems().then((items) => {
      const VaultItems: VaultItem[] = items.map((item) => {
        const card: VaultItemCard = {
          title: `${item.title}`,
          description: `Type: ${item.type}`,
          Type: item.type,
          ExpiryDate: item.expiryDate!,
          MoneyAmount: item.amount || 0,
          ImageUri: item.imageUrl,
          scannedData: item.scannedData || null,
          dataType: item.dataType || null,
        };

        const vaultItem: VaultItem = { vaultItem: card };
        return vaultItem;
      })
        .sort((a, b) => {
          const dateA = a.vaultItem?.ExpiryDate ? new Date(a.vaultItem.ExpiryDate) : new Date(0);
          const dateB = b.vaultItem?.ExpiryDate ? new Date(b.vaultItem.ExpiryDate) : new Date(0);
          return dateA.getTime() - dateB.getTime();
        });

      setVaultItems(VaultItems);
      setLoadingVault(false);
    })
      .catch((error) => {
        console.error("Error fetching vault items:", error);
        setLoadingVault(false);
      });
  }, [user, setUser]);
  useEffect(() => {
    console.log("vaultItems length:", vaultItems.length);
  }, [vaultItems]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <TabContext.Provider value={{ currentTab: tab, setCurrentTab: setTab }}>
          <ShowCameraContext.Provider value={{ showCamera, setShowCamera }}>
            <HideNavBarContext.Provider value={{ hideBar: hideNavBar, setHideBar: setHideNavBar }}>
              <VaultItemsContext.Provider value={{ VaultItems: vaultItems, setVaultItems }}>
                {/* Loading overlay */}
                {loadingVault && (
                  <View
                    style={{
                      position: "absolute",
                      zIndex: 999,
                      elevation: 999,
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "#fff",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <LoadingIcon size={78} color="#000" />
                  </View>
                )}

                {/* Logged out */}
                {!user && !loadingVault && (
                  <LoginScreen
                    onLogin={(u) => {
                      setLoadingVault(true);
                      setUser(u);
                      // optional: always land on Home after login
                      setTab("home");
                    }}
                  />
                )}

                {/* Logged in */}
                {user && (
                  <>
                    {/* Swipeable pages */}
                    <PagerView
                      ref={pagerRef}
                      style={{ flex: 1 }}
                      initialPage={tabToIndex[tab]}
                      onPageSelected={(e) => {
                        const nextTab = indexToTab[e.nativeEvent.position];
                        setTab(nextTab);
                      }}
                      // Disable swiping while camera is open or while loading
                      scrollEnabled={!showCamera && !loadingVault}
                    >
                      <View key="trophies" style={{ flex: 1 }}>
                        <TrophiesScreen />
                      </View>

                      <View key="home" style={{ flex: 1 }}>
                        <HomeScreen user={user} onLogout={() => setUser(null)} showCamera={showCamera} />
                      </View>

                      <View key="vault" style={{ flex: 1 }}>
                        <MyVaultScreen vaultItems={vaultItems} />
                      </View>
                    </PagerView>

                    {/* Bottom nav (stays fixed; swiping doesn't move it) */}
                    {!showCamera && !loadingVault && !hideNavBar && (
                      <View style={ui.nav}>
                        <NavItem
                          label="Trophies"
                          icon="✦"
                          active={tab === "Trophies"}
                          onPress={() => goToTab("Trophies")}
                        />
                        <NavItem label="Home" icon="⌂" active={tab === "home"} onPress={() => goToTab("home")} />
                        <NavItem
                          label="My Vault"
                          icon="▣"
                          active={tab === "vault"}
                          onPress={() => goToTab("vault")}
                        />
                      </View>
                    )}
                  </>
                )}
              </VaultItemsContext.Provider>
            </HideNavBarContext.Provider>
          </ShowCameraContext.Provider>
        </TabContext.Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
