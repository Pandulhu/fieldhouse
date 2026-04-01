import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Message, MessageType } from '@fieldhouse/types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName: string;
  onLongPress?: (messageId: string) => void;
}

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName,
  onLongPress,
}) => {
  const isNote = message.type === MessageType.Note;
  const isAnnouncement = message.type === MessageType.Announcement;

  if (isAnnouncement) {
    return (
      <View style={styles.announcementContainer}>
        <Text style={styles.announcementHeader}>Announcement</Text>
        <Text style={styles.announcementContent}>{message.content}</Text>
        <Text style={styles.timestampCenter}>{formatTime(message.createdAt)}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onLongPress?.(message.id)}
      style={[
        styles.wrapper,
        isOwnMessage ? styles.wrapperRight : styles.wrapperLeft,
      ]}
    >
      {!isOwnMessage && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
          isNote && styles.bubbleNote,
        ]}
      >
        {isNote && <Text style={styles.noteLabel}>Note</Text>}
        <Text
          style={[
            styles.content,
            isOwnMessage ? styles.contentOwn : styles.contentOther,
            isNote && styles.contentNote,
          ]}
        >
          {message.content}
        </Text>
      </View>
      <Text
        style={[
          styles.timestamp,
          isOwnMessage ? styles.timestampRight : styles.timestampLeft,
        ]}
      >
        {formatTime(message.createdAt)}
      </Text>
    </TouchableOpacity>
  );
};

const COLORS = {
  accent: '#2E75B6',
  light: '#D6E4F0',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#888888',
  otherBg: '#E8E8E8',
  noteAmber: '#F59E0B',
  noteBg: '#FFFBEB',
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  wrapperRight: {
    alignSelf: 'flex-end',
  },
  wrapperLeft: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: COLORS.accent,
  },
  bubbleOther: {
    backgroundColor: COLORS.otherBg,
  },
  bubbleNote: {
    backgroundColor: COLORS.noteBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.noteAmber,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.noteAmber,
    marginBottom: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
  },
  contentOwn: {
    color: COLORS.surface,
  },
  contentOther: {
    color: COLORS.text,
  },
  contentNote: {
    fontStyle: 'italic',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  timestampLeft: {
    textAlign: 'left',
    marginLeft: 4,
  },
  announcementContainer: {
    marginVertical: 8,
    marginHorizontal: 12,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  announcementHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  announcementContent: {
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.text,
  },
  timestampCenter: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MessageBubble;
