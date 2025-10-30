import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../context/UserContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import {
  saveCompanyInfo,
  updateCompanyInfo,
  deleteCompanyInfo,
  fetchCompanyInfo,
} from '../../services/CompanyServices';

type CompanyInformationScreenProps = StackScreenProps<RootStackParamList, 'CompanyInformation'>;

const CompanyInformation = ({ navigation }: CompanyInformationScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const { user } = useUser();

  const [company, setCompany] = useState<any | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [businessRegNo, setBusinessRegNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch company info when screen loads
  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!user?.uid) return;
      try {
        setFetching(true);
        const data = await fetchCompanyInfo(user.uid);
        if (data) {
          setCompany(data);
          setCompanyName(data.companyName || '');
          setCompanyAddress(data.companyAddress || '');
          setCompanyEmail(data.companyEmail || '');
          setCompanyPhone(data.companyPhone || '');
          setBusinessRegNo(data.businessRegNo || '');
        } else {
          // No record yet — leave empty
          setCompany(null);
          setCompanyName('');
          setCompanyAddress('');
          setCompanyEmail('');
          setCompanyPhone('');
          setBusinessRegNo('');
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
        Alert.alert('Error', 'Failed to load company information.');
      } finally {
        setFetching(false);
      }
    };

    loadCompanyInfo();
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!companyName || !companyAddress || !companyEmail || !companyPhone || !businessRegNo) {
      Alert.alert('Incomplete Information', 'Please fill in all fields before submitting.');
      return;
    }

    setLoading(true);
    try {
      if (company) {
        await updateCompanyInfo(user!.uid, company.id!, {
          companyName,
          companyAddress,
          companyEmail,
          companyPhone,
          businessRegNo,
          updatedAt: new Date(),
        });
        Alert.alert('Success', 'Company information updated successfully.');
      } else {
        await saveCompanyInfo(user!.uid, {
          companyName,
          companyAddress,
          companyEmail,
          companyPhone,
          businessRegNo,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        Alert.alert('Success', 'Company information saved successfully.');
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error saving company info:', err);
      Alert.alert('Error', 'Failed to save company information.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!company) return;

    Alert.alert(
      'Delete Company Information',
      'Are you sure you want to delete this company record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteCompanyInfo(user!.uid, company.id!);
              Alert.alert('Deleted', 'Company information deleted successfully.');
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete company info', err);
              Alert.alert('Error', 'Failed to delete company information. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (fetching) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.text }}>Loading company information...</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons size={30} color={COLORS.black} name="chevron-back-outline" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Information</Text>
          {company ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.backButton, { opacity: loading ? 0.6 : 1 }]}
              disabled={loading}
              accessibilityLabel="Delete company information"
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
      <ScrollView
        contentContainerStyle={{
          width: SIZES.width,
          paddingHorizontal: 20,
          paddingTop: 40,
          paddingBottom: 260,
        }}
      >
        <Text style={styles.infoText}>
          Please provide your company details for business verification and contact purposes.
        </Text>

        {/* Company Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            editable={!loading}
            style={styles.input}
            placeholder="Enter your company name"
            placeholderTextColor="#888"
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>

        {/* Company Address */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Company Address</Text>
          <TextInput
            editable={!loading}
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            placeholder="Enter your company address"
            placeholderTextColor="#888"
            value={companyAddress}
            onChangeText={setCompanyAddress}
            multiline
            numberOfLines={4}
            scrollEnabled
          />
        </View>

        {/* Company Email */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Company Email</Text>
          <TextInput
            editable={!loading}
            style={styles.input}
            placeholder="Enter your company email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={companyEmail}
            onChangeText={setCompanyEmail}
          />
        </View>

        {/* Company Phone Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Company Phone Number</Text>
          <TextInput
            editable={!loading}
            style={styles.input}
            placeholder="Enter your company phone number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={companyPhone}
            onChangeText={setCompanyPhone}
          />
        </View>

        {/* Business Registration Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Registration Number</Text>
          <TextInput
            editable={!loading}
            style={styles.input}
            placeholder="Enter your registration number"
            placeholderTextColor="#888"
            value={businessRegNo}
            onChangeText={setBusinessRegNo}
          />
        </View>

        <TouchableOpacity
          disabled={loading}
          style={[styles.submitButton, loading ? { opacity: 0.6 } : {}]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {loading ? (company ? 'Updating...' : 'Saving...') : company ? 'Update Company Info' : 'Save Company Info'}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CompanyInformation;
