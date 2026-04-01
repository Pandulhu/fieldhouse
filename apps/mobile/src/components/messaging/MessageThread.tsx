import React, { useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { Message, MessageType, ConversationType } from '@fieldhouse/types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface MessageThreadProps {
  conversationId: string;
  conversationType: ConversationType;
  messages: Message[];
  currentUserId: string;
  senderNames: Record<string, string>;
  onSendMessage: (content: string, type: MessageType) => void;
  onLongPressMessage?: (messageId: string) => void;
  allowedMessageType: 'full' | 'note_only';
  inputDisabled: boolean;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  conversationType,
  messages,
  currentUserId,
  senderNames,
  onSendMessage,
  onLongPressMessage,
  allowedMessageType,
  inputDisabled,
}) => {
  const listRef = useRef<FlatList<Message>>(null);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => {
      const isOwn = item.senderId === currentUserId;
      const senderName = senderNames[item.senderId] ?? 'Unknown';

      return (
        <MessageBubble
          message={item}
          isOwnMessage={isOwn}
          senderName={senderName}
          onLongPress={onLongPressMessage}
        />
      );
    },
    [currentUserId, senderNames, onLongPressMessage],
  );

  const handleContentSizeChange = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const getConversationLabel = (): string | null => {
    if (conversationType === ConversationType.LeagueAnnouncement) {
      return 'League Announcements';
    }
    if (conversationType === ConversationType.CoachChannel) {
      return 'Coach Channel';
    }
    return null;
  };

  const label = getConversationLabel();

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={styles.headerText}>{label}</Text>
        </View>
      )}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={handleContentSizeChange}
      />
      <MessageInput
        onSend={onSendMessage}
        disabled={inputDisabled}
        allowedMessageType={allowedMessageType}
      />
    </View>
  );
};

const COLORS = {
  primary: '#1E3A5F',
  light: '#D6E4F0',
  background: '#F8FAFC',
  surface: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
});

export default MessageThread;
