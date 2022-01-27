const connection = require('./connection');

const COLLECTION_NAME = 'users';

const getUserByEmailModel = async (email) => {
  const db = await connection();
  const user = await db.collection(COLLECTION_NAME).findOne({ email });

  return user;
};

const registerUserModel = async (user) => {
  const db = await connection();
  const { ops } = await db.collection(COLLECTION_NAME).insertOne(user);
  const { password: pass, ...newUser } = ops[0];

  return newUser;
};

module.exports = {
  getUserByEmailModel,
  registerUserModel,
};
