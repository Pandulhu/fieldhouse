import React from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, ConversationType } from '@fieldhouse/types';

interface ConversationDisplay extends Conversation {
  name: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationDisplay[];
  currentUserId: string;
  onSelect: (conversationId: string) => void;
}

const PREVIEW_MAX = 50;

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelect,
}) => {
  const renderItem = ({ item }: ListRenderItemInfo<ConversationDisplay>) => {
    const isTeam =
      item.type === ConversationType.Team ||
      item.type === ConversationType.LeagueAnnouncement ||
      item.type === ConversationType.CoachChannel;

    const iconName: keyof typeof Ionicons.glyphMap = isTeam
      ? 'people'
      : 'person';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Open conversation with ${item.name}`}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name={iconName} size={24} color={COLORS.surface} />
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastMessageAt && (
              <Text style={styles.timestamp}>
                {formatTimestamp(item.lastMessageAt)}
              </Text>
            )}
          </View>
          {item.lastMessagePreview && (
            <Text style={styles.preview} numberOfLines={1}>
              {truncate(item.lastMessagePreview, PREVIEW_MAX)}
            </Text>
          )}
        </View>

        {item.unreadCount > 0 && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
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
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.muted,
  },
  preview: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.light,
    marginLeft: 76,
  },
});

export default ConversationList;
