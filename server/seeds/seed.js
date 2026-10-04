import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB, { closeDB } from '../config/db.js';
import User from '../models/User.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import Match from '../models/Match.js';
import Claim from '../models/Claim.js';
import Handover from '../models/Handover.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { runGlobalMatchingEngine } from '../services/matchingService.js';
import { generateSecureOTP } from '../utils/otpGenerator.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting comprehensive database seed...');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      LostItem.deleteMany(),
      FoundItem.deleteMany(),
      Match.deleteMany(),
      Claim.deleteMany(),
      Handover.deleteMany(),
      Notification.deleteMany(),
      AuditLog.deleteMany(),
    ]);
    console.log('🧹 Cleaned existing collections.');

    // 1. Create Users
    // Admin (DEVELOPMENT ONLY credentials)
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@smartlostfound.edu',
      phone: '+1 (555) 019-2834',
      passwordHash: 'Admin@12345',
      role: 'admin',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    // 3 Regular users & finder
    const student1 = await User.create({
      name: 'Sachin Patel',
      email: 'sachin.patel@student.edu',
      phone: '+1 (555) 345-6789',
      passwordHash: 'Student@123',
      role: 'user',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    });

    const student2 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah.c@student.edu',
      phone: '+1 (555) 456-7890',
      passwordHash: 'Student@123',
      role: 'user',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    });

    const finderSecurity = await User.create({
      name: 'Officer Marcus Vance',
      email: 'security.marcus@campus.edu',
      phone: '+1 (555) 890-1234',
      passwordHash: 'Security@123',
      role: 'finder',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    });

    console.log('✅ Created 4 users (1 Admin, 2 Students, 1 Security Officer).');

    // 2. Create 10 Lost Items
    const lostItemsData = [
      {
        userId: student1._id,
        title: 'Black laptop bag lost near college library',
        description: 'Black water-resistant laptop bag with padded shoulder straps and Nike logo on front pocket. Contains Dell XPS 15 charger inside.',
        category: 'Bags & Luggage',
        subcategory: 'Laptop Bags',
        brand: 'Nike',
        color: 'Black',
        condition: 'Good',
        serialNumber: 'NK-BG-8891',
        uniqueFeatures: 'Small scratch on front zipper pull; red keychain attached to left carabiner',
        imageUrls: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'College Library, 2nd Floor Study Room',
        latitude: 37.7749,
        longitude: -122.4194,
        lostDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lostTime: '14:30',
        status: 'reported',
      },
      {
        userId: student2._id,
        title: 'Apple iPhone 15 Pro with navy blue case',
        description: 'Space Gray iPhone 15 Pro 256GB with dark blue MagSafe silicone case and privacy screen protector.',
        category: 'Electronics',
        subcategory: 'Smartphones',
        brand: 'Apple',
        color: 'Blue',
        condition: 'Like New',
        uniqueFeatures: 'Lockscreen has a golden retriever wallpaper',
        imageUrls: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Main Campus Cafeteria / Canteen',
        latitude: 37.7752,
        longitude: -122.4188,
        lostDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lostTime: '12:15',
        status: 'reported',
      },
      {
        userId: student1._id,
        title: 'Brown leather bifold wallet',
        description: 'Fossil brown leather bifold wallet with campus student ID card and driver license inside.',
        category: 'Wallets & Cards',
        subcategory: 'Wallets',
        brand: 'Fossil',
        color: 'Brown',
        condition: 'Fair',
        uniqueFeatures: 'Initials S.P. embossed inside fold',
        imageUrls: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Student Union Lounge',
        latitude: 37.7745,
        longitude: -122.4199,
        lostDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        lostTime: '16:45',
        status: 'reported',
      },
      {
        userId: student2._id,
        title: 'Sony WH-1000XM5 Silver Noise-Cancelling Headphones',
        description: 'Silver wireless over-ear headphones in original grey zippered hardshell carry case.',
        category: 'Electronics',
        subcategory: 'Audio',
        brand: 'Sony',
        color: 'Silver',
        condition: 'Like New',
        uniqueFeatures: 'Left earcup has tiny green dot sticker',
        imageUrls: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Science Building Auditorium B',
        latitude: 37.7760,
        longitude: -122.4175,
        lostDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lostTime: '11:00',
        status: 'reported',
      },
      {
        userId: student1._id,
        title: 'Hydro Flask 32oz Wide Mouth Water Bottle',
        description: 'White insulated hydro flask covered with national park stickers and silicone boot.',
        category: 'Keys & Accessories',
        subcategory: 'Water Bottles',
        brand: 'Hydro Flask',
        color: 'White',
        condition: 'Good',
        uniqueFeatures: 'Yosemite and Grand Canyon stickers',
        imageUrls: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Gymnasium & Fitness Center locker area',
        latitude: 37.7735,
        longitude: -122.4210,
        lostDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lostTime: '08:30',
        status: 'reported',
      },
      {
        userId: student2._id,
        title: 'MacBook Pro 14 M2 in Space Gray',
        description: 'Apple MacBook Pro 14-inch in clear hard case with university parking sticker on lid.',
        category: 'Electronics',
        subcategory: 'Computers',
        brand: 'Apple',
        color: 'Grey',
        condition: 'Like New',
        serialNumber: 'C02G9981MD6R',
        uniqueFeatures: 'Clear speck case with purple keyboard protector',
        imageUrls: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Computer Science Lab 304',
        latitude: 37.7758,
        longitude: -122.4182,
        lostDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lostTime: '17:30',
        status: 'reported',
      },
      {
        userId: student1._id,
        title: 'Ray-Ban Wayfarer Polarized Sunglasses',
        description: 'Classic matte black frame with green polarized lenses in black Ray-Ban leather pouch.',
        category: 'Clothing & Wearables',
        subcategory: 'Eyewear',
        brand: 'Ray-Ban',
        color: 'Black',
        condition: 'Good',
        uniqueFeatures: 'Small scratch on right frame hinge',
        imageUrls: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Outdoor Quad picnic tables',
        latitude: 37.7747,
        longitude: -122.4191,
        lostDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        lostTime: '13:00',
        status: 'reported',
      },
      {
        userId: student2._id,
        title: 'Toyota Car Key Fob with Marvel Keychain',
        description: 'Black electronic smart key fob with Spider-man metal keychain and gym barcode tag.',
        category: 'Keys & Accessories',
        subcategory: 'Keys',
        brand: 'Toyota',
        color: 'Black',
        condition: 'Good',
        uniqueFeatures: 'Planet Fitness barcode on back',
        imageUrls: [
          'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'North Student Parking Lot C',
        latitude: 37.7765,
        longitude: -122.4160,
        lostDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lostTime: '18:10',
        status: 'reported',
      },
      {
        userId: student1._id,
        title: 'Patagonia Better Sweater Fleece Jacket',
        description: 'Men size M stonewash grey quarter-zip fleece jacket left in lecture hall.',
        category: 'Clothing & Wearables',
        subcategory: 'Jackets',
        brand: 'Patagonia',
        color: 'Grey',
        condition: 'Good',
        uniqueFeatures: 'Dry cleaning tag still attached inside collar',
        imageUrls: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Engineering Hall Lecture Room 101',
        latitude: 37.7755,
        longitude: -122.4178,
        lostDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lostTime: '10:00',
        status: 'reported',
      },
      {
        userId: student2._id,
        title: 'Calculus 8th Edition Hardcover Textbook',
        description: 'James Stewart Early Transcendentals calculus textbook with yellow highlighter marks throughout chapter 4.',
        category: 'Books & Documents',
        subcategory: 'Textbooks',
        brand: 'Cengage',
        color: 'Blue',
        condition: 'Fair',
        uniqueFeatures: 'Name Connor written in pencil on inner cover page',
        imageUrls: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        ],
        lostLocation: 'Mathematics Department 3rd Floor study booth',
        latitude: 37.7750,
        longitude: -122.4190,
        lostDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lostTime: '15:20',
        status: 'reported',
      },
    ];

    const lostItems = await LostItem.create(lostItemsData);
    console.log(`✅ Seeded ${lostItems.length} Lost Items.`);

    // 3. Create 10 Found Items (Designed to pair with lost items for AI demonstration!)
    const foundItemsData = [
      {
        finderId: finderSecurity._id,
        title: 'Black backpack found outside central library',
        description: 'Black backpack / laptop bag having Nike branding and multiple compartments with power adapter inside.',
        category: 'Bags & Luggage',
        subcategory: 'Laptop Bags',
        brand: 'Nike',
        color: 'Black',
        condition: 'Good',
        uniqueFeatures: 'Small scratch on front zipper; red key tag attached on left strap',
        imageUrls: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Outside Central Library bench near main entrance',
        latitude: 37.7750,
        longitude: -122.4193,
        foundDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000), // 40 mins later
        foundTime: '15:10',
        currentStorageLocation: 'Campus Security Safe Box #14',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Dark blue smartphone turned into cafeteria counter',
        description: 'Apple iPhone with dark blue protective case found on dining table near drink fountain.',
        category: 'Electronics',
        subcategory: 'Smartphones',
        brand: 'Apple',
        color: 'Blue',
        condition: 'Like New',
        uniqueFeatures: 'Dog picture visible on lock screen',
        imageUrls: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Main Campus Dining Hall / Canteen Table 12',
        latitude: 37.7753,
        longitude: -122.4187,
        foundDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        foundTime: '12:45',
        currentStorageLocation: 'Campus Security Lost & Found Desk',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Brown men wallet recovered from lounge sofa',
        description: 'Leather bifold wallet containing student cards and cash handed over by custodial staff.',
        category: 'Wallets & Cards',
        subcategory: 'Wallets',
        brand: 'Fossil',
        color: 'Brown',
        condition: 'Fair',
        uniqueFeatures: 'Initials S.P. visible on inner pocket',
        imageUrls: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Student Union Lounge Couch #2',
        latitude: 37.7746,
        longitude: -122.4198,
        foundDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        foundTime: '17:45',
        currentStorageLocation: 'Campus Security Safe Box #09',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Silver over-ear wireless headphones in case',
        description: 'High-end noise cancelling headphones found left on seat in auditorium.',
        category: 'Electronics',
        subcategory: 'Audio',
        brand: 'Sony',
        color: 'Silver',
        condition: 'Like New',
        uniqueFeatures: 'Small green sticker mark',
        imageUrls: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Auditorium B Row G',
        latitude: 37.7761,
        longitude: -122.4174,
        foundDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        foundTime: '13:00',
        currentStorageLocation: 'Campus Security Locker #4',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Insulated white water bottle with park stickers',
        description: 'Hydro Flask stainless steel vacuum insulated bottle with colourful stickers.',
        category: 'Keys & Accessories',
        subcategory: 'Water Bottles',
        brand: 'Hydro Flask',
        color: 'White',
        condition: 'Good',
        uniqueFeatures: 'National park sticker collection',
        imageUrls: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Campus Recreation Center gym locker room',
        latitude: 37.7736,
        longitude: -122.4209,
        foundDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        foundTime: '09:15',
        currentStorageLocation: 'Gym Front Reception',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Apple laptop left on work desk in CS lab',
        description: 'Space grey MacBook Pro in protective casing found after evening lab session.',
        category: 'Electronics',
        subcategory: 'Computers',
        brand: 'Apple',
        color: 'Grey',
        condition: 'Like New',
        uniqueFeatures: 'Campus decal on upper shell',
        imageUrls: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Computer Science Lab 304 Station 16',
        latitude: 37.7758,
        longitude: -122.4182,
        foundDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
        foundTime: '18:30',
        currentStorageLocation: 'Department Head Office Vault',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Designer dark sunglasses found on grass near picnic table',
        description: 'Ray-Ban black frame sunglasses found in grass near the quad.',
        category: 'Clothing & Wearables',
        subcategory: 'Eyewear',
        brand: 'Ray-Ban',
        color: 'Black',
        condition: 'Good',
        uniqueFeatures: 'Hinge mark on arm',
        imageUrls: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Quad Lawn Area picnic table #4',
        latitude: 37.7748,
        longitude: -122.4192,
        foundDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
        foundTime: '13:15',
        currentStorageLocation: 'Campus Security Main Office',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Automobile remote key with comic character keytag',
        description: 'Car electronic key with Spider-man figure tag picked up in parking area.',
        category: 'Keys & Accessories',
        subcategory: 'Keys',
        brand: 'Toyota',
        color: 'Black',
        condition: 'Good',
        uniqueFeatures: 'Gym membership tag',
        imageUrls: [
          'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Lot C row 4 pavement',
        latitude: 37.7766,
        longitude: -122.4159,
        foundDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
        foundTime: '18:30',
        currentStorageLocation: 'Campus Security Safe Box #02',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Grey zip sweater found draped over lecture chair',
        description: 'Patagonia mens fleece sweater stonewash grey.',
        category: 'Clothing & Wearables',
        subcategory: 'Jackets',
        brand: 'Patagonia',
        color: 'Grey',
        condition: 'Good',
        uniqueFeatures: 'Dry cleaning tag inside',
        imageUrls: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Lecture Hall 101 front row',
        latitude: 37.7756,
        longitude: -122.4177,
        foundDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        foundTime: '10:30',
        currentStorageLocation: 'Engineering Department Admin Office',
        status: 'reported',
      },
      {
        finderId: finderSecurity._id,
        title: 'Mathematics textbook found in study booth',
        description: 'Calculus college textbook with yellow highlighted notes.',
        category: 'Books & Documents',
        subcategory: 'Textbooks',
        brand: 'Cengage',
        color: 'Blue',
        condition: 'Fair',
        uniqueFeatures: 'Pencil marking on opening page',
        imageUrls: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        ],
        foundLocation: 'Math Building 3rd floor quiet area',
        latitude: 37.7751,
        longitude: -122.4189,
        foundDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        foundTime: '16:00',
        currentStorageLocation: 'Campus Security Main Office',
        status: 'reported',
      },
    ];

    const foundItems = await FoundItem.create(foundItemsData);
    console.log(`✅ Seeded ${foundItems.length} Found Items.`);

    // 4. Run AI Matching Engine across the seeded items
    console.log('🤖 Running AI Matching Engine to pair lost & found records...');
    const createdMatches = await runGlobalMatchingEngine();
    console.log(`✅ AI Matching completed. Generated ${createdMatches.length} potential matches.`);

    // 5. Create Sample Ownership Claims & Handover
    const highMatch = await Match.findOne({ confidenceLevel: 'HIGH CONFIDENCE' })
      .populate('lostItemId foundItemId');

    if (highMatch) {
      // Create pending claim
      const claim1 = await Claim.create({
        matchId: highMatch._id,
        lostItemId: highMatch.lostItemId._id,
        foundItemId: highMatch.foundItemId._id,
        claimantId: student1._id,
        verificationAnswers: {
          itemBrand: highMatch.lostItemId.brand,
          uniqueMarks: 'Small scratch on front zipper pull; red keychain attached to left carabiner',
          contentsInside: 'Dell XPS 15 charger, blue spiral notebook, USB-C adapter cable',
          exactLostLocation: 'College Library, 2nd Floor Study Room near window desk',
          hiddenFeatures: 'Inner lining has a hidden zippered passport compartment',
          additionalProof: 'Can provide receipt of charger and student ID card matching registration',
        },
        verificationScore: 92,
        verificationStatus: 'approved',
        adminNotes: 'Verified with security officer; photos and unique marks align accurately.',
        approvedBy: adminUser._id,
      });

      // Create Handover record with secure hashed OTP
      const { otp, otpHash } = await generateSecureOTP();
      const handover = await Handover.create({
        claimId: claim1._id,
        ownerId: student1._id,
        finderId: finderSecurity._id,
        adminId: adminUser._id,
        otpHash,
        handoverLocation: 'Campus Security Main Office (Desk #3)',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        scheduledTime: '2:00 PM - 4:00 PM',
        status: 'pending',
      });

      // Create notification for student1 with OTP
      await Notification.create({
        userId: student1._id,
        type: 'handover_scheduled',
        title: 'Claim Approved! Your Handover OTP is Ready',
        message: `Your claim for "${highMatch.foundItemId.title}" has been approved. Your 6-digit Handover OTP is: ${otp}. Present this OTP at ${handover.handoverLocation}.`,
        relatedItemId: handover._id,
        relatedItemModel: 'Claim',
      });

      console.log(`✅ Created approved claim & handover for high-confidence match with sample OTP: ${otp}`);
    }

    // Additional sample notifications
    await Notification.create([
      {
        userId: student2._id,
        type: 'match_found',
        title: 'Potential Match (HIGH CONFIDENCE) Found!',
        message: 'An item matching "Apple iPhone 15 Pro" was found at Main Campus Dining Hall with 93% confidence.',
        isRead: false,
      },
      {
        userId: student1._id,
        type: 'system_alert',
        title: 'Welcome to Smart Lost & Found System',
        message: 'Your account is ready. Report lost or found items anytime to let our AI match engine assist you.',
        isRead: true,
      },
    ]);

    // Initial audit log entries
    await AuditLog.create([
      {
        user: adminUser._id,
        action: 'SYSTEM_INITIALIZED',
        target: 'database',
        metadata: { version: '1.0.0' },
      },
      {
        user: student1._id,
        action: 'LOST_ITEM_REPORTED',
        target: lostItems[0]._id.toString(),
        metadata: { title: lostItems[0].title },
      },
      {
        user: finderSecurity._id,
        action: 'FOUND_ITEM_REPORTED',
        target: foundItems[0]._id.toString(),
        metadata: { title: foundItems[0].title },
      },
    ]);

    console.log('\n==================================================');
    console.log('🎉 Database Seeding Completed Successfully!');
    console.log('==================================================');
    console.log('Default Seed Accounts:');
    console.log('1. Admin:    admin@smartlostfound.edu     | Password: Admin@12345 (DEV ONLY)');
    console.log('2. User 1:   sachin.patel@student.edu    | Password: Student@123');
    console.log('3. User 2:   sarah.c@student.edu         | Password: Student@123');
    console.log('4. Finder:   security.marcus@campus.edu  | Password: Security@123');
    console.log('==================================================\n');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
