import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Status sequence mapping: advances a booking to its next logical stage
 */
const NEXT_STATUS_MAP = {
  Pending: 'Assigned',
  Assigned: 'Mechanic On The Way',
  'Mechanic On The Way': 'In Progress',
  'In Progress': 'Completed'
};

/**
 * Fetch helper using Node's native fetch API
 */
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status} ${response.statusText}]: ${errorText}`);
  }

  return response.json();
};

/**
 * Picks a random Pending or Assigned booking and advances it through the status chain.
 * Calls the real backend REST endpoints so that:
 * 1. Mongoose validations & statusHistory audit logs are saved.
 * 2. Assigned mechanic availability is updated.
 * 3. req.app.get('io') broadcasts real-time Socket.io events to all connected UI clients.
 */
const advanceRandomBooking = async () => {
  try {
    // 1. Fetch current Pending & Assigned bookings from the active server
    const [pendingRes, assignedRes] = await Promise.all([
      apiCall('/bookings?status=Pending&limit=30'),
      apiCall('/bookings?status=Assigned&limit=30')
    ]);

    const pendingBookings = pendingRes.data || [];
    const assignedBookings = assignedRes.data || [];

    const candidateBookings = [...pendingBookings, ...assignedBookings];

    if (candidateBookings.length === 0) {
      console.log('ℹ️ [Simulator] No Pending or Assigned bookings found at the moment. Checking in next cycle.');
      return;
    }

    // 2. Pick a random candidate booking
    const booking = candidateBookings[Math.floor(Math.random() * candidateBookings.length)];
    const currentStatus = booking.status;
    const nextStatus = NEXT_STATUS_MAP[currentStatus];

    if (!nextStatus) {
      return;
    }

    console.log(`\n🎯 [Simulator] Selected Booking: ${booking.bookingId}`);
    console.log(`   Vehicle : ${booking.vehicle?.make} ${booking.vehicle?.model} (${booking.vehicle?.licensePlate})`);
    console.log(`   Transition: [${currentStatus}] ➔ [${nextStatus}]`);

    // 3. Handle transition
    if (currentStatus === 'Pending' && !booking.mechanic) {
      // Need to assign a mechanic
      const mechanicsRes = await apiCall('/mechanics?limit=25');
      const mechanics = mechanicsRes.data || [];

      // Find an available mechanic or any mechanic
      const availableMech = mechanics.find((m) => m.status === 'available') || mechanics[0];

      if (availableMech) {
        console.log(`   Action  : Assigning to mechanic "${availableMech.name}" (${availableMech.status})`);
        const assignResult = await apiCall(`/bookings/${booking._id}/assign`, {
          method: 'PATCH',
          body: JSON.stringify({ mechanicId: availableMech._id })
        });

        console.log(`   ✅ Success: ${booking.bookingId} assigned to ${availableMech.name}.`);
        console.log(`   📡 Socket event "booking:updated" & "mechanic:status_changed" emitted by server!`);
        return;
      }
    }

    // Normal status transition (e.g. Assigned ➔ Mechanic On The Way)
    const updateResult = await apiCall(`/bookings/${booking._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: nextStatus,
        note: `Simulator automated transition to ${nextStatus}`
      })
    });

    console.log(`   ✅ Success: ${booking.bookingId} advanced to "${nextStatus}".`);
    console.log(`   📡 Socket event "booking:updated" emitted to all connected dashboards!`);
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.warn('⚠️ [Simulator] Server at http://localhost:5000 is not reachable. Waiting for server to start...');
    } else {
      console.error('❌ [Simulator] Error advancing booking:', error.message);
    }
  }
};

/**
 * Continuous loop running every 15–30 seconds
 */
const runSimulationLoop = () => {
  // Random interval between 15,000ms (15s) and 30,000ms (30s)
  const intervalSeconds = Math.floor(Math.random() * 16) + 15;
  const intervalMs = intervalSeconds * 1000;

  console.log(`\n⏳ [Simulator] Next cycle in ${intervalSeconds} seconds...`);

  setTimeout(async () => {
    await advanceRandomBooking();
    runSimulationLoop();
  }, intervalMs);
};

// Banner & Kickoff
console.log('====================================================');
console.log('🏎️  Instant Mechanic — Live Operations Event Simulator');
console.log('====================================================');
console.log(`• Target API Base : ${API_BASE_URL}`);
console.log('• Interval Range  : Every 15 to 30 seconds');
console.log('• Trigger Action  : Advances Pending/Assigned bookings');
console.log('• Real-time Sync  : Emits live Socket.io events');
console.log('====================================================\n');

// Start first run after a 3-second initial warm-up
setTimeout(async () => {
  await advanceRandomBooking();
  runSimulationLoop();
}, 3000);
