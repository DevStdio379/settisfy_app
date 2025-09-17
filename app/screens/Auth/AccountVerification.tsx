import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { auth } from '../../services/firebaseConfig';
import { sendEmailVerification } from 'firebase/auth';
import { useUser } from '../../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

type AccountVerificationScreenProps = StackScreenProps<RootStackParamList, 'AccountVerification'>;

const AccountVerification = ({ navigation }: AccountVerificationScreenProps) => {
  const [loading, setLoading] = useState(false);
  const { updateUserData } = useUser();
  const [resendCountdown, setResendCountdown] = useState(60); // Initialize countdown to 60 seconds
  const user = auth.currentUser;

  const checkEmailVerification = async () => {
    try {
      setLoading(true);
      await user?.reload(); // refresh user object
      if (user?.emailVerified) {
        updateUserData(user.uid, { 'isVerified': true });
        Alert.alert("Success", "Your email is verified.");
        if (navigation.canGoBack() && navigation.getState().routes[navigation.getState().index - 1]?.name === 'SignUp') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomNavigation', params: { screen: 'HomeStack' } }],
          });
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert("Still Not Verified", "Please check your email and try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not check verification status.");
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      setLoading(true);
      if (user) {
        await sendEmailVerification(user);
      } else {
        throw new Error("User is not logged in.");
      }
      Alert.alert("Email Sent", "Please check your inbox (or spam folder).");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send email.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  return (
    <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
      <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            {/* left header element */}
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>Verify Your Email</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => {
                console.log(navigation.getState().routes.map(route => route.name));
                if (navigation.canGoBack() && navigation.getState().routes[navigation.getState().index - 1]?.name === 'SignUp') {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'BottomNavigation', params: { screen: 'HomeStack' } }],
                  });
                } else {
                  navigation.goBack();
                }
              }}
              style={{
                height: 45, width: 45, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons size={30} color={COLORS.black} name='close-outline' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', fontSize: 16, color: COLORS.text, marginBottom: 30 }}>
          A verification link has been sent to:
          {'\n'}
          <Text style={{ fontWeight: '600' }}>{user?.email}</Text>
          {'\n\n'}
          Please verify your email.{'\n'}Then "Check Account Verification".
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                {resendCountdown > 0 ? (
                  <Text style={{ color: COLORS.text, marginBottom: 15 }}>
                    You can resend the email in {resendCountdown} seconds.
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      resendEmail();
                      setResendCountdown(60); // Reset the timer to 60 seconds
                    }}
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 10,
                      marginBottom: 15,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Re-Send Verification Email</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={checkEmailVerification}
                  style={{
                    borderColor: COLORS.primary,
                    borderWidth: 2,
                    paddingVertical: 12,
                    paddingHorizontal: 30,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>Check Account Verification</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default AccountVerification;
