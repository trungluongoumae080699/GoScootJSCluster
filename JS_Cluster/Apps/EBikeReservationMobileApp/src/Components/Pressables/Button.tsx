import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';

export type CustomButtonProps = {
  label: string;
  onClick: () => void;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  isDisabled?: boolean;
};

export const Button: React.FC<CustomButtonProps> = ({
  label,
  onClick,
  containerStyle,
  textStyle,
  isDisabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => !isDisabled && setIsPressed(true)}
      onPressOut={() => !isDisabled && setIsPressed(false)}
      onPress={onClick}
      style={[styles.container, containerStyle, isDisabled && styles.disabled]}
    >


      <Text style={[styles.text, textStyle]}>{label}</Text>

            {/* Overlay when pressed or disabled */}
      {(isPressed || isDisabled) && (
        <View
          style={[
            styles.overlay,
            isDisabled && { backgroundColor: 'rgba(0, 0, 0, 0.20)' }, // darker for disabled
          ]}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#DF6C20',
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // press overlay
  },
  disabled: {
    opacity: 0.8, // slightly dim the base button
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});