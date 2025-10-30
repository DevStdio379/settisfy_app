import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { useTheme } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../context/UserContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { deleteUserPayment, saveUserPayment, updateUserPayment } from '../../services/PaymentServices';

type AddPaymentScreenProps = StackScreenProps<RootStackParamList, 'AddPayment'>;

const AddPayment = ({ navigation, route }: AddPaymentScreenProps) => {

    const { payment } = route.params;
    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const { user } = useUser();

    const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
    const [fullName, setFullName] = useState('');
    const [issuingBank, setIssuingBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (payment) {
            setAccountType(payment.accountType);
            setFullName(payment.accountHolder);
            setIssuingBank(payment.bankName);
            setAccountNumber(payment.accountNumber);
        }
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        if (!fullName || !issuingBank || !accountNumber) {
            Alert.alert('Incomplete Information', 'Please fill in all the fields before submitting.');
            setLoading(false);
            return;
        }

        
        if (payment) {
            await updateUserPayment(user!.uid, payment.id!, {
                id: payment.id,
                accountHolder: fullName,
                bankName: issuingBank,
                accountNumber: accountNumber,
                accountType: accountType,
                createdAt: payment.createdAt,
                updatedAt: new Date(),
            });
            Alert.alert('Success', 'Payment details updated successfully.');
        } else {
            await saveUserPayment(user!.uid, {
                accountHolder: fullName,
                bankName: issuingBank,
                accountNumber: accountNumber,
                accountType: accountType,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            Alert.alert('Success', 'Payment details saved successfully.');
        }
        navigation.goBack();
    };

    const handleDelete = () => {
        if (!payment) return;

        Alert.alert(
            'Delete Bank Details',
            'Are you sure you want to delete these bank details? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            // Make sure you have a deleteUserPayment function exported from your services.
                            await deleteUserPayment(user!.uid, payment.id!);
                            Alert.alert('Deleted', 'Payment details deleted successfully.');
                            navigation.goBack();
                        } catch (err) {
                            console.error('Failed to delete payment', err);
                            Alert.alert('Error', 'Failed to delete payment details. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bank Details</Text>
                    {payment ? (
                        <TouchableOpacity
                            onPress={handleDelete}
                            style={[styles.backButton, { opacity: loading ? 0.6 : 1 }]}
                            disabled={loading}
                            accessibilityLabel="Delete bank details"
                            accessibilityRole="button"
                        >
                            <Ionicons name="trash-outline" size={30} color="#ff3b30" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
            </View>

            {/* Form */}
            <ScrollView contentContainerStyle={{ width: SIZES.width, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 60 }}>
                <Text style={styles.infoText}>
                    Please provide your bank details for online transfer purposes. Ensure that the information is accurate.
                </Text>

                {/* Account Type */}
                <View style={{ marginBottom: 25 }}>
                    <Text style={styles.label}>Account Type</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() => setAccountType('personal')}
                        >
                            <View style={[styles.radioCircle, accountType === 'personal' && styles.radioSelected]} />
                            <Text style={styles.radioLabel}>Personal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() => setAccountType('business')}
                        >
                            <View style={[styles.radioCircle, accountType === 'business' && styles.radioSelected]} />
                            <Text style={styles.radioLabel}>Business</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Full Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>{accountType === 'personal' ? 'Full Name' : 'Business Name'}</Text>
                    <TextInput
                        editable={!loading}
                        style={styles.input}
                        placeholder={accountType === 'personal' ? "Enter your full name" : "Enter your business name"}
                        placeholderTextColor="#888"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                {/* Issuing Bank */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Issuing Bank</Text>
                    <TextInput
                        editable={!loading}
                        style={styles.input}
                        placeholder="Enter your bank name"
                        placeholderTextColor="#888"
                        value={issuingBank}
                        onChangeText={setIssuingBank}
                    />
                </View>

                {/* Account Number */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput
                        editable={!loading}
                        style={styles.input}
                        placeholder="Enter your account number"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                    />
                </View>

                <TouchableOpacity
                    disabled={loading}
                    style={[styles.submitButton, loading ? { opacity: 0.6 } : {}]}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>{loading ? (payment ? "Updating..." : "Saving...") : (payment ? "Update Bank Details" : "Save Bank Details")}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        zIndex: 1,
        height: 60,
        backgroundColor: COLORS.background,
        borderBottomColor: COLORS.card,
        borderBottomWidth: 1,
    },
    headerRow: {
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: 8,
    },
    backButton: {
        height: 40,
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.title,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        color: COLORS.title,
        marginBottom: 8,
    },
    formGroup: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 20,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginRight: 8,
    },
    radioSelected: {
        backgroundColor: COLORS.primary,
    },
    radioLabel: {
        fontSize: 15,
        color: COLORS.text,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddPayment;
