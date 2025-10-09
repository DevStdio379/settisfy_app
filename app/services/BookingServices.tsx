import { db, storage } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, CollectionReference, DocumentReference, setDoc, onSnapshot } from 'firebase/firestore';
import { Address } from './AddressServices';
import { Catalogue } from './CatalogueServices';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { nanoid } from '@reduxjs/toolkit';

export interface Acceptor {
  settlerId: string;
  firstName: string;
  lastName: string;
  acceptedAt: string; // store as ISO string, or use Firestore Timestamp if needed
}


export interface SubOption {
  label: string;        // e.g. "10 sqft"
  additionalPrice: number; // e.g. 15 (store as number for calculations)
  notes?: string;       // optional: "measure carefully"
}

export interface DynamicOption {
  name: string;          // e.g. "sqft", "extras"
  subOptions: SubOption[];
  multipleSelect: boolean;
}

export interface Booking {
  id?: string;
  userId: string;
  status: number;
  selectedDate: string;
  selectedAddress: Address;

  // user copy
  firstName: string;
  lastName: string;

  // products copy
  catalogueService: Catalogue;

  // booking details
  total: number;
  addons?: DynamicOption[];
  notesToSettlerImageUrls?: string[];
  notesToSettler?: string;
  paymentMethod: string;
  paymentIntentId?: string;

  // after broadcast
  acceptors?: Acceptor[];
  settlerId?: string;
  settlerFirstName?: string;
  settlerLastName?: string;

  // collection and return code
  serviceStartCode: string;
  serviceEndCode: string;
  createAt: any;
  updatedAt: any;
}

export const uploadImages = async (imageName: string, imagesUrl: string[]) => {
    const urls: string[] = [];

    for (const uri of imagesUrl) {
        try {
            // Convert to Blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Generate unique filename
            const filename = `bookings/${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
            const storageRef = ref(storage, filename);

            // Upload file
            const uploadTask = uploadBytesResumable(storageRef, blob);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    snapshot => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload ${filename}: ${progress.toFixed(2)}% done`);
                    },
                    reject, // Handle error
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        urls.push(downloadURL);
                        resolve();
                    }
                );
            });

        } catch (error) {
            console.error("Upload failed:", error);
        }
    }

    console.log("All images uploaded:", urls);
    return urls; // Return all uploaded image URLs
};


export const createBooking = async (bookingData: Booking) => {
  try {
    // 🆕 Generate short custom ID
    const bookingId = nanoid(8); // e.g., "Ab12Cd34"

    // Create reference manually instead of using addDoc()
    const bookingRef = doc(collection(db, 'bookings'), bookingId);

    // 🕒 Add timestamps and ID field
    const bookingWithMeta = {
      ...bookingData,
      id: bookingId,
      createAt: new Date(),
      updatedAt: new Date(),
    };

    // Create the document
    await setDoc(bookingRef, bookingWithMeta);
    console.log('✅ Booking created with ID:', bookingId);

    // 🖼 If there are images, upload and update doc
    if (
      bookingData.notesToSettlerImageUrls &&
      bookingData.notesToSettlerImageUrls.length > 0
    ) {
      const uploadedUrls = await uploadImages(
        bookingId,
        bookingData.notesToSettlerImageUrls
      );

      await updateDoc(bookingRef, { imageUrls: uploadedUrls });
    }

    return bookingId;
  } catch (error) {
    console.error('❌ Error creating booking: ', error);
    throw error;
  }
};

const mapBorrowingData = (doc: any): Booking => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    status: data.status,
    selectedDate: data.selectedDate,
    selectedAddress: data.selectedAddress,

    // user copy
    firstName: data.firstName,
    lastName: data.lastName,

    // products copy
    catalogueService: data.catalogueService,

    // booking details
    total: data.total,
    addons: data.addons,
    notesToSettlerImageUrls: data.notesToSettlerImageUrls,
    notesToSettler: data.notesToSettler,
    paymentMethod: data.paymentMethod,
    paymentIntentId: data.paymentIntentId || '',  // Ensure paymentIntentId is always a string

    // after broadcast
    acceptors: data.acceptors,
    settlerId: data.settlerId || '',
    settlerFirstName: data.settlerFirstName || '',
    settlerLastName: data.settlerLastName || '',

    // collection and return code
    serviceStartCode: data.serviceStartCode,
    serviceEndCode: data.serviceEndCode,
    createAt: data.createAt,
    updatedAt: data.updatedAt,
  };
};

export function subscribeToBookings(setJobs: (booking: Booking[]) => void) {
  const q = query(collection(db, "bookings"), where("status", "==", "0"));
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    setJobs(jobs);
  });
}

export function subscribeToOneBooking(bookingId: string, onUpdate: (booking: Booking | null) => void) {
  const bookingRef = doc(db, "bookings", bookingId);
  return onSnapshot(bookingRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() } as Booking);
    } else {
      onUpdate(null); // Job deleted or not found
    }
  });
}

// Function to fetch products for a specific user from Firestore
export const fetchBookingsByUser = async (userID: string): Promise<Booking[]> => {
  try {
    const userMyBorrowingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'bookings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const bookingData = doc.data();
      if (bookingData.userId === userID) {  // Check if the product belongs to the user
        userMyBorrowingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyBorrowingsList;
  } catch (error) {
    console.error('Error fetching user borrowings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to fetch products for a specific user from Firestore
export const fetchBookingsAsSettler = async (userId: string): Promise<Booking[]> => {
  try {
    const userMyBorrowingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'bookings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const bookingData = doc.data();
      if (bookingData.settlerId === userId) {  // Check if the product belongs to the user
        userMyBorrowingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyBorrowingsList;
  } catch (error) {
    console.error('Error fetching user borrowings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const fetchSelectedBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (bookingDoc.exists() && bookingDoc.data()) {
      return mapBorrowingData(bookingDoc);
    } else {
      console.log('No such selected booking exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected booking: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to fetch products for a specific user from Firestore
export const fetchLendingsByUser = async (userID: string): Promise<Booking[]> => {
  try {
    const userMyLendingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'borrowings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const lendingData = doc.data();
      if (lendingData.product.ownerID === userID) {  // Check if the product belongs to the user
        userMyLendingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyLendingsList;
  } catch (error) {
    console.error('Error fetching user lendings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const updateBooking = async (bookingId: string, updatedData: Partial<any>) => {
  try {
    const borrowingRef = doc(db, 'bookings', bookingId);
    await updateDoc(borrowingRef, updatedData);
    console.log('Booking updated with ID: ', bookingId);
  } catch (error) {
    console.error('Error updating booking: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const countActivitiesByUser = async (userID: string): Promise<{ borrowingReviews: number, lendingReviews: number }> => {
  try {
    const reviewsRef = collection(db, 'borrowings');

    // Count borrowing reviews
    const borrowingQuery = query(reviewsRef, where('userId', '==', userID));
    const borrowingSnapshot = await getDocs(borrowingQuery);
    const borrowingReviews = borrowingSnapshot.size;

    // Count lending reviews
    const lendingQuery = query(reviewsRef, where('product.ownerID', '==', userID));
    const lendingSnapshot = await getDocs(lendingQuery);
    const lendingReviews = lendingSnapshot.size;

    return { borrowingReviews, lendingReviews };
  } catch (error) {
    console.error('Error counting reviews: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};
