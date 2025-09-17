import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { fetchAllUsers, User, useUser } from '../../context/UserContext';
import { getOrCreateChat } from '../../services/ChatServices';


type NewChatScreenProps = StackScreenProps<RootStackParamList, 'NewChat'>

export const NewChat = ({ navigation }: NewChatScreenProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  const handleChat = async (otherUser: User) => {
    if (user) {
      const chatId = await getOrCreateChat(user, otherUser);
      if (chatId) {
        navigation.navigate("Chat", { chatId: chatId });
      }
    }
  };

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.uid}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleChat(item)}>
          <View style={{ padding: 16, borderBottomWidth: 1 }}>
            <Text>{item.firstName} {item.lastName}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

export default NewChat