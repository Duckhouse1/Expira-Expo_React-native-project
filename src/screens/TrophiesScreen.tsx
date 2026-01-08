import React, { useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Dimensions,
    Animated,
    Easing,
} from "react-native";
import { styles as appStyles } from "../styles/styles";
import { Trophies } from "../components/Trophies/Trophies";

type TrophyItem = {
    id: number;
    name: string;
    description: string;
    icon: string; // could be emoji or key
};

type TrophySection = {
    id: number;
    name: string;
    icon: string;
    Trophies: TrophyItem[];
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const NUM_COLS = 3;
const GAP = 12;
const PADDING = 20;
const CARD_SIZE = Math.floor((SCREEN_W - PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS);

const MODAL_W = Math.min(SCREEN_W * 0.85, 360);
const MODAL_H = MODAL_W; // square like you asked

export const TrophiesScreen: React.FC = () => {
    // ✅ Replace this with your real unlocked trophies
    const acquiredIds = useMemo(() => new Set<number>([1, 2, 3, 10, 30]), []);

    const [selected, setSelected] = useState<{
        section: TrophySection;
        trophy: TrophyItem;
        acquired: boolean;
        isSecretSection: boolean;
    } | null>(null);

    const [overlayVisible, setOverlayVisible] = useState(false);

    // animation values
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    const openFromRef = (section: TrophySection, trophy: TrophyItem, cardRef: React.RefObject<View | null>
    ) => {
        const acquired = acquiredIds.has(trophy.id);
        const isSecretSection = section.name.toLowerCase().includes("secret");

        cardRef.current?.measureInWindow((x, y, w, h) => {
            // Overlay card is positioned at screen center. We animate it FROM the pressed card -> center.
            const cardCenterX = x + w / 2;
            const cardCenterY = y + h / 2;

            const targetCenterX = SCREEN_W / 2;
            const targetCenterY = SCREEN_H / 2;

            const dx = cardCenterX - targetCenterX;
            const dy = cardCenterY - targetCenterY;

            const initialScale = w / MODAL_W;

            setSelected({ section, trophy, acquired, isSecretSection });
            setOverlayVisible(true);

            // set start state
            backdropOpacity.setValue(0);
            scale.setValue(initialScale);
            translateX.setValue(dx);
            translateY.setValue(dy);

            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 260,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 260,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 260,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
            ]).start();
        });
    };

    const closeOverlay = () => {
        // reverse back to nothing (simple fade+shrink)
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 160,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(scale, {
                toValue: 0.92,
                duration: 160,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start(() => {
            setOverlayVisible(false);
            setSelected(null);
            scale.setValue(1);
            translateX.setValue(0);
            translateY.setValue(0);
        });
    };

    return (
        <View style={[appStyles.container, { padding: PADDING, marginBottom: 50 }]}>
            <View style={{ marginBottom: 14 }}>
                <Text style={appStyles.title}>View your trophies here🏆</Text>
                <Text style={{ color: "#94A3B8" }}>Tap a card to view details. Secrets hide the description until unlocked.</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {(Trophies as TrophySection[]).map((section) => {
                    const isSecretSection = section.name.toLowerCase().includes("secret");

                    return (
                        <View key={section.id} style={{ marginBottom: 22 }}>
                            <Text style={appStyles.subtitle}>
                                {section.name} {section.icon}
                            </Text>

                            <View style={s.grid}>
                                {section.Trophies.map((trophy) => {
                                    const acquired = acquiredIds.has(trophy.id);
                                    return (
                                        <TrophyCard
                                            key={trophy.id}
                                            size={CARD_SIZE}
                                            gap={GAP}
                                            title={trophy.name}
                                            icon={isSecretSection && !acquired ? "❓" : "🏆"} // swap if you want real per-trophy icons
                                            acquired={acquired}
                                            onPressRef={(ref) => openFromRef(section, trophy, ref)}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Overlay modal (does not push layout) */}
            {overlayVisible && selected && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />

                    {/* Tap outside to close */}
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlay} />

                    <Animated.View
                        style={[
                            s.modalCard,
                            {
                                width: MODAL_W,
                                height: MODAL_H,
                                left: (SCREEN_W - MODAL_W) / 2,
                                top: (SCREEN_H - MODAL_H) / 2,
                                transform: [{ translateX }, { translateY }, { scale }],
                                opacity: backdropOpacity, // ties nicely to backdrop
                            },
                            selected.acquired ? s.modalCardUnlocked : s.modalCardLocked,
                        ]}
                    >
                        {/* Close button */}
                        <Pressable onPress={closeOverlay} style={s.closeBtn} hitSlop={10}>
                            <Text style={{ fontSize: 18 }}>✕</Text>
                        </Pressable>

                        <View style={{ alignItems: "center", paddingHorizontal: 18 }}>
                            <Text style={s.modalTitle}>{selected.trophy.name}</Text>
                            <Text style={s.modalIcon}>{selected.isSecretSection && !selected.acquired ? "❓" : "🏆"}</Text>

                            <Text style={s.modalDesc}>
                                {selected.isSecretSection && !selected.acquired ? "???" : selected.trophy.description}
                            </Text>

                            <Text style={[s.modalStatus, { opacity: 0.75 }]}>
                                {selected.acquired ? "Unlocked ✅" : "Locked 🔒"}
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

function TrophyCard(props: {
    size: number;
    gap: number;
    title: string;
    icon: string;
    acquired: boolean;
    onPressRef: (ref: React.RefObject<View | null>) => void;
}) {
    const cardRef = useRef<View | null>(null);

    return (
        <Pressable
            onPress={() => props.onPressRef(cardRef)}
            style={[
                s.card,
                {
                    width: props.size,
                    height: props.size,
                    marginRight: props.gap,
                    marginTop: props.gap,
                    opacity: props.acquired ? 1 : 0.35,
                },
                props.acquired ? s.cardUnlocked : s.cardLocked,
            ]}
            ref={cardRef as any}
        >
            <Text style={s.cardTitle} numberOfLines={2}>
                {props.title}
            </Text>
            <Text style={s.cardIcon}>{props.icon}</Text>
        </Pressable>
    );
}

const s = StyleSheet.create({
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
        // compensate for right margin and top margin on cards
        marginRight: -GAP,
        // marginTop: -GAP,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        padding: 10,
        justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    cardUnlocked: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: "rgba(255,255,255,0.18)",
    },
    cardLocked: {
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.10)",
    },
    cardTitle: {
        color: "#474747ff",
        fontWeight: "700",
        fontSize: 12,
        lineHeight: 14,
    },
    cardIcon: {
        fontSize: 26,
        textAlign: "center",
        marginBottom: 4,
    },

    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.55)",
    },

    modalCard: {
        position: "absolute",
        borderRadius: 18,
        borderWidth: 1,
        paddingTop: 26,
        justifyContent: "center",
        backgroundColor: "rgba(234, 241, 255, 0.98)",
    },
    modalCardUnlocked: {
        borderColor: "rgba(255,255,255,0.22)",
    },
    modalCardLocked: {
        borderColor: "rgba(255,255,255,0.14)",
    },
    closeBtn: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    modalTitle: {
        color: "#555555ff",
        fontSize: 18,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 12,
    },
    modalIcon: {
        fontSize: 48,
        marginBottom: 14,
    },
    modalDesc: {
        color: "#86909eff",
        fontSize: 14,
        textAlign: "center",
        paddingHorizontal: 10,
        marginBottom: 14,
    },
    modalStatus: {
        color: "#7c7c7cff",
        fontWeight: "700",
    },
});
