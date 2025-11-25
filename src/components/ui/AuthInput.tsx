// src/components/ui/AuthInput.tsx
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const hasError = !!error;
  const secureTextEntry = isPassword && !isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableWithoutFeedback onPress={() => textInputRef.current?.focus()}>
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
        ]}>
          <TextInput
            ref={textInputRef}
            {...textInputProps}
            secureTextEntry={secureTextEntry}
            style={[styles.input, textInputProps.style]}
            onFocus={(e) => {
              setIsFocused(true);
              textInputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              textInputProps.onBlur?.(e);
            }}
            placeholderTextColor="#9ca3af"
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
                color="#6b7280"
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
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#dc2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: '#5eada8',
    backgroundColor: '#ffffff',
    shadowColor: '#5eada8',
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
    color: '#111827',
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