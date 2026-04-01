import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageType } from '@fieldhouse/types';

interface MessageInputProps {
  onSend: (content: string, type: MessageType) => void;
  disabled: boolean;
  placeholder?: string;
  allowedMessageType: 'full' | 'note_only';
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled,
  placeholder,
  allowedMessageType,
}) => {
  const [text, setText] = useState('');

  const isNoteOnly = allowedMessageType === 'note_only';
  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const type = isNoteOnly ? MessageType.Note : MessageType.Chat;
    onSend(trimmed, type);
    setText('');
  };

  return (
    <View style={styles.container}>
      {isNoteOnly && (
        <View style={styles.noteBanner}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.noteAmber} />
          <Text style={styles.noteLabel}>Sending as note</Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? 'Type a message...'}
          placeholderTextColor={COLORS.muted}
          editable={!disabled}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="send"
            size={20}
            color={canSend ? COLORS.surface : COLORS.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const COLORS = {
  primary: '#1E3A5F',
  accent: '#2E75B6',
  light: '#D6E4F0',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#888888',
  noteAmber: '#F59E0B',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.noteAmber,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.light,
  },
});

export default MessageInput;
