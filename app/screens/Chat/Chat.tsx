import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../services/firebaseConfig';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { View } from 'react-native';
import { COLORS } from '../../constants/theme';

type ChatScreenProps = StackScreenProps<RootStackParamList, 'Chat'>;

export const Chat = ({ route }: ChatScreenProps) => {
  const { chatId } = route.params as { chatId: string };
  const { user } = useUser();
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.message,
          createdAt: data.timestamp?.toDate() || new Date(),
          user: {
            _id: data.userId,
            name: data.userName || 'User',
            avatar: data.userAvatar || undefined,
          },
        };
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!auth.currentUser) return;

    const { _id, text, createdAt, user } = newMessages[0];

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      userId: user._id,
      userName: user.name,
      message: text,
      timestamp: serverTimestamp(),
    });

    const chatDocRef = doc(db, 'chats', chatId);
    
    await updateDoc(chatDocRef, {
      lastMessage: newMessages[0].text,
      updatedAt: serverTimestamp(),
    });

  }, [chatId]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundColor }}>

      <GiftedChat
        messages={messages}
        onSend={(newMessages) => onSend(newMessages)}
        user={{
          _id: user?.uid || '',
          name: auth.currentUser?.displayName || 'User',
        }}
      />
    </View>
  );
};

export default Chat;
