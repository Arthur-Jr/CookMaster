const joi = require('joi');
const bcrypt = require('bcrypt');
const { getUserByEmailModel, registerUserModel } = require('../models/users.model');
const { BAD_REQUEST, CONFLICT, FORBIDDEN } = require('../utils/httpStatus');

const checkUserData = (userData) => {
  const { error } = joi.object({
    name: joi.string().min(3).required(),
    password: joi.string().min(6).required(),
    email: joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
  }).validate(userData);

  // Referência do .email() do joi: https://joi.dev/api/?v=17.5.0;

  if (error) {
    const err = new Error('Invalid entries. Try again.');
    err.status = BAD_REQUEST;
    err.message = 'Invalid entries. Try again.';
    throw err;
  }
};

const checkAdminData = (adminData) => {
  const { error } = joi.object({
    name: joi.string().min(3).required(),
    password: joi.string().min(3).required(),
    email: joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
  }).validate(adminData);

  if (error) {
    const err = new Error('Invalid entries. Try again.');
    err.status = BAD_REQUEST;
    err.message = 'Invalid entries. Try again.';
    throw err;
  }
};

const checkEmailDuplicity = async (email) => {
  const user = await getUserByEmailModel(email);

  if (user !== null) {
    const err = new Error('Email already registered');
    err.status = CONFLICT;
    err.message = 'Email already registered';
    throw err;
  }
};

const checkUserRole = (role) => {
  if (role !== 'admin') {
    const err = new Error('Only admins can register new admins');
    err.status = FORBIDDEN;
    err.message = 'Only admins can register new admins';
    throw err;
  }
};

const cryptPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
};

const registerUserService = async (userData) => {
  checkUserData(userData);
  const password = await cryptPassword(userData.password);
  
  await checkEmailDuplicity(userData.email);
  const user = await registerUserModel({ ...userData, role: 'user', password });

  return { user };
};

const registerAdminService = async (userRole, newAdminData) => {
  checkUserRole(userRole);
  checkAdminData(newAdminData);
  const password = await cryptPassword(newAdminData.password);
  await checkEmailDuplicity(userRole.email);

  const user = await registerUserModel({ ...newAdminData, role: 'admin', password });

  return { user };
};

module.exports = {
  registerUserService,
  registerAdminService,
};
