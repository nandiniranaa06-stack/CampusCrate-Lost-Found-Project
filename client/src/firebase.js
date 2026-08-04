import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDeN61bGQX2obIu_druHA4IVMCUPK-LgHk",
  authDomain: "campuscrate-a6d49.firebaseapp.com",
  projectId: "campuscrate-a6d49",
  storageBucket: "campuscrate-a6d49.firebasestorage.app",
  messagingSenderId: "1066848364422",
  appId: "1:1066848364422:web:39d8cedf02d24f40c1ee07",
  measurementId: "G-LQZGWL125S"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export { signInWithPopup };