const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Affiliate, User, Transaction } = require('../../../src/models');
const affiliateService = require('../../../src/services/affiliate.service');
const ApiError = require('../../../src/utils/ApiError');

jest.mock('../../../src/models/affiliate.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/transaction.model');

describe('Affiliate service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAffiliate', () => {
    test('should create an affiliate successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const affiliateData = {
        user: userId,
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
        status: 'active',
      };

      // Mock user exists
      User.findById.mockResolvedValue({
        _id: userId,
        email: 'test@example.com',
      });

      // Mock affiliate doesn't exist yet
      Affiliate.findOne.mockResolvedValue(null);

      // Mock successful creation
      Affiliate.create.mockResolvedValue(affiliateData);

      const result = await affiliateService.createAffiliate(userId, affiliateData);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Affiliate.findOne).toHaveBeenCalledWith({ user: userId });
      expect(Affiliate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          referralCode: 'TESTCODE123',
          commissionRate: 0.1,
          status: 'active',
        }),
      );
      expect(result).toEqual(affiliateData);
    });

    test('should throw error if user does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const affiliateData = {
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
      };

      // Mock user doesn't exist
      User.findById.mockResolvedValue(null);

      await expect(affiliateService.createAffiliate(userId, affiliateData)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found'),
      );

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Affiliate.create).not.toHaveBeenCalled();
    });

    test('should throw error if affiliate already exists for user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const existingAffiliate = {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        referralCode: 'EXISTINGCODE',
      };
      const affiliateData = {
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
      };

      // Mock user exists
      User.findById.mockResolvedValue({
        _id: userId,
        email: 'test@example.com',
      });

      // Mock affiliate already exists
      Affiliate.findOne.mockResolvedValue(existingAffiliate);

      await expect(affiliateService.createAffiliate(userId, affiliateData)).rejects.toThrow(
        new ApiError(httpStatus.CONFLICT, 'Affiliate already exists for this user'),
      );

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Affiliate.findOne).toHaveBeenCalledWith({ user: userId });
      expect(Affiliate.create).not.toHaveBeenCalled();
    });

    test('should generate unique referral code if not provided', async () => {
      const userId = new mongoose.Types.ObjectId();
      const affiliateData = {
        commissionRate: 0.1,
        status: 'active',
      };

      // Mock user exists
      User.findById.mockResolvedValue({
        _id: userId,
        email: 'test@example.com',
      });

      // Mock affiliate doesn't exist yet
      Affiliate.findOne.mockResolvedValue(null);

      // Mock successful creation with generated code
      Affiliate.create.mockImplementation((data) =>
        Promise.resolve({
          ...data,
          referralCode: expect.any(String),
        }),
      );

      const result = await affiliateService.createAffiliate(userId, affiliateData);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Affiliate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          referralCode: expect.any(String),
          commissionRate: 0.1,
          status: 'active',
        }),
      );
      expect(result.referralCode).toBeDefined();
    });
  });

  describe('getAffiliateById', () => {
    test('should return affiliate by id successfully', async () => {
      const affiliateId = new mongoose.Types.ObjectId();
      const affiliate = {
        _id: affiliateId,
        user: new mongoose.Types.ObjectId(),
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
      };

      Affiliate.findById.mockResolvedValue(affiliate);

      const result = await affiliateService.getAffiliateById(affiliateId);

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(result).toEqual(affiliate);
    });

    test('should return null if affiliate does not exist', async () => {
      const affiliateId = new mongoose.Types.ObjectId();

      Affiliate.findById.mockResolvedValue(null);

      const result = await affiliateService.getAffiliateById(affiliateId);

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(result).toBeNull();
    });
  });

  describe('getAffiliateByUserId', () => {
    test('should return affiliate by user id successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const affiliate = {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
      };

      Affiliate.findOne.mockResolvedValue(affiliate);

      const result = await affiliateService.getAffiliateByUserId(userId);

      expect(Affiliate.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual(affiliate);
    });

    test('should return null if affiliate does not exist for user', async () => {
      const userId = new mongoose.Types.ObjectId();

      Affiliate.findOne.mockResolvedValue(null);

      const result = await affiliateService.getAffiliateByUserId(userId);

      expect(Affiliate.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result).toBeNull();
    });
  });

  describe('getAffiliateByReferralCode', () => {
    test('should return affiliate by referral code successfully', async () => {
      const referralCode = 'TESTCODE123';
      const affiliate = {
        _id: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        referralCode,
        commissionRate: 0.1,
      };

      Affiliate.findOne.mockResolvedValue(affiliate);

      const result = await affiliateService.getAffiliateByReferralCode(referralCode);

      expect(Affiliate.findOne).toHaveBeenCalledWith({ referralCode });
      expect(result).toEqual(affiliate);
    });

    test('should return null if referral code does not exist', async () => {
      const referralCode = 'NONEXISTENT';

      Affiliate.findOne.mockResolvedValue(null);

      const result = await affiliateService.getAffiliateByReferralCode(referralCode);

      expect(Affiliate.findOne).toHaveBeenCalledWith({ referralCode });
      expect(result).toBeNull();
    });
  });

  describe('trackReferral', () => {
    test('should track referral successfully', async () => {
      const referralCode = 'TESTCODE123';
      const referredUserId = new mongoose.Types.ObjectId();
      const affiliateId = new mongoose.Types.ObjectId();
      const affiliate = {
        _id: affiliateId,
        user: new mongoose.Types.ObjectId(),
        referralCode,
        commissionRate: 0.1,
        referredUsers: [],
      };

      Affiliate.findOne.mockResolvedValue(affiliate);
      User.findById.mockResolvedValue({ _id: referredUserId, email: 'referred@example.com' });
      Affiliate.findOneAndUpdate.mockResolvedValue({
        ...affiliate,
        referredUsers: [referredUserId],
      });

      const result = await affiliateService.trackReferral(referralCode, referredUserId);

      expect(Affiliate.findOne).toHaveBeenCalledWith({ referralCode });
      expect(User.findById).toHaveBeenCalledWith(referredUserId);
      expect(Affiliate.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: affiliateId },
        { $addToSet: { referredUsers: referredUserId } },
        { new: true },
      );
      expect(result.referredUsers).toContain(referredUserId);
    });

    test('should throw error if referral code does not exist', async () => {
      const referralCode = 'NONEXISTENT';
      const referredUserId = new mongoose.Types.ObjectId();

      Affiliate.findOne.mockResolvedValue(null);

      await expect(affiliateService.trackReferral(referralCode, referredUserId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found'),
      );

      expect(Affiliate.findOne).toHaveBeenCalledWith({ referralCode });
      expect(Affiliate.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('should throw error if referred user does not exist', async () => {
      const referralCode = 'TESTCODE123';
      const referredUserId = new mongoose.Types.ObjectId();
      const affiliate = {
        _id: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        referralCode,
        commissionRate: 0.1,
      };

      Affiliate.findOne.mockResolvedValue(affiliate);
      User.findById.mockResolvedValue(null);

      await expect(affiliateService.trackReferral(referralCode, referredUserId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Referred user not found'),
      );

      expect(Affiliate.findOne).toHaveBeenCalledWith({ referralCode });
      expect(User.findById).toHaveBeenCalledWith(referredUserId);
      expect(Affiliate.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('calculateCommission', () => {
    test('should calculate commission based on amount and affiliate rate', async () => {
      const affiliateId = new mongoose.Types.ObjectId();
      const amount = 100;
      const commissionRate = 0.1; // 10%
      const affiliate = {
        _id: affiliateId,
        user: new mongoose.Types.ObjectId(),
        referralCode: 'TESTCODE123',
        commissionRate,
      };

      Affiliate.findById.mockResolvedValue(affiliate);

      const commission = await affiliateService.calculateCommission(affiliateId, amount);

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(commission).toBe(amount * commissionRate);
    });

    test('should throw error if affiliate does not exist', async () => {
      const affiliateId = new mongoose.Types.ObjectId();
      const amount = 100;

      Affiliate.findById.mockResolvedValue(null);

      await expect(affiliateService.calculateCommission(affiliateId, amount)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found'),
      );

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
    });
  });

  describe('recordCommission', () => {
    test('should record commission transaction successfully', async () => {
      const affiliateId = new mongoose.Types.ObjectId();
      const amount = 10; // Commission amount
      const sourceId = new mongoose.Types.ObjectId(); // Source transaction/order ID
      const affiliate = {
        _id: affiliateId,
        user: new mongoose.Types.ObjectId(),
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
        totalCommission: 0,
      };

      const transactionData = {
        affiliate: affiliateId,
        amount,
        sourceId,
        type: 'commission',
        status: 'pending',
      };

      const savedTransaction = {
        ...transactionData,
        _id: new mongoose.Types.ObjectId(),
      };

      Affiliate.findById.mockResolvedValue(affiliate);
      Transaction.create.mockResolvedValue(savedTransaction);
      Affiliate.findByIdAndUpdate.mockResolvedValue({
        ...affiliate,
        totalCommission: amount,
      });

      const result = await affiliateService.recordCommission(affiliateId, amount, sourceId);

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(Transaction.create).toHaveBeenCalledWith(transactionData);
      expect(Affiliate.findByIdAndUpdate).toHaveBeenCalledWith(
        affiliateId,
        { $inc: { totalCommission: amount } },
        { new: true },
      );
      expect(result).toEqual(savedTransaction);
    });

    test('should throw error if affiliate does not exist', async () => {
      const affiliateId = new mongoose.Types.ObjectId();
      const amount = 10;
      const sourceId = new mongoose.Types.ObjectId();

      Affiliate.findById.mockResolvedValue(null);

      await expect(
        affiliateService.recordCommission(affiliateId, amount, sourceId),
      ).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found'));

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(Transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('getAffiliateStats', () => {
    test('should return affiliate statistics successfully', async () => {
      const affiliateId = new mongoose.Types.ObjectId();
      const affiliate = {
        _id: affiliateId,
        user: new mongoose.Types.ObjectId(),
        referralCode: 'TESTCODE123',
        commissionRate: 0.1,
        totalCommission: 50,
        referredUsers: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      };

      const transactions = [
        { _id: new mongoose.Types.ObjectId(), amount: 20, status: 'completed' },
        { _id: new mongoose.Types.ObjectId(), amount: 30, status: 'pending' },
      ];

      Affiliate.findById.mockResolvedValue(affiliate);
      Transaction.find.mockResolvedValue(transactions);
      Transaction.aggregate.mockResolvedValue([
        { _id: 'completed', total: 20 },
        { _id: 'pending', total: 30 },
      ]);

      const result = await affiliateService.getAffiliateStats(affiliateId);

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(Transaction.find).toHaveBeenCalledWith({ affiliate: affiliateId });
      expect(Transaction.aggregate).toHaveBeenCalled();
      expect(result).toEqual({
        totalReferrals: affiliate.referredUsers.length,
        totalCommission: affiliate.totalCommission,
        transactions,
        commissionByStatus: {
          completed: 20,
          pending: 30,
        },
      });
    });

    test('should throw error if affiliate does not exist', async () => {
      const affiliateId = new mongoose.Types.ObjectId();

      Affiliate.findById.mockResolvedValue(null);

      await expect(affiliateService.getAffiliateStats(affiliateId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found'),
      );

      expect(Affiliate.findById).toHaveBeenCalledWith(affiliateId);
      expect(Transaction.find).not.toHaveBeenCalled();
    });
  });
});
