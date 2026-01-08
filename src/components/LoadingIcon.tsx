


// LoadingIcon.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle, Text } from "react-native";

type Props = {
  size?: number;          // default 44
  color?: string;         // default "#0F172A" (near-black)
  style?: ViewStyle;
};

export const LoadingIcon: React.FC<Props> = ({ size = 44, color = "#0F172A", style }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.2],
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.05],
  });

  const thickness = Math.max(3, Math.round(size * 0.09));
  const inner = size * 0.62;

  return (
   <View
    style={[
      styles.wrap,
      style,
      {
        width: size,
        height: size,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [
          { translateX: -size / 2 },
          { translateY: -size / 2 },
        ],
      },
    ]}
  >
      {/* Soft pulse ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
            
          },
        ]}
      />

      {/* Spinner */}
      <Animated.View
        style={[
          styles.spinner,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            borderWidth: thickness,
            borderColor: color,
            transform: [{ rotate }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
  },
  spinner: {
    // Create a "gap" by making one side transparent
    borderRightColor: "transparent",
    borderTopColor: "transparent",
  },
});

export default LoadingIcon;
