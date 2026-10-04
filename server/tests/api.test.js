import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../models/User.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import Match from '../models/Match.js';
import Claim from '../models/Claim.js';
import Handover from '../models/Handover.js';

import { compareItems } from '../services/matchingService.js';
import { generateSecureOTP, verifyOTP } from '../utils/otpGenerator.js';
import { calculateLocationScore } from '../utils/distanceCalculator.js';
import { calculateTimeScore } from '../utils/timeDecay.js';

let mongoServer;

describe('Smart Lost & Found - Core Backend Test Suite', () => {
  let adminUser, normalUser, finderUser;
  let testLostItem, testFoundItem;
  let testClaim, testHandover;
  let rawOtp;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  // 1. User Registration & Password Hashing
  it('1. Should register user and hash password securely', async () => {
    normalUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
      passwordHash: 'SecretPass123',
      role: 'user',
    });

    assert.ok(normalUser._id);
    assert.equal(normalUser.email, 'john@example.com');
    assert.notEqual(normalUser.passwordHash, 'SecretPass123'); // Must be hashed!
    assert.equal(normalUser.role, 'user');
  });

  // 2. User Authentication & Login Verification
  it('2. Should verify valid credentials and generate JWT token', async () => {
    const user = await User.findById(normalUser._id).select('+passwordHash');
    const isCorrect = await user.matchPassword('SecretPass123');
    const isWrong = await user.matchPassword('WrongPass');

    assert.equal(isCorrect, true);
    assert.equal(isWrong, false);

    const token = user.getSignedJwtToken();
    assert.ok(token);
    assert.equal(typeof token, 'string');
  });

  // 3. Admin User Creation and Role Check
  it('3. Should create Admin user and Finder user', async () => {
    adminUser = await User.create({
      name: 'Admin Officer',
      email: 'admin@example.com',
      phone: '+1-555-999-0000',
      passwordHash: 'AdminSecret999',
      role: 'admin',
    });

    finderUser = await User.create({
      name: 'Security Officer',
      email: 'finder@example.com',
      phone: '+1-555-888-1111',
      passwordHash: 'FinderSecret888',
      role: 'finder',
    });

    assert.equal(adminUser.role, 'admin');
    assert.equal(finderUser.role, 'finder');
  });

  // 4. Lost Item Creation
  it('4. Should create a Lost Item report', async () => {
    testLostItem = await LostItem.create({
      userId: normalUser._id,
      title: 'Black laptop bag lost near college library',
      description: 'Black laptop bag with Nike branding and red keychain',
      category: 'Bags & Luggage',
      brand: 'Nike',
      color: 'Black',
      lostLocation: 'College Library, 2nd Floor',
      lostDate: new Date('2026-10-01T14:00:00Z'),
      lostTime: '14:00',
      status: 'reported',
    });

    assert.ok(testLostItem._id);
    assert.equal(testLostItem.title, 'Black laptop bag lost near college library');
    assert.equal(testLostItem.status, 'reported');
  });

  // 5. Found Item Creation
  it('5. Should create a Found Item report', async () => {
    testFoundItem = await FoundItem.create({
      finderId: finderUser._id,
      title: 'Black backpack found outside central library',
      description: 'Black backpack / school bag with Nike logo and red tag',
      category: 'Bags & Luggage',
      brand: 'Nike',
      color: 'Black',
      foundLocation: 'Outside Central Library bench',
      foundDate: new Date('2026-10-01T14:40:00Z'),
      foundTime: '14:40',
      currentStorageLocation: 'Campus Security Safe Box #1',
      status: 'reported',
    });

    assert.ok(testFoundItem._id);
    assert.equal(testFoundItem.brand, 'Nike');
    assert.equal(testFoundItem.status, 'reported');
  });

  // 6. AI Matching Engine Scoring
  it('6. Should evaluate AI Match score between similar lost and found items', async () => {
    const comparison = await compareItems(testLostItem, testFoundItem);

    assert.ok(comparison.finalScore >= 65, `Expected score >= 65 but got ${comparison.finalScore}`);
    assert.ok(comparison.textScore >= 60, `Expected textScore >= 60 but got ${comparison.textScore}`);
    assert.equal(comparison.categoryScore, 90);
    assert.equal(comparison.brandScore, 100);
    assert.equal(comparison.colorScore, 100);
    assert.ok(comparison.matchReason.length > 0);

    const savedMatch = await Match.create({
      lostItemId: testLostItem._id,
      foundItemId: testFoundItem._id,
      ...comparison,
    });

    assert.ok(savedMatch._id);
  });

  // 7. Location & Time Similarity Calculations
  it('7. Should accurately calculate distance and time decay scores', () => {
    // Exact location
    const exactLocScore = calculateLocationScore('Library', 'Library');
    assert.equal(exactLocScore, 100);

    // Coordinate proximity: ~20 meters
    const closeCoordsScore = calculateLocationScore(
      'Loc A',
      'Loc B',
      37.7749,
      -122.4194,
      37.7750,
      -122.4193
    );
    assert.ok(closeCoordsScore >= 90);

    // Time decay: found 40 mins later
    const timeScore = calculateTimeScore(
      new Date('2026-10-01T14:00:00Z'),
      new Date('2026-10-01T14:40:00Z'),
      '14:00',
      '14:40'
    );
    assert.ok(timeScore >= 95);
  });

  // 8. Ownership Claim Submission
  it('8. Should submit an ownership claim with questionnaire answers', async () => {
    testClaim = await Claim.create({
      foundItemId: testFoundItem._id,
      lostItemId: testLostItem._id,
      claimantId: normalUser._id,
      verificationAnswers: {
        itemBrand: 'Nike',
        uniqueMarks: 'Red keychain attached',
        exactLostLocation: 'College Library 2nd Floor',
      },
      verificationScore: 85,
      verificationStatus: 'pending',
    });

    assert.ok(testClaim._id);
    assert.equal(testClaim.verificationStatus, 'pending');
    assert.equal(testClaim.verificationScore, 85);
  });

  // 9. Admin Authorization & Claim Approval
  it('9. Should approve claim and initialize handover', async () => {
    testClaim.verificationStatus = 'approved';
    testClaim.approvedBy = adminUser._id;
    await testClaim.save();

    const { otp, otpHash } = await generateSecureOTP();
    rawOtp = otp;

    testHandover = await Handover.create({
      claimId: testClaim._id,
      ownerId: normalUser._id,
      finderId: finderUser._id,
      adminId: adminUser._id,
      otpHash,
      handoverLocation: 'Campus Security Main Office',
      status: 'pending',
    });

    assert.ok(testHandover._id);
    assert.equal(testHandover.status, 'pending');
    assert.equal(rawOtp.length, 6);
  });

  // 10. OTP Handover Verification
  it('10. Should verify 6-digit OTP and complete handover marking item returned', async () => {
    const loadedHandover = await Handover.findById(testHandover._id).select('+otpHash');

    // Test incorrect OTP
    const isWrongOtpValid = await loadedHandover.verifyOTP('000000');
    assert.equal(isWrongOtpValid, false);

    // Test correct OTP
    const isCorrectOtpValid = await loadedHandover.verifyOTP(rawOtp);
    assert.equal(isCorrectOtpValid, true);

    // Complete handover
    loadedHandover.status = 'completed';
    loadedHandover.verifiedAt = new Date();
    await loadedHandover.save();

    // Mark item returned
    await FoundItem.findByIdAndUpdate(testFoundItem._id, { status: 'returned' });
    const updatedFoundItem = await FoundItem.findById(testFoundItem._id);

    assert.equal(loadedHandover.status, 'completed');
    assert.equal(updatedFoundItem.status, 'returned');
  });
});
