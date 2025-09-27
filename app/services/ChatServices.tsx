// services/chatService.ts
import { User } from "../context/UserContext";
import { Booking } from "./BookingServices";
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
export const getOrCreateChat = async (userId: string, otherUserId: string, booking?: Booking ) => {

  const chatRef = collection(db, "chats");

  // Check if chat already exists
  const chatQuery = query(
    chatRef,
    where("participants", "array-contains", userId)
  );

  try {
    const snapshot = await getDocs(chatQuery);
    for (const chat of snapshot.docs) {
      const data = chat.data();
      if (
        data.participants.includes(otherUserId) &&
        booking &&
        data.id === booking.id
      ) {
        return chat.id; // Return existing chat ID
      }
    }

    // Create a new chat
    const newChatRef = await addDoc(chatRef, {
      participants: [userId, otherUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
      booking: booking || null
    });

    return newChatRef.id;
  } catch (error) {
    console.error("Error creating or fetching chat: ", error);
    return null;
  }
};
