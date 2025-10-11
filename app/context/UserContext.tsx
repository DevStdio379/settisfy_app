import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { db, storage } from "../services/firebaseConfig";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, formatDistanceToNow } from "date-fns";
import { Address } from "../services/AddressServices";

interface ActiveJob {
  settlerServiceId: string;
  catalogueId: string;
}

export interface User {
  uid: string;
  email: string;
  userName: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  accountType: string;
  isVerified: boolean;
  profileImageUrl?: string;
  createAt: any;
  updatedAt: any;
  memberFor: string;
  currentAddress?: Address;
  activeJobs?: ActiveJob[];
}

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  createUser: (userData: User) => Promise<void>;
  fetchUser: (uid: string) => Promise<void>;
  updateUserData: (uid: string, updatedData: Partial<User>) => Promise<void>;
}

export const defaultUser: User = {
  uid: "default-uid",
  email: "user@example.com",
  userName: "user",
  isActive: false,
  firstName: "UserFirstName",
  lastName: "UserLastName",
  phoneNumber: "1234567890",
  accountType: "customer",
  isVerified: false,
  createAt: "Feb 6, 2025, 12:24:09 PM",
  updatedAt: "Feb 6, 2025, 12:24:09 PM",
  memberFor: "1 year",
};



// Function to upload a single image to Firebase Storage
export const uploadImage = async (imageName: string, imageUrl: string) => {
  try {
    // Convert to Blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Generate unique filename
    const filename = `users/${imageName}.jpg`;
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
          console.log("Image uploaded:", downloadURL);
          resolve();
        }
      );
    });

  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const uid = await AsyncStorage.getItem('userUID');
        if (uid) {
          await fetchUser(uid);
          await updateUserData(uid, { isActive: true });
        } else {
          console.log("No userUID in storage.");
        }
      } catch (err) {
        console.error("Error restoring user session:", err);
      }
    };

    loadUserFromStorage();
  }, []);

  const [user, setUser] = useState<User | null>(defaultUser);

  const updateUserData = async (uid: string, updatedData: Partial<User>) => {
    try {
      // Handle profile image upload if profileImageUrl is provided
      if (updatedData.profileImageUrl) {
        const imageUrl = updatedData.profileImageUrl;
        await uploadImage(uid, imageUrl);
        const storageRef = ref(storage, `users/${uid}.jpg`);
        updatedData.profileImageUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, updatedData);
      const updatedDoc = await getDoc(userRef);

      if (updatedDoc.exists()) {
        const userData = updatedDoc.data();
        const updatedUser: User = {
          uid: userData.uid || '',
          email: userData.email || '',
          userName: userData.userName || '',
          isActive: userData.isActive || false,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          accountType: userData.accountType || '',
          isVerified: userData.isVerified || false,
          profileImageUrl: userData.profileImageUrl || '',
          createAt: userData.createAt || '',
          updatedAt: userData.updatedAt || '',
          memberFor: formatDistanceToNow(userData.createdAt.toDate(), { addSuffix: false }),
          currentAddress: userData.currentAddress ? (userData.currentAddress as Address) : undefined,
          activeJobs: userData.activeJobs || undefined,
        };
        setUser(updatedUser);
        console.log("User updated in context:", updatedUser);
      }
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
    }
  };

  const createUser = async (userData: User) => {
    try {
      const userRef = doc(db, "users", userData.uid);
      await setDoc(userRef, { ...userData, createdAt: new Date() });
      setUser(userData); // Update the context
      console.log("User created and context updated:", userData);
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
      throw error;
    }
  };

  const fetchUser = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userInfo: User = {
          uid: uid,
          email: userData.email || '',
          userName: userData.userName || '',
          isActive: true,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          accountType: userData.accounType,
          isVerified: userData.isVerified || false,
          profileImageUrl: userData.profileImageUrl || '',
          createAt: userData.createAt || '',
          updatedAt: userData.updatedAt || '',
          memberFor: formatDistanceToNow(userData.createdAt.toDate(), { addSuffix: false }),
          currentAddress: userData.currentAddress || undefined,
        };
        setUser(userInfo);
        console.log("User fetched and context updated:", userInfo);
      } else {
        throw new Error("User data not found.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUserData, createUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const fetchSelectedUser = async (userId: string): Promise<User | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const userInfo: User = {
        uid: userData.uid || '',
        email: userData.email || '',
        userName: userData.userName || '',
        isActive: true,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        accountType: userData.accountType || '',
        isVerified: userData.isVerified || false,
        profileImageUrl: userData.profileImageUrl || '',
        createAt: userData.createAt || '',
        updatedAt: userData.updatedAt || '',
        memberFor: formatDistanceToNow(userData.createdAt.toDate(), { addSuffix: false }),
        currentAddress: userData.currentAddress || undefined,
        activeJobs: userData.activeJobs || undefined
      };
      return userInfo;
    } else {
      console.error("User data not found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollectionRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollectionRef);
    const usersList: User[] = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        uid: userData.uid || '',
        email: userData.email || '',
        userName: userData.userName || '',
        isActive: userData.isActive || false,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        accountType: userData.accountType || '',
        isVerified: userData.isVerified || false,
        profileImageUrl: userData.profileImageUrl || '',
        createAt: userData.createAt || '',
        updatedAt: userData.updatedAt || '',
        memberFor: formatDistanceToNow(userData.createdAt.toDate(), { addSuffix: false }),
        currentAddress: userData.currentAddress || undefined,
        activeJobs: userData.activeJobs || undefined
      };
    });
    return usersList;
  } catch (error) {
    console.error("Error fetching users data:", error);
    throw error;
  }
};

export const fetchUsersByIds = async (userIds: string[]): Promise<User[]> => {
  try {
    const users: User[] = [];
    for (const userId of userIds) {
      const user = await fetchSelectedUser(userId);
      if (user) {
        users.push(user);
      }
    }
    return users;
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    throw error;
  }
};