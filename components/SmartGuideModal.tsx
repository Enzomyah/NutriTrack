import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SmartGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onLogFood: () => void;
}

export default function SmartGuideModal({ visible, onClose, onLogFood }: SmartGuideModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.topAccent} />

          <View style={styles.contentRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="trending-up" size={26} color="#D1855C" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Smart Guide Tip</Text>
              <Text style={styles.bodyText}>
                You're almost at the end of the day, but you are still low on Protein.
              </Text>
              <Text style={styles.boldBodyText}>
                Suggestion: Eat 100g of Chicken Breast to hit your daily goal!
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.logButton} onPress={onLogFood}>
              <Text style={styles.logButtonText}>Log Food Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    paddingTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#6BAE45',
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF6EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#6BAE45',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bodyText: {
    color: '#8A97A8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
  },
  boldBodyText: {
    color: '#2D3C59',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logButton: {
    flex: 1,
    backgroundColor: '#6BAE45',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 12,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dismissButton: {
    flex: 0.7,
    backgroundColor: '#EAEAEA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#8A97A8',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
