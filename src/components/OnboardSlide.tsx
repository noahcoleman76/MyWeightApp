import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Button, Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  image?: any;
  title: string;
  subtitle?: string;
  cta: string;
  nextRoute: string;
  showLoginLink?: boolean;
};

export default function OnboardSlide({ image, title, subtitle, cta, nextRoute, showLoginLink }: Props) {
  const nav = useNavigation<any>();
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      {image ? (
        <Image source={image} style={{ width: 260, height: 260, borderRadius: 16, marginBottom: 20 }} resizeMode="contain" />
      ) : (
        <View className="w-60 h-60 bg-gray-200 rounded-2xl mb-5 items-center justify-center">
          <Text className="text-gray-500">[dashboard image]</Text>
        </View>
      )}
      <Text className="text-2xl font-semibold text-center">{title}</Text>
      {subtitle ? <Text className="mt-2 text-center text-gray-600">{subtitle}</Text> : null}
      <View className="mt-6 w-64">
        <Button title={cta} onPress={() => nav.navigate(nextRoute)} />
      </View>
      {showLoginLink && (
        <TouchableOpacity className="mt-4" onPress={() => {/* TODO: navigate to Login */}}>
          <Text className="text-xs text-gray-500">Already have an account? Log in.</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}