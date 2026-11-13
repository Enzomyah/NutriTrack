import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDate } from '../context/DateContext';
import { useAppTheme } from '../context/ThemeContext';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarModal({ visible, onClose }: CalendarModalProps) {
  const { selectedDate, setSelectedDate } = useDate();
  const { colors } = useAppTheme();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Initialize month view based on selectedDate when modal opens
  useEffect(() => {
    if (visible && selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        // parts[1] is 1-indexed, JS months are 0-indexed
        setCurrentMonth(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
      }
    }
  }, [visible, selectedDate]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    const today = new Date();
    // Prevent going to future months beyond the current month
    if (currentMonth.getFullYear() > today.getFullYear() || 
       (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() >= today.getMonth())) {
        return;
    }
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = generateDays();
  const monthName = currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('en-CA'); // Local timezone today

  const handleSelectDate = (date: Date) => {
    const now = new Date();
    // Reset time to compare just dates
    now.setHours(0,0,0,0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0,0,0,0);
    
    // Disallow future dates
    if (selectedDateObj > now) {
      return;
    }
    
    // Format to YYYY-MM-DD reliably
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yy}-${mm}-${dd}`);
    onClose();
  };

  const todayDateObj = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === todayDateObj.getFullYear() && currentMonth.getMonth() === todayDateObj.getMonth();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.calendarContainer, { backgroundColor: colors.background, shadowColor: colors.text }]} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: colors.text }]}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={[styles.navButton, isCurrentMonth && { opacity: 0.3 }]} disabled={isCurrentMonth}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.daysHeaderRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={[styles.dayHeaderText, { color: colors.textSub }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
             {days.map((dateObj, index) => {
                 if (!dateObj) return <View key={`empty-${index}`} style={styles.dayCell} />;
                 
                 const yy = dateObj.getFullYear();
                 const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                 const dd = String(dateObj.getDate()).padStart(2, '0');
                 const dateStr = `${yy}-${mm}-${dd}`;
                 
                 const isSelected = dateStr === selectedDate;
                 const isTodayLocal = dateStr === todayStr;
                 
                 const dateAtMidnight = new Date(dateObj);
                 dateAtMidnight.setHours(0,0,0,0);
                 const nowMidnight = new Date();
                 nowMidnight.setHours(0,0,0,0);
                 
                 const isFuture = dateAtMidnight > nowMidnight;
                 
                 return (
                     <TouchableOpacity 
                         key={dateStr}
                         activeOpacity={isFuture ? 1 : 0.7}
                         onPress={() => handleSelectDate(dateObj)}
                         style={[
                             styles.dayCell, 
                             isSelected && { backgroundColor: colors.primary }
                         ]}
                     >
                         <Text style={[
                             styles.dayText, 
                             { color: isFuture ? colors.border : (isSelected ? '#FFFFFF' : colors.text) },
                             isTodayLocal && !isSelected && { color: colors.primary, fontWeight: 'bold' }
                         ]}>
                            {dateObj.getDate()}
                         </Text>
                     </TouchableOpacity>
                 );
             })}
          </View>
          
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButton: {
    padding: 8,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayHeaderText: {
    width: `${100/7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 5,
  },
  dayText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
