const joi = require('joi');
const bcrypt = require('bcrypt');
const { getToken } = require('../jwt/jwt');
const { getUserByEmailModel } = require('../models/users.model');
const { UNAUTHORIZED } = require('../utils/httpStatus');

const checkLoginData = (loginData) => {
  const { error } = joi.object({
    password: joi.string().min(3).required(),
    email: joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
  }).validate(loginData);
  
  if (error) {
    const message = error.details[0].type === 'any.required'
      ? 'All fields must be filled' : 'Incorrect username or password';
    const err = new Error(message);
    err.status = UNAUTHORIZED;
    err.message = message;
    throw err;
  }
};

const incorretInfoThrow = () => {
  const err = new Error('Incorrect username or password');
  err.status = UNAUTHORIZED;
  err.message = 'Incorrect username or password';
  throw err;
};

const checkPassword = async (userData, loginPass) => {
  const cryptCheck = await bcrypt.compare(loginPass, userData.password);

  if (!cryptCheck) incorretInfoThrow();
};

const handleLoginService = async ({ email, password }) => {
  checkLoginData({ email, password });
  const user = await getUserByEmailModel(email);

  if (user === null) incorretInfoThrow();
  
  await checkPassword(user, password);

  const { _id: id } = user;
  const token = getToken({ email, role: user.role, id });

  return { token };
};

module.exports = {
  handleLoginService,
};
