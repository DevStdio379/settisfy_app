import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator, Animated } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES } from "../../constants/theme";
import { GlobalStyleSheet } from "../../constants/StyleSheet";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/RootStackParamList";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSelectedUser, User, useUser } from "../../context/UserContext";
import { fetchLendingsByUser } from "../../services/BorrowingServices";
import { Booking, fetchBookingsAsSettler, fetchBookingsByUser, subscribeToBookings } from "../../services/BookingServices";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";


type MyRequestsScreenProps = StackScreenProps<RootStackParamList, 'MyRequests'>;

const MyRequests = ({ navigation, route }: MyRequestsScreenProps) => {

  const { user } = useUser();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [inactiveJobs, setInactiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewHome = useRef<any>(null);
  const buttons = ['Active', 'Broadcast', 'History'];
  const scrollX = useRef(new Animated.Value(0)).current;
  const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchData = async () => {
    if (user?.uid) {
      const setRequestsData = await fetchBookingsAsSettler(user.uid);
      const activeJobs = setRequestsData.filter(booking => booking.status <= 5 || (booking.status > 6 && booking.status < 10) );
      const inactiveJobs = setRequestsData.filter(booking => booking.status === 10 && booking.settlerId === user.uid);
      setActiveJobs(activeJobs);
      setInactiveJobs(inactiveJobs);
    }
    setLoading(false);
  };

  const [jobs, setJobs] = useState<Booking[]>([]);

  useEffect(() => {

    const q = query(collection(db, "bookings"), where("status", "==", 0));
    const unsubJobs = onSnapshot(q, (snap) => {
      const allBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      const filtered = allBookings.filter(job =>
        user?.activeJobs?.some(active => active.catalogueId === job.catalogueService.id)
      );

      setJobs(filtered);
    });

    return () => {
      unsubJobs();
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
      <View style={{ height: 80, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            {/* left header element */}
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Job Broadcast</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {/* right header element */}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {buttons.map((btn: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', width: SIZES.width * 0.33, paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                style={{ width: '100%', justifyContent: 'center', alignItems: 'center', }}
                onPress={() => {
                  setActiveIndex(i);
                  if (onCLick) {
                    onCLick(i);
                  }
                }}
              >
                <Text style={{ color: COLORS.text, paddingBottom: 5, }}>{btn}</Text>
                {activeIndex === i && <View style={{ height: 3, width: '100%', backgroundColor: 'black' }} />}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        ref={scrollViewHome}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        scrollEnabled={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      >
        {buttons.map((button, index) => (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: SIZES.width, paddingTop: 10 }}
            key={index}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={{}}>
              {index === 0 && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                >
                  <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40, paddingTop: 10 }]}>
                    <View>
                      {
                        activeJobs.map((data: any, index) => (
                          <View style={{ marginVertical: 5, height: 100 }} key={index}>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('MyRequestDetails', { booking: data })}
                              style={{
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.blackLight,
                                backgroundColor: COLORS.card,
                              }}>
                              <View style={[GlobalStyleSheet.flexcenter, { justifyContent: 'flex-start' }]}>
                                {data.catalogueService.imageUrls && data.catalogueService.imageUrls.length > 0 ? (
                                  <View style={{ width: '30%' }}>
                                    <Image
                                      style={{ height: '100%', width: '100%', resizeMode: 'cover', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
                                      source={{ uri: data.catalogueService.imageUrls[0] }}
                                    />
                                  </View>
                                ) : (
                                  <View style={{ width: '30%', height: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name={'image-outline'} size={30} color={COLORS.black} style={{ opacity: .5 }} />
                                  </View>
                                )}
                                <View style={{ width: '70%', padding: 10 }}>
                                  <Text style={{ fontSize: 12, color: COLORS.black, opacity: .5 }}>{data.id}</Text>
                                  <Text numberOfLines={1} style={{ fontSize: 16, color: COLORS.black, fontWeight: 'bold' }}>{data.catalogueService.title}</Text>
                                  <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5 }}>for {data.firstName} {data.lastName}</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </View>
                        ))
                      }
                    </View>
                  </View>
                </ScrollView>
              )}
              {index === 1 && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                >
                  <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40, paddingTop: 10 }]}>
                    <View>
                      {
                        jobs.map((data: any, index) => (
                          <View style={{ marginVertical: 5, height: 100 }} key={index}>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('MyRequestDetails', { booking: data })}
                              style={{
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.blackLight,
                                backgroundColor: COLORS.card,
                              }}>
                              <View style={[GlobalStyleSheet.flexcenter, { justifyContent: 'flex-start' }]}>
                                {data.catalogueService.imageUrls && data.catalogueService.imageUrls.length > 0 ? (
                                  <View style={{ width: '30%' }}>
                                    <Image
                                      style={{ height: '100%', width: '100%', resizeMode: 'cover', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
                                      source={{ uri: data.catalogueService.imageUrls[0] }}
                                    />
                                  </View>
                                ) : (
                                  <View style={{ width: '30%', height: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name={'image-outline'} size={30} color={COLORS.black} style={{ opacity: .5 }} />
                                  </View>
                                )}
                                <View style={{ width: '70%', padding: 10 }}>
                                  <Text numberOfLines={1} style={{ fontSize: 16, color: COLORS.black, fontWeight: 'bold' }}>{data.catalogueService.title}</Text>
                                  <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5 }}>requested by {data.firstName} {data.lastName}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14 }}>{new Date(data.selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}, {new Date(data.selectedDate).toLocaleDateString('en-GB', { weekday: 'long' })}</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </View>
                        ))
                      }
                    </View>
                  </View>
                </ScrollView>
              )}
              {index === 2 && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                >
                  <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40, paddingTop: 10 }]}>
                    <View>
                      {
                        inactiveJobs.map((data: any, index) => (
                          <View style={{ marginVertical: 5, height: 100 }} key={index}>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('MyRequestDetails', { booking: data })}
                              style={{
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.blackLight,
                                backgroundColor: COLORS.card,
                              }}>
                              <View style={[GlobalStyleSheet.flexcenter, { justifyContent: 'flex-start' }]}>
                                {data.catalogueService.imageUrls && data.catalogueService.imageUrls.length > 0 ? (
                                  <View style={{ width: '30%' }}>
                                    <Image
                                      style={{ height: '100%', width: '100%', resizeMode: 'cover', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
                                      source={{ uri: data.catalogueService.imageUrls[0] }}
                                    />
                                  </View>
                                ) : (
                                  <View style={{ width: '30%', height: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name={'image-outline'} size={30} color={COLORS.black} style={{ opacity: .5 }} />
                                  </View>
                                )}
                                <View style={{ width: '70%', padding: 10 }}>
                                  <Text numberOfLines={1} style={{ fontSize: 16, color: COLORS.black, fontWeight: 'bold' }}>{data.catalogueService.title}</Text>
                                  <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5 }}>requested by {data.firstName} {data.lastName}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14 }}>{new Date(data.selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}, {new Date(data.selectedDate).toLocaleDateString('en-GB', { weekday: 'long' })}</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </View>
                        ))
                      }
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </ScrollView>
        ))}
      </ScrollView>
    </View>
  )
};
export default MyRequests;
