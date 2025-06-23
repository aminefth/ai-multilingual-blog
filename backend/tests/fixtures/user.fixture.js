const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User',
  email: 'test@example.com',
  password,
  role: 'user',
  isEmailVerified: false,
};

const userTwo = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Admin User',
  email: 'admin@example.com',
  password,
  role: 'admin',
  isEmailVerified: true,
};

const insertUsers = async (users) => {
  await User.insertMany(
    users.map((user) => ({
      ...user,
      password: hashedPassword,
    }))
  );
};

module.exports = {
  userOne,
  userTwo,
  insertUsers,
};
