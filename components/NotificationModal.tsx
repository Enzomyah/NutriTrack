import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, Notification } from '../context/NotificationContext';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const { notifications, markAllAsRead, clearAll } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'meal': return { name: 'restaurant-outline' as const, color: '#6BAE45' };
      case 'fasting': return { name: 'timer-outline' as const, color: '#D1855C' };
      case 'goal': return { name: 'trophy-outline' as const, color: '#f1c40f' };
      default: return { name: 'bulb-outline' as const, color: '#8A97A8' };
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>All Notifications</Text>
              <Text style={styles.subtitle}>{notifications.length} message{notifications.length !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.actionText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const icon = getIcon(notif.type);
                return (
                  <View key={notif.id} style={[styles.notifItem, !notif.read && styles.unreadItem]}>
                    <View style={[styles.iconBox, { backgroundColor: icon.color + '10' }]}>
                      <Ionicons name={icon.name} size={22} color={icon.color} />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.topRow}>
                        <Text style={styles.notifTitle}>{notif.title}</Text>
                        <Text style={styles.timeText}>{formatTime(notif.time)}</Text>
                      </View>
                      <Text style={styles.description}>{notif.description}</Text>
                      {!notif.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={50} color="#EAEAEA" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    maxHeight: '80%',
    width: '100%',
    padding: 20,
    paddingTop: 60, // Space for status bar if not handled
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3C59',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A97A8',
  },
  actionText: {
    fontSize: 14,
    color: '#6BAE45',
    fontWeight: 'bold',
  },
  list: {
    flex: 0, // grows based on max-height
  },
  notifItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#F9FAFC',
    borderRadius: 12,
    marginHorizontal: -5,
    paddingHorizontal: 5,
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3C59',
  },
  timeText: {
    fontSize: 11,
    color: '#8A97A8',
  },
  description: {
    fontSize: 13,
    color: '#5C6A7D',
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    right: -2,
    top: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6BAE45',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#8A97A8',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    marginTop: 20,
    paddingTop: 15,
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#8A97A8',
    fontWeight: 'bold',
  },
});
