import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

async function emailSignUp(signUpData) {
  const {
    email,
    password,
    latestDay,
    preferredTranslation,
    firstName,
    lastName,
  } = signUpData;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store additional data on user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      latestDay: latestDay,
      preferredTranslation: preferredTranslation,
      firstName: firstName,
      lastName: lastName,
      createdAt: Timestamp.fromDate(new Date()),
    });

    return user;
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    if (errorCode === "auth/email-already-in-use") {
      return "Email already in use";
    }
    if (errorCode === "auth/weak-password") {
      return "Password should be at least 6 characters.";
    } else {
      return errorMessage;
    }
  }
}

async function emailSignIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    return user;
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    if (errorCode === "auth/invalid-credential") {
      return "Email and password don't match an existing account. Try again.";
    }
    return errorMessage;
  }
}

async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    
    const token = credential.accessToken;
    const user = result.user;
    return user;
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
  }
}

// Access user data fields, e.g., firstName, lastName, preferredTranslation
function listenForUserData() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            resolve(userData);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          reject(error);
        }
      } else {
        resolve(null);
      }
      unsubscribe();
    });
  });
}

// Function to set up the auth state listener
const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("error signing out: ", error);
  }
}

const user = auth.currentUser;

export {
  app,
  emailSignUp,
  emailSignIn,
  onAuthChange,
  signOutUser,
  user,
  listenForUserData,
  handleGoogleSignIn,
};
