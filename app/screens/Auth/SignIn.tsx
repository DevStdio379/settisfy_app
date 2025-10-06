import { View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react';
import { COLORS, SIZES } from '../../constants/theme'
import { GlobalStyleSheet } from '../../constants/StyleSheet'
import { useTheme } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/RootStackParamList'
import Input from '../../components/Input/Input'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../../services/firebaseConfig';
import { useUser } from '../../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SignInScreenProps = StackScreenProps<RootStackParamList, 'SignIn'>;

const SignIn = ({ navigation }: SignInScreenProps) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const { fetchUser, updateUserData } = useUser();

    const [isFocused, setisFocused] = useState(false);
    const [isFocused2, setisFocused2] = useState(false);

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;
            if (!user) throw new Error("Sign-in failed. Please try again.");

            // Ensure user data is fetched & updated before navigation
            await fetchUser(user.uid);
            await updateUserData(user.uid, { isActive: true });

            await AsyncStorage.setItem('userUID', user.uid);

            // Small delay helps React Navigation handle async stack changes smoothly
            setTimeout(() => {
            Alert.alert("Success!", "Signed in successfully.");
            navigation.reset({
                index: 0,
                routes: [{ name: 'BottomNavigation', params: { screen: 'Home' } }],
            });
            }, 300);
        } catch (error: any) {
            switch (error.code) {
            case "auth/invalid-email":
                Alert.alert("Error", "The email address is invalid.");
                break;
            case "auth/user-not-found":
                Alert.alert("Error", "No user found with this email.");
                break;
            case "auth/wrong-password":
                Alert.alert("Error", "Incorrect password.");
                break;
            default:
                Alert.alert("Error", error.message || "An error occurred.");
            }
        } finally {
            setLoading(false);
        }
        };


    return (
        <ScrollView style={{ backgroundColor: COLORS.background }} showsVerticalScrollIndicator={false}>
            <View style={[GlobalStyleSheet.container, { flexGrow: 1, paddingBottom: 0, paddingHorizontal: 30, paddingTop: 0 }]}>
                <View style={{ paddingTop: 80, marginBottom: 30 }}>
                    <Text style={{ color: colors.title, fontWeight: 'bold', fontSize: 30, marginBottom: 5 }}>Welcome back! Glad to see you, again!</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#8A8A8A' }}>Email</Text>
                <View style={{ marginBottom: 20, marginTop: 0 }}>
                    <Input
                        onFocus={() => setisFocused(true)}
                        onBlur={() => setisFocused(false)}
                        onChangeText={setEmail}
                        value={email ? email : ''}
                        isFocused={isFocused}
                    />
                </View>
                <Text style={{ fontSize: 14, color: '#8A8A8A' }}>Password</Text>
                <View style={{ marginBottom: 10, marginTop: 0 }}>
                    <Input
                        onFocus={() => setisFocused2(true)}
                        onBlur={() => setisFocused2(false)}
                        backround={colors.card}
                        onChangeText={setPassword}
                        isFocused={isFocused2}
                        value={password ? password : ''}
                        type={'password'}
                    />
                </View>
                <View style={{ marginTop: 30 }}>
                    <TouchableOpacity
                        onPress={() => handleSignIn()}
                        style={{ backgroundColor: COLORS.primary, borderRadius: 20, padding: 15, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Sign In</Text>
                    </TouchableOpacity>
                    <View
                        style={[GlobalStyleSheet.flex, {
                            marginBottom: 20,
                            marginTop: 10,
                            paddingHorizontal: 10,
                            justifyContent: 'flex-start',
                            gap: 5
                        }]}
                    >
                        <Text style={{ fontSize: 14, color: colors.title }}>Forgot Password?</Text>
                        <TouchableOpacity
                            activeOpacity={0.5}
                            onPress={() => navigation.navigate('SignIn')}
                        >
                            <Text style={{ fontSize: 14, color: COLORS.primary }}>Reset here</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                        <View style={{ flex: 1, height: 2, backgroundColor: '#ddd' }} />
                        <Text style={{ fontSize: 14, color: COLORS.title, marginHorizontal: 10 }}>Or Login with</Text>
                        <View style={{ flex: 1, height: 2, backgroundColor: '#ddd' }} />
                    </View>
                    <View style={{ alignItems: 'center', marginTop: 30 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <TouchableOpacity style={{ borderRadius: 10, padding: 10, borderColor: COLORS.blackLight, borderWidth: 2, alignItems: 'center', width: SIZES.width * 0.2, height: SIZES.height * 0.07, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginHorizontal: 10, backgroundColor: '#F6F6F6' }}
                                onPress={() => {
                                    setEmail('john.doe@gmail.com');
                                    setPassword('12345678');
                                }}>
                                {/* <Text>Ummi</Text> */}
                                <Ionicons name='logo-apple' size={24} color={COLORS.title} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ borderRadius: 10, padding: 10, borderColor: COLORS.blackLight, borderWidth: 2, alignItems: 'center', width: SIZES.width * 0.2, height: SIZES.height * 0.07, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginHorizontal: 10, backgroundColor: '#F6F6F6' }}
                                onPress={() => {
                                    setEmail('afiq.customer@gmail.com');
                                    setPassword('12345678');
                                }}>
                                <Ionicons name='logo-google' size={24} color={COLORS.title} />
                                {/* <Text>Afiq</Text> */}
                            </TouchableOpacity>
                            <TouchableOpacity style={{ borderRadius: 10, padding: 10, borderColor: COLORS.blackLight, borderWidth: 2, alignItems: 'center', width: SIZES.width * 0.2, height: SIZES.height * 0.07, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginHorizontal: 10, backgroundColor: '#F6F6F6' }}
                                onPress={() => {
                                    setEmail('afiq.settler@gmail.com');
                                    setPassword('12345678');
                                }}>
                                <Ionicons name='logo-facebook' size={24} color={COLORS.title} />
                                {/* <Text>Farizah</Text> */}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ marginBottom: 15, marginTop: 20, flexDirection: 'row', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, color: colors.title, textAlign: 'center', }}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.5}>
                            <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: 'bold' }}> Register Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {loading && (
                <View style={[GlobalStyleSheet.loadingOverlay, { height: SIZES.height }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </ScrollView>
    )
}

export default SignIn
