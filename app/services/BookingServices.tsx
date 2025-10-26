import { db, storage } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, CollectionReference, DocumentReference, setDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { Address } from './AddressServices';
import { Catalogue, DynamicOption } from './CatalogueServices';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { User } from '../context/UserContext';
import { SettlerService } from './SettlerServiceServices';
import { Alert } from 'react-native';

export enum BookingActivityType {
  // initial booking state
  QUOTE_CREATED = "QUOTE_CREATED",
  SETTLER_ACCEPT = "SETTLER_ACCEPT",
  SETTLER_SELECTED = "SETTLER_SELECTED",

  // active service state
  SETTLER_SERVICE_START = "SETTLER_SERVICE_START",
  SETTLER_SERVICE_END = "SETTLER_SERVICE_END",
  SETTLER_EVIDENCE_SUBMITTED = "SETTLER_EVIDENCE_SUBMITTED",
  SETTLER_EVIDENCE_UPDATED = "SETTLER_EVIDENCE_UPDATED",

  // incompletion & completion state
  JOB_COMPLETED = "JOB_COMPLETED",
  JOB_INCOMPLETE = "JOB_INCOMPLETE",
  CUSTOMER_JOB_INCOMPLETE_UPDATED = "CUSTOMER_JOB_INCOMPLETE_UPDATED",
  SETTLER_RESOLVE_INCOMPLETION = "SETTLER_RESOLVE_INCOMPLETION",
  SETTLER_UPDATE_INCOMPLETION_EVIDENCE = "SETTLER_UPDATE_INCOMPLETION_EVIDENCE",
  SETTLER_REJECT_INCOMPLETION = "SETTLER_REJECT_INCOMPLETION",

  // cooldown state
  CUSTOMER_CONFIRM_COMPLETION = "CUSTOMER_CONFIRM_COMPLETION",
  COOLDOWN_REPORT_SUBMITTED = "COOLDOWN_REPORT_SUBMITTED",
  CUSTOMER_COOLDOWN_REPORT_UPDATED = "CUSTOMER_COOLDOWN_REPORT_UPDATED",
  SETTLER_RESOLVE_COOLDOWN_REPORT = "SETTLER_RESOLVE_COOLDOWN_REPORT",
  SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE = "SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE",
  CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED = "CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED",
  COOLDOWN_REPORT_COMPLETED = "COOLDOWN_REPORT_COMPLETED",
  COOLDOWN_REPORT_REJECTED = "COOLDOWN_REPORT_REJECTED",
  PAYMENT_RELEASED = "PAYMENT_RELEASED",
  REPORT_SUBMITTED = "REPORT_SUBMITTED",
  STATUS_CHANGED = "STATUS_CHANGED",

  // extra states
  SETTLER_QUOTE_UPDATED = "SETTLER_QUOTE_UPDATED",
}

export enum BookingActorType {
  SETTLER = "SETTLER",
  CUSTOMER = "CUSTOMER",
}

export interface BookingActivity {
  id: string; // unique id
  type: BookingActivityType;
  timestamp: any; // Date.now()
  actor: BookingActorType; // who triggered this
}


export interface Acceptor {
  settlerId: string;
  settlerServiceId: string;
  firstName: string;
  lastName: string;
  acceptedAt: string; // store as ISO string, or use Firestore Timestamp if needed
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

  // manualQuote & Addons
  manualQuoteDescription: string;
  manualQuotePrice: number;
  isManualQuoteCompleted?: boolean;  // to be deleted
  newAddons?: DynamicOption[]; // to be deleted
  newManualQuoteDescription?: string; // to be deleted
  newManualQuotePrice?: number; // to be deleted
  newTotal?: number; // to be deleted

  // incompletion check
  incompletionReportImageUrls?: string[];
  incompletionReportRemark?: string;
  incompletionStatus?: string;
  incompletionResolvedImageUrls?: string[];
  incompletionResolvedRemark?: string;

  // cooldown report
  cooldownReportImageUrls?: string[];
  cooldownReportRemark?: string;
  cooldownStatus?: string;
  cooldownResolvedImageUrls?: string[];
  cooldownResolvedRemark?: string;

  // for notification
  isQuoteUpdateSuccess?: boolean,

  // after broadcast
  acceptors?: Acceptor[];
  settlerId?: string;
  settlerServiceId: string;
  settlerFirstName?: string;
  settlerLastName?: string;
  settlerEvidenceImageUrls: string[];
  settlerEvidenceRemark: string;

  // collection and return code
  serviceStartCode: string;
  serviceEndCode: string;

  // report
  problemReportRemark?: string;
  problemReportImageUrls?: string[];
  problemReportIsCompleted?: boolean;

  // timeline
  timeline: any[],
  // for timeline must have:
  // { 
//   id: string; 
//   message: string; 
//   timestamp: any; 
//   actor: BookingActorType; 
//   type: BookingActivityType
// }

  createAt: any;
  updatedAt: any;
}

export interface BookingWithUser extends Booking {
  settlerProfile: User | null;
  settlerJobProfile: SettlerService | null;

}

export const uploadNoteToSettlerImages = async (imageName: string, imagesUrl: string[]) => {
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

export const uploadImagesCompletionEvidence = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `bookings/evidence_${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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

export const uploadImageIncompletionEvidence = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `bookings/incompletion_evidence_${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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

export const uploadImageIncompletionResolveEvidence = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `bookings/incompletion_resolve_evidence_${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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

export const uploadImagesCooldownReportEvidence = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `bookings/cooldown_report_${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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
    const bookingRef = collection(db, 'bookings');

    // Step 1: Create the booking first (without uploading images yet)
    const docRef = await addDoc(bookingRef, bookingData);
    console.log('Booking created with ID:', docRef.id);

    // Step 2: If notesToSettlerImageUrls exist (local file URIs or base64)
    if (bookingData.notesToSettlerImageUrls && bookingData.notesToSettlerImageUrls.length > 0) {
      // Upload the images and get back URLs
      const uploadedUrls = await uploadNoteToSettlerImages(docRef.id, bookingData.notesToSettlerImageUrls);

      // Step 3: Update the same booking doc with those URLs
      await updateDoc(doc(db, 'bookings', docRef.id), {
        notesToSettlerImageUrls: uploadedUrls,
        updatedAt: new Date(), // ✅ keep consistency
      });
    }

    // Step 4: Return ID for navigation or confirmation
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking: ', error);
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

    // quick actions
    newAddons: data.newAddons,
    manualQuoteDescription: data.manualQuoteDescription,
    manualQuotePrice: data.manualQuotePrice,
    isManualQuoteCompleted: data.isManualQuoteCompleted,
    newManualQuoteDescription: data.newManualQuoteDescription,
    newManualQuotePrice: data.newManualQuotePrice,

    // for notification
    isQuoteUpdateSuccess: data.isQuoteUpdateSuccess,

    // incompletion check
    incompletionReportImageUrls: data.incompletionReportImageUrls,
    incompletionReportRemark: data.incompletionReportRemark,
    incompletionStatus: data.incompletionStatus,
    incompletionResolvedImageUrls: data.incompletionResolvedImageUrls,
    incompletionResolvedRemark: data.incompletionResolvedRemark,

    // cooldown report
    cooldownReportImageUrls: data.cooldownReportImageUrls,
    cooldownReportRemark: data.cooldownReportRemark,
    cooldownStatus: data.cooldownStatus,
    cooldownResolvedImageUrls: data.cooldownResolvedImageUrls,
    cooldownResolvedRemark: data.cooldownResolvedRemark,


    // after broadcast
    acceptors: data.acceptors,
    settlerId: data.settlerId || '',
    settlerServiceId: data.settlerServiceId || '',
    settlerFirstName: data.settlerFirstName || '',
    settlerLastName: data.settlerLastName || '',
    settlerEvidenceImageUrls: data.settlerEvidenceImageUrls,
    settlerEvidenceRemark: data.settlerEvidenceRemark,

    // collection and return code
    serviceStartCode: data.serviceStartCode,
    serviceEndCode: data.serviceEndCode,

    // timeline
    timeline: data.timeline,

    // reports
    problemReportRemark: data.problemReportRemark,
    problemReportImageUrls: data.problemReportImageUrls,
    problemReportIsCompleted: data.problemReportIsCompleted,

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
    const bookingRef = doc(db, 'bookings', bookingId);

    if (updatedData.settlerEvidenceImageUrls && updatedData.settlerEvidenceImageUrls.length > 0) {
      const uploadedUrls = await uploadImagesCompletionEvidence(bookingRef.id, updatedData.settlerEvidenceImageUrls);
      await updateDoc(bookingRef, {
        ...updatedData,
        settlerEvidenceImageUrls: uploadedUrls
      });
    }
    else {
      await updateDoc(bookingRef, updatedData);
    }
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


export const deleteProblemReportByIndex = async (
  bookingId: string,
  reportIndex: number
) => {
  const bookingRef = doc(db, "bookings", bookingId);

  // 1️⃣ Get current booking data
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists()) throw new Error("Booking not found");

  const currentReports = bookingSnap.data().reports || [];

  // 2️⃣ Ensure index is valid
  if (reportIndex < 0 || reportIndex >= currentReports.length) {
    throw new Error("Invalid report index");
  }

  // Optional: if you store image URLs and want to clean them up
  const reportToDelete = currentReports[reportIndex];
  // await deleteReportImages(reportToDelete.reportImageUrls); // optional cleanup

  // 3️⃣ Remove report at index
  const updatedReports = currentReports.filter(
    (_: any, idx: number) => idx !== reportIndex
  );

  // 4️⃣ Save back to Firestore
  await updateDoc(bookingRef, {
    reports: updatedReports,
  });
};
