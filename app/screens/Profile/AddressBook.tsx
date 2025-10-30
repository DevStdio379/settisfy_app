import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { useTheme } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { COLORS } from '../../constants/theme'
import { useUser } from '../../context/UserContext'
import { fetchUserAddresses, Address } from '../../services/AddressServices'
import { RootStackParamList } from '../../navigation/RootStackParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

type AddressBookScreenProps = StackScreenProps<RootStackParamList, 'AddressBook'>

const AddressBook = ({ navigation }: AddressBookScreenProps) => {
  const theme = useTheme()
  const { colors }: { colors: any } = theme
  const { user, updateUserData } = useUser()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const userId = user?.uid

  const getAddresses = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const fetchedAddresses = await fetchUserAddresses(userId)
      setAddresses(fetchedAddresses)
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) getAddresses()
  }, [userId])

  // ✅ Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await getAddresses()
    setRefreshing(false)
  }, [userId])

  return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {/* Header */}
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
                  name='chevron-back-outline'
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
                Address Book
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchAddress')}
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons size={30} color={COLORS.black} name='add' />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
        {/* Address List */}
        {addresses.length === 0 && !loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 100,
            }}
          >
            <Text style={{ color: COLORS.blackLight, fontSize: 16 }}>
              No addresses found.
            </Text>
          </View>
        ) : (
          addresses.map((address, index) => (
            <View key={index} style={{ paddingHorizontal: 15, paddingTop: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  padding: 15,
                  borderColor:
                    address.id === user?.currentAddress?.id
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
                    updateUserData(userId, { currentAddress: address || undefined })
                  }
                }}
              >
                <Ionicons
                  name={'location'}
                  size={30}
                  color={COLORS.black}
                  style={{ margin: 5 }}
                />
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  {address.id === user?.currentAddress?.id && (
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
                    {address.addressName}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.black }}>
                    {address.address}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('AddAddress', {
                      latitude: address.latitude,
                      longitude: address.longitude,
                      addressName: address.addressName,
                      address: address.address,
                      postcode: address.postcode,
                      isEditMode: true,
                      addressInfo: address,
                    })
                  }
                  style={{ padding: 0, borderRadius: 5 }}
                >
                  <Ionicons
                    name={'chevron-forward'}
                    size={25}
                    color={COLORS.black}
                    style={{ margin: 5 }}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ))
        )}
        </ScrollView>
      </View>
  )
}

export default AddressBook
