import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLinkProps, StackActions } from '@react-navigation/native';

type LinkButtonProps = {
  screen: string;              // target screen
  params?: object;             // optional params
  label: string;               // text shown
  color?: string;              // default background color
  pressedColor?: string;       // color when pressed
};

export const LinkButton: React.FC<LinkButtonProps> = ({
  screen,
  params,
  label,
  color = '#757575',           // default blue
  pressedColor = '#df6c20',    // darker when pressed
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const styles = StyleSheet.create({
    pressable: {
      backgroundColor: 'clear'
    },

    text: {
      color: isPressed ? pressedColor : color, 
      fontWeight: '400'
    }
  })
  // navigation props from React Navigation
  const link = useLinkProps({
    action: StackActions.push(screen as never, params as never),
  });

  return (
    <Pressable
      {...link}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={styles.pressable}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
};