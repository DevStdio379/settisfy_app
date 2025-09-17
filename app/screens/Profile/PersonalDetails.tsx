import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native'
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { StackScreenProps } from '@react-navigation/stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

type PersonalDetailsScreenProps = StackScreenProps<RootStackParamList, 'PersonalDetails'>;

const PersonalDetails = ({ navigation }: PersonalDetailsScreenProps) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const { user, updateUserData } = useUser();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        setSelectedImage(user?.profileImageUrl ?? null);
    }, []);

    const selectImage = async () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('Image picker error: ', response.errorMessage);
            } else {
                let imageUri = response.assets?.[0]?.uri;
                setSelectedImage(imageUri ?? null);
                console.log('Image URI: ', imageUri);
                if (user) {
                    await updateUserData(user.uid, { profileImageUrl: imageUri || 'undefined' });
                }
            }
        });
    };

    const takePhoto = async () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchCamera(options, async (response: any) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
            } else {
                let imageUri = response.assets?.[0]?.uri;
                setSelectedImage(imageUri);
                console.log('Image URI: ', imageUri);
                if (user?.uid) {
                    await updateUserData(user.uid, { profileImageUrl: imageUri || 'undefined' }); // Update the user profile image
                }
            }
        });
    };

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                height: 45, width: 45, alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
                        </TouchableOpacity>
                    </View>
                    <View >
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', }}>Personal Details</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {/* right header element */}
                    </View>
                </View>
            </View>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 15, marginBottom: 50 }}>
                <View style={{ backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : colors.background, marginTop: 10, borderRadius: 15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                        <View style={{}}>
                            <View
                                style={{
                                    height: 80,
                                    width: 80,
                                    borderRadius: 40,
                                    backgroundColor: COLORS.primary,
                                    overflow: 'hidden',
                                    marginRight: 20,
                                }}
                            >
                                {user?.profileImageUrl ? (
                                    <Image source={{ uri: user?.profileImageUrl }} style={{ height: '100%', width: '100%' }} />
                                ) : (
                                    <View style={{ height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.card }} >
                                        <Ionicons name="person-outline" size={40} color={COLORS.blackLight} />
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    Alert.alert(
                                        'Select Image',
                                        'Choose an option',
                                        [
                                            { text: 'Camera', onPress: () => takePhoto() },
                                            { text: 'Gallery', onPress: () => selectImage() },
                                            { text: 'Cancel', style: 'cancel' }
                                        ]
                                    );
                                }}
                                style={{
                                    height: 30,
                                    width: 30,
                                    borderRadius: 40,
                                    backgroundColor: COLORS.card,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 60
                                }}
                            >
                                <View style={{ height: 30, width: 30, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
                                    <Ionicons name="pencil-outline" size={13} color={COLORS.white} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View>
                            <Text style={[{ fontSize: 19, color: colors.title }]}>{user?.firstName} {user?.lastName}</Text>
                            <Text style={[{ fontSize: 12, color: colors.text, marginTop: 5 }]}>UID: {user?.uid}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                <View
                                    style={{
                                        height: 7,
                                        width: 7,
                                        borderRadius: 5,
                                        backgroundColor: user?.isActive ? COLORS.success : COLORS.danger,
                                        marginRight: 5,
                                    }}
                                />
                                <Text style={[{ fontSize: 13, color: colors.text }]}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={{ marginTop: 10, paddingVertical: 10, borderRadius: 15 }}>
                    <View style={{ marginBottom: 15, marginTop: 10 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('EditAttributes', { profileAttribute: { attributeName: 'username' } })}>
                            <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>Username</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>{user?.userName ? user?.userName : 'Unregistered'}</Text>
                                    <Ionicons name="chevron-forward-outline" size={24} color={colors.title} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('EditAttributes', { profileAttribute: { attributeName: 'firstName' } })}>
                            <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>First Name</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={{ fontSize: 16, color: user?.firstName ? COLORS.title : COLORS.blackLight, fontWeight: 'bold' }}>{user?.firstName ? user?.firstName : 'Add your first name'}</Text>
                                    <Ionicons name="chevron-forward-outline" size={24} color={user?.firstName ? COLORS.title : COLORS.blackLight} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('EditAttributes', { profileAttribute: { attributeName: 'lastName' } })}>
                            <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>Last Name</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={{ fontSize: 16, color: user?.lastName ? COLORS.title : COLORS.blackLight, fontWeight: 'bold' }}>{user?.lastName ? user?.lastName : 'Add your last name'}</Text>
                                    <Ionicons name="chevron-forward-outline" size={24} color={user?.lastName ? COLORS.title : COLORS.blackLight} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('EditAttributes', { profileAttribute: { attributeName: 'email' } })}>
                            <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>Email</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={{ fontSize: 16, color: user?.email ? COLORS.title : COLORS.blackLight, fontWeight: 'bold' }}>{user?.email ? user?.email : 'Unregistered'}</Text>
                                    <Ionicons name="chevron-forward-outline" size={24} color={user?.email ? COLORS.title : COLORS.blackLight} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        {user?.isVerified && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {}}>
                                <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                    <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>Account Status</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Text style={{ fontSize: 16, color: COLORS.blackLight, fontWeight: 'bold' }}>Verified</Text>
                                        <Ionicons name="checkmark-outline" size={24} color={COLORS.blackLight} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        {!user?.isVerified && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('AccountVerification')}>
                                <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                    <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>Account Status</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Text style={{ fontSize: 16, color: COLORS.blackLight, fontWeight: 'bold' }}>Not Verified</Text>
                                        <Ionicons name="chevron-forward-outline" size={24} color={COLORS.blackLight} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('EditAttributes', { profileAttribute: { attributeName: 'phoneNumber' } })}>
                            <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold' }}>Phone Number</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={{ fontSize: 16, color: user?.phoneNumber ? COLORS.title : COLORS.blackLight, fontWeight: 'bold' }}>{user?.phoneNumber ? user?.phoneNumber : 'Add your phone number'}</Text>
                                    <Ionicons name="chevron-forward-outline" size={24} color={user?.phoneNumber ? COLORS.title : COLORS.blackLight} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

export default PersonalDetails