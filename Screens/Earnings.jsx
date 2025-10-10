import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { colors, typography } from '../components/colors';
import { earningsAPI } from '../utils/earnings';

const Earnings = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const getEarnings = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await earningsAPI.getEarnings(selectedPeriod);
        if (result.success) {
          setEarnings(result.data);
        } else {
          setError(result.error || 'Failed to fetch earnings');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getEarnings();
  }, [selectedPeriod]);

  // You can fetch recent earnings from backend if available, else keep as empty array
  const recentEarnings = [];

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

        {/* Earnings Data */}
        {loading ? (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Loading earnings...</Text>
          </View>
        ) : error ? (
          <View style={styles.totalCard}>
            <Text style={[styles.totalLabel, { color: 'red' }]}>Error: {error}</Text>
          </View>
        ) : earnings ? (
          <>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Earnings</Text>
              <Text style={styles.totalAmount}>₹{earnings.totalEarnings}</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard 
                title="Deliveries" 
                value={earnings.totalOrders} 
                icon="bicycle-outline"
              />
              {/* If you have hours worked, add here. Otherwise, skip. */}
              <StatCard 
                title="Avg per Order" 
                value={`₹${earnings.avgEarningsPerOrder.toFixed(2)}`} 
                icon="trending-up-outline"
              />
            </View>
            {/* Recent Earnings: If you want to show earningsByDate, you can map here */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Earnings by Date</Text>
              {earnings.earningsByDate && Object.entries(earnings.earningsByDate).map(([date, amount], idx) => (
                <View key={idx} style={styles.earningItem}>
                  <View style={styles.earningLeft}>
                    <View style={[styles.earningIcon, { backgroundColor: colors.neutrals.lightGray }]}> 
                      <Ionicons name="bicycle-outline" size={16} color={colors.neutrals.gray} />
                    </View>
                    <View style={styles.earningInfo}>
                      <Text style={styles.earningId}>{date}</Text>
                    </View>
                  </View>
                  <Text style={styles.earningAmount}>₹{amount}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45,
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
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
  },
  withdrawButton: {
    backgroundColor: colors.primary.yellow2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  withdrawText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
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
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
  },
  activePeriodText: {
    color: 'white',
    fontFamily: typography.fontFamily.medium,
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
    fontSize: typography.fontSize.base,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: typography.fontSize['6xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
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
    fontSize: typography.fontSize.sm,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginLeft: 8,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
  },
  recentSection: {
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 16,
    letterSpacing: typography.letterSpacing.tight,
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
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.dark,
  },
  earningTime: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  earningAmount: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
});

export default Earnings;