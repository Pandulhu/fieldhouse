import React, { useState, useRef } from 'react';
import { TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlagButtonProps {
  messageId: string;
  onFlag: (messageId: string) => void;
}

const FlagButton: React.FC<FlagButtonProps> = ({ messageId, onFlag }) => {
  const [flagged, setFlagged] = useState(false);
  const colorAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Alert.alert(
      'Flag this message?',
      'This message will be reported for review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag',
          style: 'destructive',
          onPress: () => {
            onFlag(messageId);
            setFlagged(true);
            Animated.sequence([
              Animated.timing(colorAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(colorAnim, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: false,
              }),
            ]).start(() => setFlagged(false));
          },
        },
      ],
    );
  };

  const iconColor = flagged ? COLORS.flagRed : COLORS.muted;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Flag message"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={flagged ? 'flag' : 'flag-outline'}
        size={18}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

const COLORS = {
  muted: '#888888',
  flagRed: '#DC2626',
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FlagButton;
