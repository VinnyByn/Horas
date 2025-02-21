import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAn1I1s9EF4TqpKIR_6dI4VuimsG0BdtFI",
    authDomain: "gerenciadoratividades-9cd83.firebaseapp.com",
    projectId: "gerenciadoratividades-9cd83",
    storageBucket: "gerenciadoratividades-9cd83.appspot.com",
    messagingSenderId: "571005688979",
    appId: "1:571005688979:web:64ae70cdd3a55616520166"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs };