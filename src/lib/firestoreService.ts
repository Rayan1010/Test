import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Vehicle, MaintenanceRecord, Reminder, VehicleDocument } from '../types';

// VEHICLE REPOSITORY
export const getVehicles = async (userId: string): Promise<Vehicle[]> => {
  try {
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const vehicles: Vehicle[] = [];
    snap.forEach((doc) => {
      vehicles.push({ id: doc.id, ...doc.data() } as Vehicle);
    });
    // Sort descending by createdAt
    return vehicles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('getVehicles error:', err);
    throw err;
  }
};

export const createVehicle = async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  try {
    const colRef = collection(db, 'vehicles');
    const docRef = await addDoc(colRef, {
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return {
      id: docRef.id,
      ...vehicleData,
    };
  } catch (err) {
    console.error('createVehicle error:', err);
    throw err;
  }
};

export const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>): Promise<void> => {
  try {
    const docRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('updateVehicle error:', err);
    throw err;
  }
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  try {
    // 1. Delete vehicle doc
    await deleteDoc(doc(db, 'vehicles', vehicleId));

    // 2. Delete related maintenance records
    const recQuery = query(collection(db, 'maintenanceRecords'), where('vehicleId', '==', vehicleId));
    const recSnap = await getDocs(recQuery);
    const delPromises = recSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(delPromises);

    // 3. Delete related reminders
    const remQuery = query(collection(db, 'reminders'), where('vehicleId', '==', vehicleId));
    const remSnap = await getDocs(remQuery);
    const remPromises = remSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(remPromises);
  } catch (err) {
    console.error('deleteVehicle error:', err);
    throw err;
  }
};

// MAINTENANCE RECORD REPOSITORY
export const getMaintenanceRecords = async (vehicleId: string): Promise<MaintenanceRecord[]> => {
  try {
    const q = query(
      collection(db, 'maintenanceRecords'),
      where('vehicleId', '==', vehicleId)
    );
    const snap = await getDocs(q);
    const records: MaintenanceRecord[] = [];
    snap.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as MaintenanceRecord);
    });
    // Sort by date descending
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.error('getMaintenanceRecords error:', err);
    throw err;
  }
};

export const createMaintenanceRecord = async (
  recordData: Omit<MaintenanceRecord, 'id'>, 
  updateCarOdometer: boolean = true
): Promise<MaintenanceRecord> => {
  try {
    const colRef = collection(db, 'maintenanceRecords');
    const docRef = await addDoc(colRef, {
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Optionally update vehicle current odometer if higher
    if (updateCarOdometer && recordData.odometer > 0) {
      const vDoc = await getDoc(doc(db, 'vehicles', recordData.vehicleId));
      if (vDoc.exists()) {
        const vData = vDoc.data() as Vehicle;
        if (!vData.currentOdometer || recordData.odometer > vData.currentOdometer) {
          await updateDoc(doc(db, 'vehicles', recordData.vehicleId), {
            currentOdometer: recordData.odometer,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return {
      id: docRef.id,
      ...recordData,
    };
  } catch (err) {
    console.error('createMaintenanceRecord error:', err);
    throw err;
  }
};

export const updateMaintenanceRecord = async (
  recordId: string, 
  updates: Partial<MaintenanceRecord>
): Promise<void> => {
  try {
    const docRef = doc(db, 'maintenanceRecords', recordId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('updateMaintenanceRecord error:', err);
    throw err;
  }
};

export const deleteMaintenanceRecord = async (recordId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'maintenanceRecords', recordId));
  } catch (err) {
    console.error('deleteMaintenanceRecord error:', err);
    throw err;
  }
};

// REMINDERS REPOSITORY
export const getReminders = async (vehicleId: string): Promise<Reminder[]> => {
  try {
    const q = query(
      collection(db, 'reminders'),
      where('vehicleId', '==', vehicleId)
    );
    const snap = await getDocs(q);
    const reminders: Reminder[] = [];
    snap.forEach((doc) => {
      reminders.push({ id: doc.id, ...doc.data() } as Reminder);
    });
    // Sort uncompleted first, then by dueDate/created
    return reminders.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  } catch (err) {
    console.error('getReminders error:', err);
    throw err;
  }
};

export const createReminder = async (reminderData: Omit<Reminder, 'id'>): Promise<Reminder> => {
  try {
    const colRef = collection(db, 'reminders');
    const docRef = await addDoc(colRef, {
      ...reminderData,
      createdAt: new Date().toISOString(),
    });
    return {
      id: docRef.id,
      ...reminderData,
    };
  } catch (err) {
    console.error('createReminder error:', err);
    throw err;
  }
};

export const toggleReminderStatus = async (reminderId: string, isCompleted: boolean): Promise<void> => {
  try {
    const docRef = doc(db, 'reminders', reminderId);
    await updateDoc(docRef, {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error('toggleReminderStatus error:', err);
    throw err;
  }
};

export const deleteReminder = async (reminderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (err) {
    console.error('deleteReminder error:', err);
    throw err;
  }
};
