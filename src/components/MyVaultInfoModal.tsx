// MyVaultInfoModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { VaultItem, VaultItemCard } from "./VaultItemCard";
import { it } from "zod/locales";
import * as Brightness from "expo-brightness";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/** Animation origin from measureInWindow */
export type VaultItemLayout = { x: number; y: number; width: number; height: number };

/** Your data types */
export type VaultItemType = any;

// export interface VaultItemCard {
//   title: string;
//   description: string;
//   ImageUri?: string;
//   Type: VaultItemType;
//   ExpiryDate: string;
//   MoneyAmount: number;
//   ScannedData?:string;
//   dataType?:string;
// }

// export interface VaultItem {
//   vaultItem: VaultItemCard | null;
// }

type Props = {
  visible: boolean;
  item: VaultItem | null;
  origin: VaultItemLayout | null;
  onRequestClose: () => void;
  onDelete: (item: VaultItem) => void;
  /** Optional: use your own UI for the front/back faces */
  renderFront?: (card: VaultItemCard) => React.ReactNode;
  renderBack?: (card: VaultItemCard) => React.ReactNode;

  /** Keep top/bottom list items visible behind the modal */
  modalWidthRatio?: number; // default 0.92
  modalHeightRatio?: number; // default 0.72

  /** Optional style override for the animated container */
  modalStyle?: StyleProp<ViewStyle>;
};

const CLOSE_BTN_SIZE = 34;
const CLOSE_BTN_INSET = 12;
// Space reserved so header text never goes under the absolute-position close button
const HEADER_RIGHT_GUARD = CLOSE_BTN_SIZE + CLOSE_BTN_INSET * 2;

// How far past the origin we shrink (tweak -0.12..-0.25)
const CLOSE_TO = -0.18;

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const MyVaultInfoModal: React.FC<Props> = ({
  visible,
  item,
  origin,
  onRequestClose,
  renderFront,
  renderBack,
  modalWidthRatio = 0.92,
  modalHeightRatio = 0.72,
  modalStyle,
  onDelete,
}) => {
  const { width: W, height: H } = useWindowDimensions();
  const card = item?.vaultItem ?? null;

  // Keep Modal mounted long enough to play close animation
  const [mounted, setMounted] = useState<boolean>(visible);
  const [currentDisplay, setCurrentDisplay] = useState("Info")
  const originalBrightness = useRef<number | null>(null);
  useEffect(() => {
    const handleBrightness = async () => {
      if (currentDisplay === "scannable") {
        // Save current brightness once
        if (originalBrightness.current === null) {
          originalBrightness.current =
            await Brightness.getBrightnessAsync();
        }

        await Brightness.setBrightnessAsync(0.8); // max brightness
      } else {
        // Restore brightness
        if (originalBrightness.current !== null) {
          await Brightness.setBrightnessAsync(
            originalBrightness.current
          );
          originalBrightness.current = null;
        }
      }
    };

    handleBrightness();

    return () => {
      // Safety restore on unmount
      if (originalBrightness.current !== null) {
        Brightness.setBrightnessAsync(originalBrightness.current);
        originalBrightness.current = null;
      }
    };
  }, [currentDisplay]);
  console.log(item?.vaultItem?.scannedData);
  const progress = useSharedValue(0);

  // Origin rect shared values
  const ox = useSharedValue(0);
  const oy = useSharedValue(0);
  const ow = useSharedValue(1);
  const oh = useSharedValue(1);

  const finalW = Math.round(W * modalWidthRatio);
  const finalH = Math.round(H * modalHeightRatio);
  const finalX = Math.round((W - finalW) / 2);
  const finalY = Math.round((H - finalH) / 2);

  const fallbackOrigin: VaultItemLayout = useMemo(
    () => ({
      x: finalX + finalW * 0.1,
      y: finalY + finalH * 0.1,
      width: finalW * 0.8,
      height: Math.max(120, finalH * 0.26),
    }),
    [finalX, finalY, finalW, finalH]
  );

  const openAnim = () => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  };

  const closeAnim = (after?: () => void) => {
    progress.value = withTiming(
      CLOSE_TO,
      { duration: 320, easing: Easing.inOut(Easing.quad) },
      (finished?: boolean) => {
        if (finished) {
          runOnJS(setMounted)(false);
          if (after) runOnJS(after)();
        }
      }
    );
    setCurrentDisplay("Info")
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);

      const o = origin ?? fallbackOrigin;
      ox.value = o.x;
      oy.value = o.y;
      ow.value = Math.max(1, o.width);
      oh.value = Math.max(1, o.height);

      openAnim();
    } else {
      // If parent toggles visible off directly, play close anim then unmount
      if (mounted) closeAnim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Subtle dim, still lets top/bottom list items show through
  const scrimAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [CLOSE_TO, 0, 1], [0, 0, 0.2], Extrapolate.CLAMP);
    return { opacity };
  });

  // Position + size morph, with extra shrink-to-zero on close (no visible blink)
  const containerAnimStyle = useAnimatedStyle(() => {
    const originCenterX = ox.value + ow.value / 2;
    const originCenterY = oy.value + oh.value / 2;

    const finalCenterX = finalX + finalW / 2;
    const finalCenterY = finalY + finalH / 2;

    const width = interpolate(
      progress.value,
      [CLOSE_TO, 0, 1],
      [0, ow.value, finalW],
      Extrapolate.CLAMP
    );
    const height = interpolate(
      progress.value,
      [CLOSE_TO, 0, 1],
      [0, oh.value, finalH],
      Extrapolate.CLAMP
    );

    // Keep shrinking into the center of the origin card
    const centerX = interpolate(
      progress.value,
      [CLOSE_TO, 0, 1],
      [originCenterX, originCenterX, finalCenterX],
      Extrapolate.CLAMP
    );
    const centerY = interpolate(
      progress.value,
      [CLOSE_TO, 0, 1],
      [originCenterY, originCenterY, finalCenterY],
      Extrapolate.CLAMP
    );

    const left = centerX - width / 2;
    const top = centerY - height / 2;

    const radius = interpolate(progress.value, [CLOSE_TO, 0, 1], [999, 16, 28], Extrapolate.CLAMP);
    const popScale = interpolate(progress.value, [0, 0.8, 1], [1, 1.02, 1], Extrapolate.CLAMP);

    // Fade out only during the "extra shrink" phase
    const opacity = interpolate(progress.value, [CLOSE_TO, -0.06, 0], [0, 0, 1], Extrapolate.CLAMP);

    return {
      left,
      top,
      width,
      height,
      opacity,
      borderRadius: radius,
      transform: [{ perspective: 1200 }, { scale: popScale }],
    };
  });

  // Flip faces (no mirrored text)
  const frontFaceAnimStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(
      progress.value,
      [CLOSE_TO, 0, 1],
      [0, 0, 180],
      Extrapolate.CLAMP
    )}deg`;

    const opacity = interpolate(
      progress.value,
      [CLOSE_TO, 0, 0.49, 0.5, 1],
      [0, 1, 1, 0, 0],
      Extrapolate.CLAMP
    );

    return { opacity, transform: [{ rotateY }] };
  });

  const backFaceAnimStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(
      progress.value,
      [CLOSE_TO, 0, 1],
      [180, 180, 360],
      Extrapolate.CLAMP
    )}deg`;

    const opacity = interpolate(
      progress.value,
      [CLOSE_TO, 0, 0.49, 0.5, 1],
      [0, 0, 0, 1, 1],
      Extrapolate.CLAMP
    );

    return { opacity, transform: [{ rotateY }] };
  });

  const closeBtnAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.72, 1], [0, 1], Extrapolate.CLAMP);
    const translateY = interpolate(progress.value, [0.72, 1], [-6, 0], Extrapolate.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  const defaultFront = (c: VaultItemCard) => (
    <View style={styles.frontWrap}>
      <View style={styles.frontLeft}>
        {c.ImageUri ? (
          <Image source={{ uri: c.ImageUri }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.thumbFallbackText}>🔒</Text>
          </View>
        )}
      </View>

      <View style={styles.frontRight}>
        <Text style={styles.frontTitle} numberOfLines={1} ellipsizeMode="tail">
          {c.title}
        </Text>
        <Text style={styles.frontMeta} numberOfLines={1} ellipsizeMode="tail">
          {String(c.Type)} • {formatMoney(c.MoneyAmount)}
        </Text>
        <Text style={styles.frontHint} numberOfLines={1}>
          Tap for details
        </Text>
      </View>
    </View>
  );

  const defaultBack = (c: VaultItemCard) => (
    <View style={styles.backWrap}>
      <View style={{ width: "100%", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 50, marginTop: 10 }}>
        {item?.vaultItem?.scannedData !== null && (
          <>
            <Text
              style={{
                justifyContent: "center", alignSelf: "center", fontSize: 16, fontWeight: "700", marginTop:2,
                borderWidth: 1, borderColor: "rgba(0, 0, 0, 1)",
                borderRadius: 8,
                backgroundColor: currentDisplay === "Info" ? "#050505ff" : "",
                padding: 10,
                color: currentDisplay === "Info" ? "#ffffffff" : "#050505ff"
              }}
              onPress={() => setCurrentDisplay("Info")}
            >
              Info
            </Text>
            {/* <Text style={{
              justifyContent: "center", alignSelf: "center", fontSize: 16, fontWeight: "700", marginBottom: 5,
              borderWidth: 1, borderColor: "rgba(0, 0, 0, 1)",
              borderRadius: 8,
              backgroundColor: currentDisplay === "scannable" ? "#050505ff" : "",
              padding: 10,
              color: currentDisplay === "scannable" ? "#ffffffff" : "#050505ff"
            }}
              onPress={() => setCurrentDisplay("scannable")}
            >
              QR
            </Text> */}
            <MaterialCommunityIcons
              onPress={() => setCurrentDisplay("scannable")}
              style={{backgroundColor: currentDisplay === "scannable" ? "#000000ff" : "#fffffff", padding:10,borderRadius: 8, borderWidth:1, borderColor:"#000000ff"}}
              name="qrcode-scan"
              size={22}
              color={currentDisplay === "scannable" ? "#fff" : "#050505ff"}
            />
          </>
        )}

      </View>
      {currentDisplay === "Info" && (
        <>
          <View style={styles.backHeader}>
            <Text style={styles.backTitle} numberOfLines={2} ellipsizeMode="tail">
              {c.title}
            </Text>

            <View style={styles.backMetaRow}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText} numberOfLines={1} ellipsizeMode="tail">
                  {String(c.Type)}
                </Text>
              </View>

              <View style={styles.amountPill}>
                <Text style={styles.amountPillLabel}>Amount</Text>
                <Text style={styles.amountPillValue}>{formatMoney(c.MoneyAmount)}</Text>
              </View>
            </View>

            <View style={styles.headerDivider} />
          </View>

          <ScrollView
            style={styles.backBody}
            contentContainerStyle={styles.backBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {c.ImageUri ? <Image source={{ uri: c.ImageUri }} style={styles.heroImage} /> : null}

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.paragraph}>{c.description}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Expiry</Text>
              <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
                {c.ExpiryDate}
              </Text>
            </View>

            <View style={styles.row}>
              {/* <Text style={styles.rowLabel}>Amount</Text>
          <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
            {formatMoney(c.MoneyAmount)}
          </Text> */}
            </View>

            <View style={styles.row}>
              {/* <Text style={styles.rowLabel}>Type</Text>
          <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
            {String(c.Type)}
          </Text> */}
            </View>
            <View style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", marginTop: 1, gap: 10 }}>
              <Pressable>
                <Text style={{ color: "black", borderRadius: 8, borderWidth: 1, borderColor: "black", padding: 7, marginRight: 10 }}>Edit</Text>
              </Pressable>
              <Pressable>
                <Text style={{ color: "white", borderRadius: 8, borderWidth: 1, borderColor: "red", padding: 7, backgroundColor: "red" }}
                  onPress={() => onDelete(item!)}
                >Delete</Text>
              </Pressable>
            </View>

            {/* <View style={{ height: 0}} /> */}
          </ScrollView>
        </>
      )}
      {currentDisplay === "scannable" && item?.vaultItem?.scannedData &&  (
        <View style={{ alignSelf: "center", top: "24%" }}>
          <QRCode
            value={item?.vaultItem?.scannedData}
            size={200}
          >
          </QRCode>
        </View>

      )}
    </View>
  );

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => closeAnim(onRequestClose)}
    >
      <View style={styles.root} pointerEvents="box-none">
        {/* Background scrim */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeAnim(onRequestClose)}>
          <Animated.View style={[styles.scrim, scrimAnimStyle]} />
        </Pressable>

        {/* Animated container */}
        <Animated.View
          style={[styles.animatedContainer, containerAnimStyle, modalStyle]}
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
        >


          {/* FRONT */}
          <Animated.View style={[styles.face, styles.faceFront, frontFaceAnimStyle]}>
            {card ? (renderFront ? renderFront(card) : defaultFront(card)) : null}
          </Animated.View>

          {/* BACK */}
          <Animated.View style={[styles.face, styles.faceBack, backFaceAnimStyle]}>
            {card ? (renderBack ? renderBack(card) : defaultBack(card)) : null}
          </Animated.View>

          {/* Close button */}
          <Animated.View style={[styles.closeBtnWrap, closeBtnAnimStyle]}>
            <Pressable onPress={() => closeAnim(onRequestClose)} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  scrim: {
    flex: 1,
    backgroundColor: "black",
  },

  animatedContainer: {
    position: "absolute",
    backgroundColor: "white",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",

    // iOS shadow
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },

    // Android elevation
    elevation: 12,
  },

  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: "hidden",
  },
  faceFront: {},
  faceBack: {},

  closeBtnWrap: {
    position: "absolute",
    top: CLOSE_BTN_INSET,
    right: CLOSE_BTN_INSET,
    zIndex: 10,
  },
  closeBtn: {
    width: CLOSE_BTN_SIZE,
    height: CLOSE_BTN_SIZE,
    borderRadius: CLOSE_BTN_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "800",
    opacity: 0.85,
  },

  // Front face (preview)
  frontWrap: {
    flex: 1,
    flexDirection: "row",
    padding: 14,
    paddingBottom: 2,
    gap: 12,
    backgroundColor: "white",
  },
  frontLeft: {
    justifyContent: "center",
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  thumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  thumbFallbackText: {
    fontSize: 24,
  },
  frontRight: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  frontTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  frontMeta: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: "700",
  },
  frontHint: {
    fontSize: 12,
    opacity: 0.5,
  },

  // Back face (info)
  backWrap: {
    flex: 1,
    backgroundColor: "white",
    // justifyContent:"center"

  },
  backHeader: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingRight: 18 + HEADER_RIGHT_GUARD, // prevents title under close button
    gap: 10,
  },
  backTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  backMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.82,
  },
  amountPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  amountPillLabel: {
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.55,
  },
  amountPillValue: {
    fontSize: 14,
    fontWeight: "900",
    opacity: 0.9,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  backBody: { flex: 1 },
  backBodyContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  heroImage: {
    width: "100%",
    height: 170,
    borderRadius: 22,
    marginBottom: 14,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "800",
    opacity: 0.55,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "800",
    opacity: 0.9,
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "62%",
  },
});
