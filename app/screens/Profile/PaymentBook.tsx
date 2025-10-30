import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../context/UserContext';
import { fetchUserPayments, Payment } from '../../services/PaymentServices'; // new service file
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { StackScreenProps } from '@react-navigation/stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type PaymentBookScreenProps = StackScreenProps<RootStackParamList, 'PaymentBook'>;

const PaymentBook = ({ navigation }: PaymentBookScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const { user, updateUserData } = useUser();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.uid;

  const loadPayments = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const fetchedPayments = await fetchUserPayments(userId);
        setPayments(fetchedPayments || []);
      } catch (e) {
        // optionally handle errors
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) loadPayments(false);
  }, [userId, loadPayments]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraScrollHeight={60}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadPayments(true)}
          tintColor={colors.text}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {/* Header */}
        <View>
          <View
            style={{
              zIndex: 1,
              height: 60,
              backgroundColor: COLORS.background,
              borderBottomColor: COLORS.card,
              borderBottomWidth: 1,
            }}
          >
            <View
              style={{
                height: '100%',
                backgroundColor: COLORS.background,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
                paddingHorizontal: 10,
              }}
            >
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{
                    height: 45,
                    width: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    size={30}
                    color={COLORS.black}
                    name="chevron-back-outline"
                  />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  style={{
                    width: 200,
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: COLORS.title,
                    textAlign: 'center',
                  }}
                >
                  Payment Book
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddPayment', { payment: null })}
                  style={{
                    height: 40,
                    width: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons size={30} color={COLORS.black} name="add" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Cards */}
        {payments.map((payment, index) => (
          <View key={payment.id ?? index} style={{ paddingHorizontal: 15, paddingTop: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                padding: 15,
                borderColor:
                  payment.id === user?.currentPayment?.id
                    ? COLORS.primary
                    : COLORS.blackLight,
                borderRadius: 10,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={async () => {
                if (userId) {
                  updateUserData(userId, { currentPayment: payment || undefined });
                }
              }}
            >
              <Ionicons
                name={'card-outline'}
                size={28}
                color={COLORS.black}
                style={{ margin: 5 }}
              />
              <View style={{ flex: 1, paddingLeft: 10 }}>
                {payment.id === user?.currentPayment?.id && (
                  <View
                    style={{
                      width: 60,
                      backgroundColor: COLORS.primary,
                      borderRadius: 5,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      Default
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: COLORS.title,
                  }}
                >
                  {payment.accountHolder}
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.black }}>
                  {payment.bankName} • {payment.accountNumber}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.text }}>
                  {payment.accountType === 'personal'
                    ? 'Personal Account'
                    : 'Business Account'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('AddPayment', { payment: payment })}
                style={{ padding: 0, borderRadius: 5 }}
              >
                <Ionicons
                  name={'pencil'}
                  size={20}
                  color={COLORS.black}
                  style={{ margin: 5 }}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        ))}

        {payments.length === 0 && !loading && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 50,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 14 }}>
              No payment accounts found.
            </Text>
            <Text style={{ color: COLORS.text, fontSize: 14 }}>
              Tap the + button to add one.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
};

export default PaymentBook;
