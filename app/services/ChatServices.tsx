// services/chatService.ts
import { User } from "../context/UserContext";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Get or create a chat between the logged-in user and another user.
 */
export const getOrCreateChat = async (user: User, otherUser: User, productId?: string ) => {

  const chatRef = collection(db, "chats");

  // Check if chat already exists
  const chatQuery = query(
    chatRef,
    where("participants", "array-contains", user.uid)
  );

  try {
    const snapshot = await getDocs(chatQuery);
    for (const chat of snapshot.docs) {
      const data = chat.data();
      if (data.participants.includes(otherUser.uid) && data.productId === productId) {
        return chat.id; // Return existing chat ID
      }
    }

    // Create a new chat
    const newChatRef = await addDoc(chatRef, {
      participants: [user.uid, otherUser.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
      productId: productId || null
    });

    return newChatRef.id;
  } catch (error) {
    console.error("Error creating or fetching chat: ", error);
    return null;
  }
};
