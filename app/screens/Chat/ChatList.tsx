import React, { useEffect, useState, useCallback } from 'react';
import { View, Button, FlatList, RefreshControl, TouchableOpacity, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { fetchAllUsers, User, useUser } from '../../context/UserContext';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { auth, db } from '../../services/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Avatar } from 'react-native-gifted-chat';
import { COLORS } from '../../constants/theme';
import { fetchSelectedProduct, Product } from '../../services/ProductServices';

type ChatListScreenProps = StackScreenProps<RootStackParamList, 'ChatList'>

export const ChatList = ({ navigation }: ChatListScreenProps) => {
    const { user } = useUser();
    const [chats, setChats] = useState<{ id: string; participants: string[]; otherParticipantDetails?: User; lastMessage?: string; product?: Product; updatedAt?: any; }[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsersByIds = async (userIds: string[]): Promise<User[]> => {
        const usersQuery = query(collection(db, "users"), where("uid", "in", userIds));
        const snapshot = await getDocs(usersQuery);
        return snapshot.docs.map((doc) => doc.data() as User);
    };

    const fetchChats = async () => {
        if (!auth.currentUser) return;
        const chatQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", auth.currentUser.uid)
        );

        const snapshot = await getDocs(chatQuery);
        const chatList = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                participants: data.participants || [],
                productId: data.productId || null,
                updatedAt: data.updatedAt || null,
                ...data,
            };
        });

        if (!user) return;
        const users = await fetchUsersByIds(chatList.map((chat) => chat.participants.find((uid: string) => uid !== user.uid)));
        const chatListWithOtherUserDetails = await Promise.all(chatList.map(async (chat) => {
            const otherParticipantId = chat.participants.find((uid: string) => uid !== user.uid);
            const otherParticipantDetails = users.find((user) => user.uid === otherParticipantId);
            let product: Product | undefined = undefined;
            if (chat.productId) {
                const fetchedProduct = await fetchSelectedProduct(chat.productId);
                product = fetchedProduct === null ? undefined : fetchedProduct;
            }
            return {
                ...chat,
                otherParticipantDetails,
                product
            };
        }));
        setChats(chatListWithOtherUserDetails);
    };

    useEffect(() => {
        fetchChats();
    }, []);

    if (!user || !user.isActive) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ marginVertical: 10, fontSize: 14 }}>User is not active. Please sign in.</Text>
                <TouchableOpacity
                    style={{ padding: 10, paddingHorizontal: 30, backgroundColor: COLORS.primary, borderRadius: 20 }}
                    onPress={() => navigation.navigate('SignIn')}
                >
                    <Text style={{ color: COLORS.white, fontSize: 16 }}>Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchChats().then(() => setRefreshing(false));
    }, []);

    return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
            <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                <View
                    style={[GlobalStyleSheet.container, {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        paddingHorizontal: 5,
                    }]}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        {/* left header element */}
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Chat</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {/* right header element */}
                    </View>
                </View>
            </View>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Chat", { chatId: item.id })}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}
                    >
                        <Image source={{ uri: item.product?.imageUrls[0] }} style={{ height: 60, width: 60, borderRadius: 45 }} />
                        <View style={{ marginLeft: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.otherParticipantDetails?.firstName} {item.otherParticipantDetails?.lastName}</Text>
                            <Text style={{ color: '#888' }}>{item.lastMessage || 'Last message preview...'}</Text>
                            <Text>{item.updatedAt?.toDate().toLocaleString() || 'Unknown date'}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            {/* <Button title="Start New Chat" onPress={() => navigation.navigate("NewChat")} /> */}
        </View>
    );
};

export default ChatList;