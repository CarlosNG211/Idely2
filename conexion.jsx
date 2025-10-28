import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';


const firebaseConfig = {
  apiKey: "AIzaSyAGYqDE7wRSj7FL0i3MY3-meunLyXkETA0",
  authDomain: "chilitosramen-89223.firebaseapp.com",
  databaseURL: "https://chilitosramen-89223-default-rtdb.firebaseio.com",
  projectId: "chilitosramen-89223",
  storageBucket: "chilitosramen-89223.appspot.com",
  messagingSenderId: "980858860861",
  appId: "1:980858860861:web:50efba800ea74546a08154",
  measurementId: "G-23ZQE8834Z"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

export { db, analytics };