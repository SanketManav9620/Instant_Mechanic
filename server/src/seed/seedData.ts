import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

import Customer from '../models/Customer.js';
import Mechanic from '../models/Mechanic.js';
import Service from '../models/Service.js';
import Booking, { BookingStatus } from '../models/Booking.js';
import connectDB from '../config/connectDB.js';

dotenv.config();

// Realistic Indian vehicle makes and popular models
const VEHICLE_CATALOG = [
  { make: 'Maruti Suzuki', models: ['Swift', 'Baleno', 'Brezza', 'Dzire', 'Ertiga'] },
  { make: 'Hyundai', models: ['Creta', 'Venue', 'i20', 'Verna', 'Tucson'] },
  { make: 'Tata', models: ['Nexon', 'Harrier', 'Punch', 'Safari', 'Tiago'] },
  { make: 'Mahindra', models: ['Thar', 'XUV700', 'Scorpio-N', 'Bolero', 'XUV300'] },
  { make: 'Kia', models: ['Seltos', 'Sonet', 'Carens', 'EV6'] },
  { make: 'Honda', models: ['City', 'Amaze', 'Elevate'] },
  { make: 'Toyota', models: ['Innova Crysta', 'Fortuner', 'Urban Cruiser', 'Glanza'] },
  { make: 'Volkswagen', models: ['Virtus', 'Taigun', 'Polo'] }
];

const STATE_CODES = ['MH', 'DL', 'KA', 'TS', 'TN', 'HR', 'GJ', 'UP'];

const generateLicensePlate = (): string => {
  const state = faker.helpers.arrayElement(STATE_CODES);
  const district = faker.number.int({ min: 1, max: 99 }).toString().padStart(2, '0');
  const series = faker.string.alpha({ length: 2, casing: 'upper' });
  const number = faker.number.int({ min: 1000, max: 9999 });
  return `${state}${district}${series}${number}`;
};

export const seedDatabase = async () => {
  try {
    console.log('====================================================');
    console.log('🌱 [Seed] Starting Database Seed Process with Faker');
    console.log('====================================================');

    await connectDB();

    // 1. Wipe existing data
    console.log('🧹 [Seed] Wiping existing collections...');
    await Promise.all([
      Customer.deleteMany({}),
      Mechanic.deleteMany({}),
      Service.deleteMany({}),
      Booking.deleteMany({})
    ]);
    console.log('✅ [Seed] Clean slate established.');

    // 2. Create 8 realistic vehicle services with base prices in INR
    console.log('🛠️ [Seed] Creating 8 vehicle services across 7 categories (INR)...');
    const serviceTemplates = [
      {
        name: 'Periodic Maintenance Service (PMS)',
        category: 'General Service',
        basePrice: 3499,
        estimatedDurationMins: 120
      },
      {
        name: 'Complete Engine Diagnostics & Tuning',
        category: 'Engine',
        basePrice: 4999,
        estimatedDurationMins: 90
      },
      {
        name: 'Front & Rear Brake Pad Replacement',
        category: 'Brakes',
        basePrice: 2899,
        estimatedDurationMins: 60
      },
      {
        name: 'AC Gas Recharge & Evaporator Cleaning',
        category: 'AC',
        basePrice: 2299,
        estimatedDurationMins: 45
      },
      {
        name: 'Tyre Alignment, Balancing & Rotation (4 Wheels)',
        category: 'Tyres',
        basePrice: 1499,
        estimatedDurationMins: 40
      },
      {
        name: 'Battery Health Check & Jumpstart Assist',
        category: 'Battery',
        basePrice: 899,
        estimatedDurationMins: 30
      },
      {
        name: 'Ceramic Coating & Deep Foam Wash',
        category: 'Cosmetic',
        basePrice: 6499,
        estimatedDurationMins: 180
      },
      {
        name: 'Clutch Assembly & Flywheel Overhaul',
        category: 'Engine',
        basePrice: 7999,
        estimatedDurationMins: 240
      }
    ];

    const services = await Service.insertMany(serviceTemplates);
    console.log(`✅ [Seed] Created ${services.length} services in INR.`);

    // 3. Create 60 customers each with 1 vehicle
    console.log('👥 [Seed] Creating 60 customers with individual vehicles...');
    const customerDocs = [];
    for (let i = 0; i < 60; i++) {
      const selectedBrand = faker.helpers.arrayElement(VEHICLE_CATALOG);
      const selectedModel = faker.helpers.arrayElement(selectedBrand.models);
      const year = faker.number.int({ min: 2016, max: 2024 });
      const plate = generateLicensePlate();

      customerDocs.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: `+91 ${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, India`,
        vehicles: [
          {
            make: selectedBrand.make,
            model: selectedModel,
            year,
            licensePlate: plate
          }
        ]
      });
    }

    const customers = await Customer.insertMany(customerDocs);
    console.log(`✅ [Seed] Created ${customers.length} customers with vehicles.`);

    // 4. Create 25 mechanics with random specialties and statuses
    console.log('🔧 [Seed] Creating 25 mechanics...');
    const allSpecialties = ['Engine', 'Tyres', 'AC', 'Brakes', 'General Service', 'Cosmetic', 'Battery'];
    const mechanicStatuses = ['available', 'busy', 'on_the_way', 'offline'] as const;

    const mechanicDocs = [];
    for (let i = 0; i < 25; i++) {
      const numSpecialties = faker.number.int({ min: 1, max: 3 });
      const specialties = faker.helpers.arrayElements(allSpecialties, numSpecialties);
      const status = faker.helpers.arrayElement(mechanicStatuses);
      const jobsCompleted = faker.number.int({ min: 12, max: 180 });
      const rating = Number((faker.number.float({ min: 4.1, max: 5.0 })).toFixed(1));

      mechanicDocs.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: `+91 ${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
        specialties,
        status,
        jobsCompleted,
        rating,
        currentBooking: null
      });
    }

    const mechanics = await Mechanic.insertMany(mechanicDocs);
    console.log(`✅ [Seed] Created ${mechanics.length} mechanics with ratings & specialties.`);

    // 5. Create 550 bookings spread over the past 90 days with realistic status distribution
    // Distribution:
    // ~55% Completed (~302)
    // ~10% Pending (~55)
    // ~10% Assigned (~55)
    // ~8% Mechanic On The Way (~44)
    // ~10% In Progress (~55)
    // ~7% Cancelled (~39)
    console.log('📦 [Seed] Generating 550 bookings over past 90 days (~55% Completed)...');
    const TOTAL_BOOKINGS = 550;
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const bookingDocs = [];

    // Pre-calculate target status counts
    const counts = {
      Completed: 302, // 54.9%
      Pending: 55,    // 10.0%
      Assigned: 55,   // 10.0%
      'Mechanic On The Way': 44, // 8.0%
      'In Progress': 55, // 10.0%
      Cancelled: 39    // 7.1%
    };

    const statusQueue: BookingStatus[] = [];
    Object.entries(counts).forEach(([status, count]) => {
      for (let i = 0; i < count; i++) {
        statusQueue.push(status as BookingStatus);
      }
    });

    // Shuffle status queue for random distribution over the loop
    const shuffledStatuses = faker.helpers.shuffle(statusQueue);

    for (let i = 0; i < TOTAL_BOOKINGS; i++) {
      const status = shuffledStatuses[i];
      const customer = faker.helpers.arrayElement(customers);
      const vehicle = customer.vehicles[0];
      const service = faker.helpers.arrayElement(services);

      // Bookings in active states are more recent; completed/cancelled spread over 90 days
      let bookingDate: Date;
      if (['Pending', 'Assigned', 'Mechanic On The Way', 'In Progress'].includes(status)) {
        // Created within last 3 days
        const daysAgo = faker.number.float({ min: 0.1, max: 3.0 });
        bookingDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      } else {
        // Completed or Cancelled over last 90 days
        bookingDate = faker.date.between({ from: ninetyDaysAgo, to: now });
      }

      // Mechanic assignment: required for Assigned, On The Way, In Progress, Completed
      let assignedMechanic: any = null;
      if (status !== 'Pending') {
        if (status === 'Cancelled') {
          // Cancelled bookings might or might not have had a mechanic assigned
          assignedMechanic = faker.datatype.boolean() ? faker.helpers.arrayElement(mechanics) : null;
        } else {
          assignedMechanic = faker.helpers.arrayElement(mechanics);
        }
      }

      // Generate realistic status history timeline
      const statusHistory = [];
      const createdTime = bookingDate.getTime();

      // Step 1: Pending
      statusHistory.push({
        status: 'Pending' as BookingStatus,
        timestamp: new Date(createdTime),
        note: 'Customer requested vehicle service via app'
      });

      // Step 2: Assigned
      if (['Assigned', 'Mechanic On The Way', 'In Progress', 'Completed'].includes(status)) {
        statusHistory.push({
          status: 'Assigned' as BookingStatus,
          timestamp: new Date(createdTime + 15 * 60 * 1000),
          note: `Dispatcher assigned to mechanic ${assignedMechanic?.name || 'field specialist'}`
        });
      }

      // Step 3: Mechanic On The Way
      if (['Mechanic On The Way', 'In Progress', 'Completed'].includes(status)) {
        statusHistory.push({
          status: 'Mechanic On The Way' as BookingStatus,
          timestamp: new Date(createdTime + 30 * 60 * 1000),
          note: 'Mechanic dispatched and en route to vehicle location'
        });
      }

      // Step 4: In Progress
      if (['In Progress', 'Completed'].includes(status)) {
        statusHistory.push({
          status: 'In Progress' as BookingStatus,
          timestamp: new Date(createdTime + 50 * 60 * 1000),
          note: 'Vehicle inspection done; service work started'
        });
      }

      // Step 5: Completed
      if (status === 'Completed') {
        statusHistory.push({
          status: 'Completed' as BookingStatus,
          timestamp: new Date(createdTime + 110 * 60 * 1000),
          note: 'Work completed, quality check verified, payment received'
        });
      }

      // Step 5 Alt: Cancelled
      if (status === 'Cancelled') {
        statusHistory.push({
          status: 'Cancelled' as BookingStatus,
          timestamp: new Date(createdTime + 20 * 60 * 1000),
          note: 'Booking cancelled by customer prior to commencement'
        });
      }

      const bookingId = `BK-${10000 + i}`;

      bookingDocs.push({
        bookingId,
        customer: customer._id,
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate
        },
        service: service._id,
        mechanic: assignedMechanic ? assignedMechanic._id : null,
        status,
        amount: service.basePrice,
        scheduledAt: bookingDate,
        createdAt: bookingDate,
        updatedAt: statusHistory[statusHistory.length - 1].timestamp,
        statusHistory
      });
    }

    const insertedBookings = await Booking.insertMany(bookingDocs);
    console.log(`✅ [Seed] Successfully created ${insertedBookings.length} bookings.`);

    // 6. Link active bookings to mechanics' currentBooking & sync status
    console.log('🔄 [Seed] Synchronizing active bookings with mechanic fleet...');
    const activeBookings = insertedBookings.filter((b) =>
      ['Assigned', 'Mechanic On The Way', 'In Progress'].includes(b.status) && b.mechanic
    );

    for (const b of activeBookings) {
      let desiredMechStatus = 'busy';
      if (b.status === 'Mechanic On The Way') desiredMechStatus = 'on_the_way';
      if (b.status === 'In Progress') desiredMechStatus = 'busy';
      if (b.status === 'Assigned') desiredMechStatus = 'busy';

      await Mechanic.findByIdAndUpdate(b.mechanic, {
        currentBooking: b._id,
        status: desiredMechStatus
      });
    }

    // Print summary table
    console.log('\n====================================================');
    console.log('📊 [Seed] DATABASE SEED SUMMARY:');
    console.log('====================================================');
    console.log(`• Services Catalog : ${services.length} items (Prices in INR ₹899 - ₹7,999)`);
    console.log(`• Customers Created : ${customers.length} (with 1 vehicle each)`);
    console.log(`• Mechanics Fleet   : ${mechanics.length} (ratings 4.1 - 5.0)`);
    console.log(`• Total Bookings    : ${insertedBookings.length}`);
    console.log(`  - Completed       : ${counts.Completed} (${((counts.Completed / 550) * 100).toFixed(1)}%)`);
    console.log(`  - Pending         : ${counts.Pending} (${((counts.Pending / 550) * 100).toFixed(1)}%)`);
    console.log(`  - Assigned        : ${counts.Assigned} (${((counts.Assigned / 550) * 100).toFixed(1)}%)`);
    console.log(`  - On The Way      : ${counts['Mechanic On The Way']} (${((counts['Mechanic On The Way'] / 550) * 100).toFixed(1)}%)`);
    console.log(`  - In Progress     : ${counts['In Progress']} (${((counts['In Progress'] / 550) * 100).toFixed(1)}%)`);
    console.log(`  - Cancelled       : ${counts.Cancelled} (${((counts.Cancelled / 550) * 100).toFixed(1)}%)`);
    console.log('• Date Range        : Past 90 Days to Today');
    console.log('====================================================\n');

    if (process.argv[1]?.includes('seedData')) {
      await mongoose.disconnect();
      console.log('👋 [Seed] Disconnected from MongoDB. Seed complete.');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ [Seed] Critical error during seeding:', error.message);
    if (process.argv[1]?.includes('seedData')) {
      process.exit(1);
    }
  }
};

if (process.argv[1]?.includes('seedData')) {
  seedDatabase();
}
