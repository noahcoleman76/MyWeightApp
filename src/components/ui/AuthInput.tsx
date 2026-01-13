import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  showPasswordToggle?: boolean;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  showPasswordToggle = false,
  isPassword = false,
  containerStyle,
  required = false,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const TEXT = colors?.text ?? "#111827";
  const BORDER = colors?.border ?? "#d1d5db";
  const BG_LIGHT = colors?.card ?? "#f9fafb";
  const ACCENT = colors?.primary ?? "#5eada8";
  const PLACEHOLDER = "#9ca3af";
  const SECONDARY_TEXT = colors?.text ? `${colors.text}99` : "#6b7280";

  const hasError = !!error;
  const secureTextEntry = isPassword && !isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: TEXT }]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableWithoutFeedback onPress={() => textInputRef.current?.focus()}>
        <View style={[
          styles.inputContainer,
          { borderColor: BORDER, backgroundColor: BG_LIGHT },
          isFocused && { borderColor: ACCENT, backgroundColor: colors?.background ?? "#ffffff", shadowColor: ACCENT },
          hasError && styles.inputContainerError,
        ]}>
          <TextInput
            ref={textInputRef}
            {...textInputProps}
            secureTextEntry={secureTextEntry}
            style={[styles.input, { color: TEXT }, textInputProps.style]}
            onFocus={(e) => {
              setIsFocused(true);
              textInputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              textInputProps.onBlur?.(e);
            }}
            placeholderTextColor={PLACEHOLDER}
            blurOnSubmit={false}
            returnKeyType="next"
          />

          {showPasswordToggle && isPassword && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.passwordToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye' : 'eye-off'}
                size={20}
                color={SECONDARY_TEXT}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>

      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#dc2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  passwordToggle: {
    paddingLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 4,
    flex: 1,
  },
});

export default AuthInput;