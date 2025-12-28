// Firebase imports
import {
    ref,
    onValue,
    get,
    set,
    update,
    push
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase.js";

// ============================================
// REAL-TIME PARKING DATA FROM FIREBASE
// ============================================

// Get HTML elements for stats display
const availableEl = document.getElementById("availableCount");
const occupiedEl = document.getElementById("occupiedCount");
const occupancyEl = document.getElementById("occupancyPercent");
const occupancyBar = document.getElementById("occupancyBar");

// Listen to Firebase parking data in real-time
const parkingRef = ref(db, "parking");
const slotsRef = ref(db, "slots");

// Listen to parking stats
onValue(parkingRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const available = data.availableSlots || 0;
    const total = data.totalSlots || 0;

    // Update available count
    if (availableEl) availableEl.innerText = available;

    console.log("📊 Parking stats from Firebase:", { available, total });
});

// Listen to actual slots to count occupied
onValue(slotsRef, async (snapshot) => {
    const slots = snapshot.val();
    if (!slots) {
        // No slots data - set to 0
        if (occupiedEl) occupiedEl.innerText = "0";
        if (occupancyEl) occupancyEl.innerText = "0%";
        if (occupancyBar) occupancyBar.style.width = "0%";
        console.log("⚠️ No slots data in Firebase");
        return;
    }

    // Count occupied slots (car physically present)
    let occupiedCount = 0;
    // Count unavailable slots (booked OR occupied)
    let unavailableCount = 0;

    // Update Grid UI based on Firebase Data
    const spotElements = document.querySelectorAll('.card-grid .spot');
    spotElements.forEach(spotEl => {
        const titleEl = spotEl.querySelector('h3');
        if (!titleEl) return;
        const spotId = titleEl.textContent.trim();

        // Find matching slot data
        if (slots[spotId]) {
            const slot = slots[spotId];
            const isOccupied = slot.occupied;
            const isBooked = slot.booked;

            // Count occupied (car present)
            if (isOccupied) occupiedCount++;

            // Count unavailable (booked OR occupied)
            if (isBooked || isOccupied) unavailableCount++;

            // Update Badge and Button
            const badge = spotEl.querySelector('.badge');
            const btn = spotEl.querySelector('button.reserve'); // Select specific reserve button

            if (isOccupied) {
                // Set to Occupied (car is physically present)
                if (badge) {
                    badge.textContent = 'Occupied';
                    badge.className = 'badge occupied';
                }
                if (btn) {
                    btn.textContent = 'Occupied';
                    btn.disabled = true;
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                }
            } else if (isBooked) {
                // Set to Booked (reserved but car hasn't arrived)
                if (badge) {
                    badge.textContent = 'Booked';
                    badge.className = 'badge occupied'; // Use same style as occupied
                }
                if (btn) {
                    btn.textContent = 'Booked';
                    btn.disabled = true;
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                }
            } else {
                // Set to Available
                if (badge) {
                    badge.textContent = 'Available';
                    badge.className = 'badge available';
                }
                if (btn) {
                    btn.textContent = 'Reserve';
                    btn.disabled = false;
                    btn.classList.add('btn-primary');
                    btn.classList.remove('btn-outline');
                }
            }
        }
    });

    // Update occupied count (only cars physically present)
    if (occupiedEl) occupiedEl.innerText = occupiedCount;

    // Calculate percentage and available count using unavailable count
    try {
        const parkingSnapshot = await get(ref(db, 'parking'));
        const total = parkingSnapshot.val()?.totalSlots || 6;
        const availableCount = total - unavailableCount;
        const percent = total > 0 ? Math.round((unavailableCount / total) * 100) : 0;

        if (occupancyEl) occupancyEl.innerText = percent + "%";
        if (occupancyBar) occupancyBar.style.width = percent + "%";

        // Update Available count based on unavailable (booked + occupied)
        if (availableEl) availableEl.innerText = availableCount;

        console.log("📊 Slot counts - Occupied:", occupiedCount, "Unavailable (Booked+Occupied):", unavailableCount, "Available:", availableCount, "Total:", total);
    } catch (error) {
        console.error("Error getting parking data:", error);
    }
});


// ============================================
// SLOT RESERVATION FUNCTION
// ============================================

window.reserveSlot = async function (slotKey) {
    const uid = localStorage.getItem("uid");
    const email = localStorage.getItem("userEmail");

    if (!uid) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    try {
        const slotRef = ref(db, "slots/" + slotKey);
        const snapshot = await get(slotRef);

        if (!snapshot.exists()) {
            alert("Slot not found");
            return;
        }

        const slot = snapshot.val();

        if (slot.occupied) {
            alert("Slot already occupied");
            return;
        }

        // 1️⃣ Mark slot as occupied
        await update(slotRef, {
            occupied: true,
            userId: uid
        });

        // 2️⃣ Update parking statistics
        const parkingRef = ref(db, "parking");
        const parkSnap = await get(parkingRef);
        const park = parkSnap.val();

        await update(parkingRef, {
            availableSlots: park.availableSlots - 1,
            fullSlots: park.fullSlots + 1,
            status: park.availableSlots - 1 === 0 ? "FULL" : "AVAILABLE"
        });

        // 3️⃣ Create booking record
        const bookingRef = push(ref(db, "bookings"));
        await set(bookingRef, {
            userId: uid,
            email: email,
            slot: slot.slotId,
            slotKey: slotKey,
            time: new Date().toISOString(),
            status: "ACTIVE"
        });

        alert("✅ Slot " + slot.slotId + " reserved successfully!");

        // Refresh the page to show updated status
        window.location.reload();

    } catch (error) {
        console.error("Error reserving slot:", error);
        alert("Failed to reserve slot. Please try again.");
    }
};

console.log("🔥 Firebase Dashboard Integration Loaded");
