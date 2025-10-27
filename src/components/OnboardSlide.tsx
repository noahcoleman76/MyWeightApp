import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  image?: any;
  title: string;
  cta: string;
  nextRoute: string;
  showLoginLink?: boolean;
};

export default function OnboardSlide({
  image,
  title,
  cta,
  nextRoute,
  showLoginLink,
}: Props) {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const ACCENT = colors?.primary ?? "#16a34a";
  const LOGIN_BLUE = "#2563eb";

  // --- slide in from right ---
  const startX = Dimensions.get("window").width; // start fully off-screen to the right
  const slideX = useRef(new Animated.Value(startX)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slideX]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animWrap,
          { transform: [{ translateX: slideX }], opacity: fade },
        ]}
      >
        {/* Top image (2x size) */}
        {image ? (
          <Image source={image} style={styles.hero} resizeMode="contain" />
        ) : (
          <View style={[styles.hero, styles.placeholder]}>
            <Text style={styles.placeholderText}>[dashboard image]</Text>
          </View>
        )}

        {/* Separator line */}
        <View style={styles.separator} />

        {/* Text + CTA */}
        <View style={styles.contentWrap}>
          <Text style={styles.title}>{title}</Text>

          {/* Big accent CTA with shadow */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.ctaButton, styles.ctaShadow, { backgroundColor: ACCENT }]}
            onPress={() => nav.navigate(nextRoute)}
          >
            <Text style={styles.ctaText}>{cta}</Text>
          </TouchableOpacity>

          {showLoginLink && (
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => nav.navigate("Login" as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={[styles.loginText, { color: LOGIN_BLUE, fontWeight: "700" }]}>
                  Log in.
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const MAX_WIDTH = 340;
const HERO_MAX_WIDTH = 680;   // 2× visual width
const HERO_HEIGHT = 520;      // 2× visual height

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  animWrap: {
    width: "100%",
    alignItems: "center",
  },
  hero: {
    width: "80%",
    maxWidth: HERO_MAX_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 16,
  },
  placeholder: {
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#6b7280",
  },
  separator: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 16,
    marginBottom: 20,
  },
  contentWrap: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  ctaButton: {
    marginTop: 24,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  // Cross-platform shadow
  ctaShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: 14,
    alignSelf: "center",
  },
  loginText: {
    fontSize: 12,
    color: "#374151",
  },
});
