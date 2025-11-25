import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAOMnl9ikDMngZZH-eSa3ldqtDCh6qsy_U",
  authDomain: "boyoticom-15c4b.firebaseapp.com",
  databaseURL: "https://boyoticom-15c4b-default-rtdb.firebaseio.com",
  projectId: "boyoticom-15c4b",
  storageBucket: "boyoticom-15c4b.firebasestorage.app",
  messagingSenderId: "433583401372",
  appId: "1:433583401372:web:2d483367ad0e0184a10059"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);