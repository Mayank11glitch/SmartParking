// firebase.js

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 YOUR FIREBASE CONFIG (paste yours here)
const firebaseConfig = {
    apiKey: "AIzaSyCHrwLfSCIuLvC7VqhpX-u_jUaW2AwDauU",
    authDomain: "smartparkingfinal-8c79e.firebaseapp.com",
    databaseURL: "https://smartparkingfinal-8c79e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smartparkingfinal-8c79e",
    storageBucket: "smartparkingfinal-8c79e.firebasestorage.app",
    messagingSenderId: "855138079664",
    appId: "1:855138079664:web:78fd5da08725e5d9abbc75"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
