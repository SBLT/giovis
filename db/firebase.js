import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRpNhCuhQ54fpxiRQd2ASamgJnv2rnymw",
  authDomain: "giovis-f9967.firebaseapp.com",
  projectId: "giovis-f9967",
  storageBucket: "giovis-f9967.appspot.com",
  messagingSenderId: "852234645067",
  appId: "1:852234645067:web:c5260f2313d2adde28a7ce",
};

const app = !firebase.apps.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();

// Modules
const db = app.firestore();
const auth = app.auth();
const storage = app.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

export { db, auth, storage, googleProvider };
