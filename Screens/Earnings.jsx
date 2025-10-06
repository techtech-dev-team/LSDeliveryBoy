import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../components/colors';

const Earnings = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month

  // Sample earnings data
  const earningsData = {
    today: {
      total: '₹450',
      deliveries: 8,
      hours: '6.5 hrs',
      avgPerOrder: '₹56.25'
    },
    week: {
      total: '₹2,340',
      deliveries: 42,
      hours: '35 hrs',
      avgPerOrder: '₹55.71'
    },
    month: {
      total: '₹9,850',
      deliveries: 178,
      hours: '145 hrs',
      avgPerOrder: '₹55.34'
    }
  };

  const currentData = earningsData[selectedPeriod];

  const recentEarnings = [
    {
      id: 'ORD001',
      amount: '₹85',
      time: '2:30 PM',
      type: 'delivery'
    },
    {
      id: 'ORD002', 
      amount: '₹45',
      time: '1:15 PM',
      type: 'delivery'
    },
    {
      id: 'BONUS001',
      amount: '₹50',
      time: '12:00 PM',
      type: 'bonus'
    },
    {
      id: 'ORD003',
      amount: '₹120',
      time: '11:30 AM',
      type: 'delivery'
    },
  ];

  const StatCard = ({ title, value, icon }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color={colors.primary.yellow2} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const EarningItem = ({ item }) => (
    <View style={styles.earningItem}>
      <View style={styles.earningLeft}>
        <View style={[styles.earningIcon, { backgroundColor: item.type === 'bonus' ? colors.primary.yellow3 : colors.neutrals.lightGray }]}>
          <Ionicons 
            name={item.type === 'bonus' ? 'gift-outline' : 'bicycle-outline'} 
            size={16} 
            color={item.type === 'bonus' ? colors.primary.yellow2 : colors.neutrals.gray} 
          />
        </View>
        <View style={styles.earningInfo}>
          <Text style={styles.earningId}>
            {item.type === 'bonus' ? 'Performance Bonus' : `Order ${item.id}`}
          </Text>
          <Text style={styles.earningTime}>{item.time}</Text>
        </View>
      </View>
      <Text style={styles.earningAmount}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Period Filter */}
        <View style={styles.periodFilter}>
          <TouchableOpacity 
            style={[styles.periodTab, selectedPeriod === 'today' && styles.activePeriodTab]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'today' && styles.activePeriodText]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodTab, selectedPeriod === 'week' && styles.activePeriodTab]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodTab, selectedPeriod === 'month' && styles.activePeriodTab]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>{currentData.total}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Deliveries" 
            value={currentData.deliveries} 
            icon="bicycle-outline"
          />
          <StatCard 
            title="Hours Worked" 
            value={currentData.hours} 
            icon="time-outline"
          />
          <StatCard 
            title="Avg per Order" 
            value={currentData.avgPerOrder} 
            icon="trending-up-outline"
          />
        </View>

        {/* Recent Earnings */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {recentEarnings.map((item, index) => (
            <EarningItem key={index} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  withdrawButton: {
    backgroundColor: colors.primary.yellow2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  withdrawText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'white',
  },
  periodFilter: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.neutrals.lightGray,
  },
  activePeriodTab: {
    backgroundColor: colors.primary.yellow2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.neutrals.gray,
  },
  activePeriodText: {
    color: 'white',
  },
  totalCard: {
    backgroundColor: 'white',
    marginHorizontal: 32,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.neutrals.gray,
    fontWeight: '400',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '400',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  recentSection: {
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: colors.neutrals.dark,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  earningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  earningIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningId: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.neutrals.dark,
  },
  earningTime: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
  },
});

export default Earnings;