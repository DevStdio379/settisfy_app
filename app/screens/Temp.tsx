import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, TextInput } from 'react-native'
import React, { useState } from 'react'
import { COLORS } from '../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import axios from 'axios';
import { useStripe } from '@stripe/stripe-react-native';

type ChatScreenProps = StackScreenProps<RootStackParamList, 'Temp'>

export const Temp = ({ navigation }: ChatScreenProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [rentalId] = useState('rental_test2'); // Normally generated dynamically
  const [connectedAccountId] = useState('acct_1RiaVN4gRYsyHwtX'); // Replace with real lender ID
  const [amount] = useState(5000); // £50.00
  const [currency] = useState('GBP');
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const handleCreateAccount = async () => {
    try {
      const response = await axios.post(
        'https://us-central1-tags-1489a.cloudfunctions.net/api/create-connected-account',
        { email: 'user@example.com' }, // You should pass the actual logged-in user email
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { url } = response.data;

      if (url) {
        Linking.openURL(url); // opens Stripe onboarding link
      } else {
        Alert.alert('Error', 'No onboarding URL returned.');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to create Stripe account.');
    }
  };

  const handleHoldPayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        'https://us-central1-tags-1489a.cloudfunctions.net/api/hold-payment',
        {
          amount,
          currency,
          rentalId,
          lenderConnectedAccountId: connectedAccountId,
        }
      );

      const {
        paymentIntent,
        ephemeralKey,
        customer,
      } = response.data;

      const initResponse = await initPaymentSheet({
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        merchantDisplayName: 'BorrowUp',
      });

      if (initResponse.error) {
        Alert.alert('Error', initResponse.error.message);
        setLoading(false);
        return;
      }

      const result = await presentPaymentSheet();

      if (result.error) {
        Alert.alert('Payment Failed', result.error.message);
      } else {
        Alert.alert('Success', 'Payment completed. Funds are held by BorrowUp.');
      }
    } catch (error: any) {
      console.error('[Hold Payment Error]', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Hold payment failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        'https://us-central1-tags-1489a.cloudfunctions.net/api/release-to-lender',
        {
          amount,
          currency,
          connectedAccountId,
          rentalId,
        }
      );

      Alert.alert('Success', 'Funds released to Lender!');
    } catch (error: any) {
      console.error('[Release Transfer Error]', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!paymentIntentId || !refundAmount) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const amountInPence = Math.round(parseFloat(refundAmount) * 100);

      const response = await axios.post(
        'https://us-central1-tags-1489a.cloudfunctions.net/api/refund-deposit',
        {
          paymentIntentId,
          amountToRefundInPence: amountInPence,
        }
      );

      if (response.data.success) {
        Alert.alert('Success', `Refund of £${refundAmount} processed.`);
      } else {
        Alert.alert('Failed', 'Could not process the refund.');
      }
    } catch (error: any) {
      console.error('Refund error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Something went wrong.');
    }
  };


  return (
    <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
      <TouchableOpacity
        onPress={handleCreateAccount}
        style={{ padding: 10, marginLeft: 10, marginTop: 10 }}>
        <Text style={{ color: COLORS.black, fontSize: 16 }}>Create Stripe Account</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>
          Simulate Rental Payment Flow
        </Text>

        <TouchableOpacity
          onPress={handleHoldPayment}
          style={{ padding: 14, backgroundColor: '#4681f4', borderRadius: 8, marginBottom: 20 }}
        >
          <Text style={{ color: 'white' }}>1️⃣ Pay & Hold Funds</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReleasePayment}
          style={{ padding: 14, backgroundColor: '#4caf50', borderRadius: 8, marginBottom: 20 }}
        >
          <Text style={{ color: 'white' }}>2️⃣ Confirm Pickup (Release Payment)</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#999" />}
      </View>
      <View style={{ padding: 20, flex: 1, justifyContent: 'center', backgroundColor: '#F9F9F9' }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 20, color: '#000' }}>
          Refund Deposit Simulator
        </Text>

        <TextInput
          placeholder="PaymentIntent ID"
          value={paymentIntentId}
          onChangeText={setPaymentIntentId}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            backgroundColor: '#fff',
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
          }}
        />

        <TextInput
          placeholder="Refund Amount (£)"
          value={refundAmount}
          onChangeText={setRefundAmount}
          keyboardType="decimal-pad"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            backgroundColor: '#fff',
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
          }}
        />

        <TouchableOpacity
          onPress={handleRefund}
          style={{
            backgroundColor: '#007AFF',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Submit Refund
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Temp