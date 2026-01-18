import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

// Initialize Firebase
const app = initializeApp(environment.firebase);

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
