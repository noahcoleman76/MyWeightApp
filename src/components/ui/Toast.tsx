import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  visible: boolean;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  visible,
  onDismiss,
  autoHide = true,
  autoHideDelay = 4000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoHide) {
        const timer = setTimeout(() => {
          hideToast();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#dcfce7',
          borderColor: '#16a34a',
          iconColor: '#16a34a',
          textColor: '#15803d',
          iconName: 'checkmark-circle' as const,
        };
      case 'info':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#2563eb',
          iconColor: '#2563eb',
          textColor: '#1d4ed8',
          iconName: 'information-circle' as const,
        };
      default:
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#dc2626',
          iconColor: '#dc2626',
          textColor: '#dc2626',
          iconName: 'alert-circle' as const,
        };
    }
  };

  const toastStyles = getToastStyles();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: toastStyles.backgroundColor,
          borderColor: toastStyles.borderColor,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <Ionicons
          name={toastStyles.iconName}
          size={20}
          color={toastStyles.iconColor}
        />
        <Text style={[styles.message, { color: toastStyles.textColor }]}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={toastStyles.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;