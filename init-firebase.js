// Initialize Firebase Database with Parking Data
// Run this file ONCE to set up your Firebase database structure

import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase.js";

async function initializeDatabase() {
    console.log("🔥 Initializing Firebase Database...");

    try {
        // Check if data already exists
        const parkingRef = ref(db, "parking");
        const snapshot = await get(parkingRef);

        if (snapshot.exists()) {
            console.log("⚠️ Database already initialized. Current data:", snapshot.val());
            const confirm = window.confirm("Database already has data. Do you want to RESET it? This will delete all existing bookings!");
            if (!confirm) {
                console.log("❌ Initialization cancelled by user");
                return;
            }
        }

        // Initialize parking statistics
        await set(ref(db, "parking"), {
            totalSlots: 6,
            availableSlots: 6,
            fullSlots: 0,
            status: "AVAILABLE"
        });

        // Initialize slots (matching your dashboard.html slots)
        const slotsData = {
            "A-101": {
                slotId: "A-101",
                floor: 1,
                price: 40,
                occupied: false,
                hasEVCharger: true,
                userId: null
            },
            "A-102": {
                slotId: "A-102",
                floor: 1,
                price: 30,
                occupied: false,
                hasEVCharger: false,
                userId: null
            },
            "A-103": {
                slotId: "A-103",
                floor: 1,
                price: 30,
                occupied: false,
                hasEVCharger: false,
                userId: null
            },
            "A-104": {
                slotId: "A-104",
                floor: 1,
                price: 40,
                occupied: false,
                hasEVCharger: true,
                userId: null
            },
            "B-201": {
                slotId: "B-201",
                floor: 2,
                price: 45,
                occupied: false,
                hasEVCharger: false,
                userId: null
            },
            "C-302": {
                slotId: "C-302",
                floor: 3,
                price: 30,
                occupied: false,
                hasEVCharger: false,
                userId: null
            }
        };

        await set(ref(db, "slots"), slotsData);

        console.log("✅ Database initialized successfully!");
        console.log("📊 Created 6 parking slots");
        console.log("📊 All slots are available");

        alert("✅ Firebase Database Initialized Successfully!\n\n6 parking slots created.\nYou can now close this page and refresh your dashboard.");

    } catch (error) {
        console.error("❌ Error initializing database:", error);
        alert("Error initializing database: " + error.message);
    }
}

// Auto-run on page load
window.addEventListener("load", () => {
    console.log("🚀 Firebase Init Script Loaded");
    initializeDatabase();
});
