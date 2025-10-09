import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Booking } from "./BookingServices";

export const getOrCreateChat = async (
  userId: string,
  otherUserId: string,
  booking?: Booking
) => {
  const chatRef = collection(db, "chats");

  try {
    // 1️⃣ Find chats that include *either* participant
    const chatQuery = query(chatRef, where("participants", "array-contains", userId));
    const snapshot = await getDocs(chatQuery);

    // 2️⃣ Check manually for the correct pair + booking
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      const sameParticipants =
        data.participants.includes(userId) &&
        data.participants.includes(otherUserId);

      const sameBooking =
        booking &&
        (data.booking?.id === booking.id ||
         data.bookingId === booking.id);

      if (sameParticipants && sameBooking) {
        // ✅ Chat already exists
        return docSnap.id;
      }
    }

    // 3️⃣ Otherwise, create new chat
    const newChat = {
      participants: [userId, otherUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
      booking: booking || null,
      bookingId: booking?.id || null,
    };

    const newChatRef = await addDoc(chatRef, newChat);
    return newChatRef.id;
  } catch (error) {
    console.error("Error creating or fetching chat: ", error);
    return null;
  }
};
