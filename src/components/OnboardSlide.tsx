import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BackButton from "./ui/BackButton";
import Button from "./ui/Button";

type Props = {
  image?: any;
  title: string;
  cta: string;
  nextRoute: string;
  showLoginLink?: boolean;
  showBackButton?: boolean;
};

export default function OnboardSlide({
  image,
  title,
  cta,
  nextRoute,
  showLoginLink,
  showBackButton = false,
}: Props) {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#ffffff";
  const BORDER = colors?.border ?? "#e5e7eb";
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
    <View style={[styles.container, { backgroundColor: BG }]}>
      {showBackButton && (
        <BackButton />
      )}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: showBackButton ? 0 : 40 }]}>
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
            <View style={[styles.hero, styles.placeholder, { backgroundColor: BORDER }]}>
              <Text style={[styles.placeholderText, { color: TEXT }]}>[dashboard image]</Text>
            </View>
          )}

          {/* Separator line */}
          <View style={[styles.separator, { backgroundColor: BORDER }]} />

          {/* Text + CTA */}
          <View style={styles.contentWrap}>
            <Text style={[styles.title, { color: TEXT }]}>{title}</Text>

            {/* Big accent CTA with shadow */}
            <Button
              title={cta}
              onPress={() => nav.navigate(nextRoute)}
              variant="primary"
              accentColor={ACCENT}
              style={styles.ctaButtonWithShadow}
            />

            {showLoginLink && (
              <View style={styles.loginLink}>
                <Text style={[styles.loginText, { color: TEXT }]}>
                  Already have an account?{" "}
                </Text>
                <Pressable
                  onPress={() => nav.navigate("Login" as never)}
                  style={{ marginTop: -2 }}
                >
                  {({ pressed }) => (
                    <Text
                      style={[
                        styles.loginText,
                        {
                          color: LOGIN_BLUE,
                          fontWeight: "700",
                          textDecorationLine: "underline",
                          opacity: pressed ? 0.6 : 1
                        }
                      ]}
                    >
                      Log in.
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const MAX_WIDTH = 340;
const HERO_MAX_WIDTH = 680;   // 2× visual width
const HERO_HEIGHT = 520;      // 2× visual height

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 20,
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
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    // color will be applied inline
  },
  separator: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    height: 1,
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
  ctaButtonWithShadow: {
    marginTop: 24,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
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
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    fontSize: 12,
    // color will be applied inline
  },
});
