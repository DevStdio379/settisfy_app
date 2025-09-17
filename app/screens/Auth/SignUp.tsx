import { View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { COLORS, SIZES } from '../../constants/theme'
import { GlobalStyleSheet } from '../../constants/StyleSheet'
import { useTheme } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/RootStackParamList'
import Input from '../../components/Input/Input'

import { useUser, User } from '../../context/UserContext'
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth } from '../../services/firebaseConfig'

type SignUpScreenProps = StackScreenProps<RootStackParamList, 'SignUp'>;

const SignUp = ({ navigation }: SignUpScreenProps) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const [isFocused, setisFocused] = useState(false);
    const [isFocused2, setisFocused2] = useState(false);
    const [isFocused3, setisFocused3] = useState(false);
    const [isFocused4, setisFocused4] = useState(false);
    const [isFocused5, setisFocused5] = useState(false);

    const { createUser } = useUser();
    const [username, setUserName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');

    const [loading, setLoading] = useState(false);

    // sign up with email and password
    const handleSignUp = async () => {
        setLoading(true);
        try {
            // Create user with email & password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send email verification
            await sendEmailVerification(user);

            const userData: User = {
                uid: user.uid,
                email: user.email || '',
                userName: username,
                isActive: true,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: '',
                accountType: 'borrower',
                isVerified: false,
                createAt: new Date(),
                updatedAt: new Date(),
                memberFor: '',
            };

            // Save user in Firestore
            await createUser(userData);

            Alert.alert(
                "Verify Your Email",
                "A verification email has been sent. Please check your inbox before logging in.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate('AccountVerification'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <ScrollView style={{ backgroundColor: COLORS.background }} showsVerticalScrollIndicator={false}>
            <View style={[GlobalStyleSheet.container, { flexGrow: 1, paddingBottom: 0, paddingHorizontal: 30, paddingTop: 0 }]}>
                <View style={{ paddingTop: 50, marginBottom: 30 }}>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: 26, color: COLORS.title, marginBottom: 5, fontWeight: 'bold' }}>Hello! Register to get {'\n'}started</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ fontSize: 14, color: '#8A8A8A' }}>First Name</Text>
                            <Input
                                onFocus={() => setisFocused4(true)}
                                onBlur={() => setisFocused4(false)}
                                onChangeText={setFirstName}
                                isFocused={isFocused4}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={{ fontSize: 14, color: '#8A8A8A' }}>Last Name</Text>
                            <Input
                                onFocus={() => setisFocused5(true)}
                                onBlur={() => setisFocused5(false)}
                                onChangeText={setLastName}
                                isFocused={isFocused5}
                            />
                        </View>
                    </View>
                    <View style={[GlobalStyleSheet.container, { padding: 0 }]}>
                        <Text style={{ fontSize: 14, color: '#8A8A8A' }}>Username</Text>
                    </View>
                    <View style={{ marginBottom: 20, marginTop: 0 }}>
                        <Input
                            onFocus={() => setisFocused(true)}
                            onBlur={() => setisFocused(false)}
                            onChangeText={setUserName}
                            isFocused={isFocused}
                        />
                    </View>
                    <View style={[GlobalStyleSheet.container, { padding: 0 }]}>
                        <Text style={{ fontSize: 14, color: '#8A8A8A' }}>Email</Text>
                    </View>
                    <View style={{ marginBottom: 20, marginTop: 0 }}>
                        <Input
                            onFocus={() => setisFocused2(true)}
                            onBlur={() => setisFocused2(false)}
                            backround={colors.card}
                            onChangeText={setEmail}
                            isFocused={isFocused2}
                        />
                    </View>
                    <View style={[GlobalStyleSheet.container, { padding: 0 }]}>
                        <Text style={{ fontSize: 14, color: '#8A8A8A' }}>Password</Text>
                    </View>
                    <View style={{ marginBottom: 10, marginTop: 0 }}>
                        <Input
                            onFocus={() => setisFocused3(true)}
                            onBlur={() => setisFocused3(false)}
                            backround={colors.card}
                            onChangeText={setPassword}
                            isFocused={isFocused3}
                            type={'password'}
                        />
                    </View>
                </View>
                <View>
                    <TouchableOpacity
                        onPress={() => handleSignUp()}
                        style={{ backgroundColor: COLORS.primary, borderRadius: 20, padding: 15, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Register</Text>
                    </TouchableOpacity>
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 14, color: theme.dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'center' }}>By tapping “Sign Up” you accept our <Text style={{ marginBottom: 5, fontSize: 14, color: COLORS.primary }}>terms</Text> and <Text style={{ marginBottom: 5, fontSize: 14, color: COLORS.primary }}>condition</Text></Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                    <View style={{ flex: 1, height: 2, backgroundColor: '#ddd' }} />
                    <Text style={{ marginHorizontal: 10, fontSize: 16, color: '#666' }}>Or Register with</Text>
                    <View style={{ flex: 1, height: 2, backgroundColor: '#ddd' }} />
                </View>
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <TouchableOpacity style={{ borderRadius: 10, padding: 10, borderColor: COLORS.blackLight, borderWidth: 2, alignItems: 'center', width: SIZES.width * 0.2, height: SIZES.height * 0.07, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginHorizontal: 10, backgroundColor: '#F6F6F6' }}
                                onPress={() => {
                                    // setEmail('kuhai@gmail.com');
                                    // setPassword('12345678');
                                }}>
                                <Ionicons name='logo-facebook' size={24} color={COLORS.title} />
                                {/* <Text>Kuhai</Text> */}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ borderRadius: 10, padding: 10, borderColor: COLORS.blackLight, borderWidth: 2, alignItems: 'center', width: SIZES.width * 0.2, height: SIZES.height * 0.07, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginHorizontal: 10, backgroundColor: '#F6F6F6' }}
                                onPress={() => {
                                    // setEmail('dinie@gmail.com');
                                    // setPassword('12345678');
                                }}>
                                {/* <Text>Dinie</Text> */}
                                <Ionicons name='logo-google' size={24} color={COLORS.title} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ borderRadius: 10, padding: 10, borderColor: COLORS.blackLight, borderWidth: 2, alignItems: 'center', width: SIZES.width * 0.2, height: SIZES.height * 0.07, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginHorizontal: 10, backgroundColor: '#F6F6F6' }}
                                onPress={() => {
                                    // setEmail('razzin@gmail.com');
                                    // setPassword('12345678');
                                }}>
                                {/* <Text>Razzin</Text> */}
                                <Ionicons name='logo-apple' size={24} color={COLORS.title} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
            <View style={{ marginBottom: 15, marginTop: 20, flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={{ color: colors.title, fontSize: 16, textAlign: 'center' }}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.5}>
                    <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: 'bold' }}> Login Now</Text>
                </TouchableOpacity>
            </View>
            {loading && (
                <View style={[GlobalStyleSheet.loadingOverlay, { height: SIZES.height }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </ScrollView>
    )
}

export default SignUp
