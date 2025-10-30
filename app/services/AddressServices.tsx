import { db } from './firebaseConfig'; // Import firebase config
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';

export interface Address {
  id?: string;
  latitude: number;
  longitude: number;
  addressName: string;
  address: string;
  buildingType: string;
  fullAddress: string;
  postcode: string;
  addressLabel: string;
  phoneNumber: string;
  createAt: any;  // Use the Firebase Timestamp object for createAt
  updatedAt: any;  // Use the Firebase Timestamp object for updatedAt
}

export const saveUserAddress = async (userId: string, addressData: Address) => {
  try {
    const userAddressesRef = collection(db, 'users', userId, 'addresses'); // Create subcollection 'addresses' under each user

    // Save address to Firestore
    const addressToSave = { ...addressData };
    if (!addressToSave.id) {
      delete addressToSave.id;
    }

    await addDoc(userAddressesRef, {
      ...addressToSave,
      createAt: addressData.createAt || serverTimestamp(),
      updatedAt: addressData.updatedAt || serverTimestamp()
    });

    console.log('Address saved successfully!');
  } catch (error) {
    console.error('Error saving address: ', error);
  }
};


export const fetchUserAddresses = async (userId: string) => {
  try {
    const userAddressesRef = collection(db, 'users', userId, 'addresses');
    const querySnapshot = await getDocs(userAddressesRef);

    const addresses: Address[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      addresses.push({
      id: doc.id,
      latitude: data.latitude,
      longitude: data.longitude,
      addressName: data.addressName,
      address: data.address,
      buildingType: data.buildingType,
      fullAddress: data.fullAddress,
      postcode: data.postcode,
      addressLabel: data.addressLabel,
      phoneNumber: data.phoneNumber,
      createAt: data.createAt,
      updatedAt: data.updatedAt
      });
    });

    return addresses;
  } catch (error) {
    console.error('Error fetching addresses: ', error);
    return [];
  }
};

export const getUserAddressById = async (
  userId: string,
  addressId: string
): Promise<Address | null> => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    const snapshot = await getDoc(addressRef);

    if (!snapshot.exists()) {
      console.log('Selected user address not found.');
      return null;
    }

    const raw = snapshot.data() as any;
    const selected: Address = {
      id: snapshot.id,
      latitude: raw.latitude ?? 0,
      longitude: raw.longitude ?? 0,
      addressName: raw.addressName ?? '',
      address: raw.address ?? '',
      buildingType: raw.buildingType ?? '',
      fullAddress: raw.fullAddress ?? '',
      postcode: raw.postcode ?? '',
      addressLabel: raw.addressLabel ?? '',
      phoneNumber: raw.phoneNumber ?? '',
      createAt: raw.createAt ?? null,
      updatedAt: raw.updatedAt ?? null
    };

    return selected;
  } catch (err) {
    console.error('Error fetching selected user address: ', err);
    return null;
  }
};

export const fetchProductAddresss = async (productOwnerId: string, addressId: string) => {
  try {
    const addressRef = doc(db, 'users', productOwnerId, 'addresses', addressId);
    const addressDoc = await getDoc(addressRef);

    if (addressDoc.exists()) {
      return { id: addressDoc.id, ...addressDoc.data() };
    } else {
      console.log('No such address found!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching address: ', error);
    return null;
  }
};

export const fetchProductAddress = async (productOwnerId: string, addressId: string): Promise<Address | null> => {
  try {
    const productAddressRef = doc(db, 'users', productOwnerId, 'addresses', addressId);
    const productAddressDoc = await getDoc(productAddressRef);

    if (productAddressDoc.exists() && productAddressDoc.data()) {
      const productAddressData = productAddressDoc.data();
      const productAddress: Address = {
        id: productAddressData.id,
        latitude: productAddressData.latitude,
        longitude: productAddressData.longitude,
        addressName: productAddressData.addressName,
        address: productAddressData.address,
        buildingType: productAddressData.buildingType,
        fullAddress: productAddressData.fullAddress,
        postcode: productAddressData.postcode,
        addressLabel: productAddressData.addressLabel,
        phoneNumber: productAddressData.phoneNumber,
        createAt: productAddressData.createAt,
        updatedAt: productAddressData.updatedAt
      };
      return productAddress;
    } else {
      console.log('No such seelected product address exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected product address: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const updateUserAddress = async (
  userId: string,
  addressId: string,
  updatedData: Partial<Address>
): Promise<boolean> => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);

    const dataToUpdate: any = { ...updatedData };
    if ('id' in dataToUpdate) {
      delete dataToUpdate.id;
    }

    await updateDoc(addressRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp()
    });

    console.log('Address updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating address: ', error);
    return false;
  }
};

export const deleteUserAddress = async (
  userId: string,
  addressId: string
): Promise<boolean> => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    await deleteDoc(addressRef);
    console.log('Address deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting address: ', error);
    return false;
  }
};