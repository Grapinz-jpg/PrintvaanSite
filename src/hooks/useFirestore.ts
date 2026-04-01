import { useState, useCallback, useEffect } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { User, Order } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const useFirestore = () => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const isEmailAdmin = user.email === 'learn.grapinz@gmail.com';
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const firestoreRole = userDoc.data().role;
            setRole(firestoreRole || (isEmailAdmin ? 'admin' : 'user'));
          } else {
            setRole(isEmailAdmin ? 'admin' : 'user');
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          const isEmailAdmin = user.email === 'learn.grapinz@gmail.com';
          setRole(isEmailAdmin ? 'admin' : 'user');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveUserProfile = useCallback(async (data: Partial<User>) => {
    setIsActionLoading(true);
    setError(null);
    const path = `users/${auth.currentUser?.uid}`;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user found.");
      
      const uid = currentUser.uid;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      const role = currentUser.email === 'learn.grapinz@gmail.com' ? 'admin' : 'user';

      if (!userSnap.exists()) {
        const newUser: User = {
          uid,
          name: currentUser.displayName || 'Guest',
          email: currentUser.email || '',
          phone: data.phone || '',
          address: data.address || '',
          role: role as 'user' | 'admin',
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newUser);
      } else {
        await updateDoc(userRef, {
          phone: data.phone,
          address: data.address,
        });
      }
    } catch (err: any) {
      setError(err.message);
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const subscribeToUserOrders = useCallback((uid: string, callback: (orders: Order[]) => void) => {
    const path = 'orders';
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('userId', '==', uid),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(ordersData);
    }, (err) => {
      setError(err.message);
      handleFirestoreError(err, OperationType.GET, path);
    });
  }, []);

  const subscribeToAllOrders = useCallback((callback: (orders: Order[]) => void) => {
    const path = 'orders';
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(ordersData);
    }, (err) => {
      setError(err.message);
      handleFirestoreError(err, OperationType.GET, path);
    });
  }, []);

  const getUserOrders = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    const path = 'orders';
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (err: any) {
      setError(err.message);
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllOrdersForAdmin = useCallback(async () => {
    setLoading(true);
    setError(null);
    const path = 'orders';
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (err: any) {
      setError(err.message);
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const path = 'users';
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    } catch (err: any) {
      setError(err.message);
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    setLoading(true);
    setError(null);
    const path = `orders/${orderId}`;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      return true;
    } catch (err: any) {
      setError(err.message);
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserProfile = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    const path = `users/${uid}`;
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { uid: userSnap.id, ...userSnap.data() } as User;
      }
      return null;
    } catch (err: any) {
      setError(err.message);
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    saveUserProfile,
    getUserOrders,
    getAllOrdersForAdmin,
    subscribeToUserOrders,
    subscribeToAllOrders,
    getAllUsers,
    updateOrderStatus,
    getUserProfile,
    role,
    isActionLoading
  };
};
