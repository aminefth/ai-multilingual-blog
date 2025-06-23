const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');

class UserFactory {
  constructor(overrides = {}) {
    this.data = {
      _id: new mongoose.Types.ObjectId(),
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password: 'Password123!',
      role: 'user',
      isEmailVerified: false,
      ...overrides,
    };
  }

  withRole(role) {
    this.data.role = role;
    return this;
  }

  verified() {
    this.data.isEmailVerified = true;
    return this;
  }

  withSubscription(status = 'active') {
    this.data.subscription = {
      status,
      planId: 'price_monthly',
      subscriptionId: `sub_${faker.datatype.uuid()}`,
      currentPeriodEnd: faker.date.future(),
    };
    return this;
  }

  build() {
    return this.data;
  }

  async create() {
    // Hash password before creation
    const salt = bcrypt.genSaltSync(8);
    const hashedPassword = bcrypt.hashSync(this.data.password, salt);

    const user = new User({
      ...this.data,
      password: hashedPassword,
    });
    await user.save();
    return user;
  }

  static async createMany(count, overrides = {}) {
    const salt = bcrypt.genSaltSync(8);
    const hashedPassword = bcrypt.hashSync(overrides.password || 'Password123!', salt);

    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        ...overrides,
        _id: new mongoose.Types.ObjectId(),
        name: overrides.name || faker.name.findName(),
        email: overrides.email || `test${i + 1}@example.com`,
        password: hashedPassword,
      });
    }
    return User.insertMany(users);
  }
}

module.exports = UserFactory;
