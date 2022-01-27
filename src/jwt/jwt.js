const jwt = require('jsonwebtoken');
const { UNAUTHORIZED } = require('../utils/httpStatus');

const secret = 'testSecret';

const jwtConfig = {
  expiresIn: '8h',
  algorithm: 'HS256',
};

const getToken = (data) => jwt.sign({ data }, secret, jwtConfig);

const decodeToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    const err = new Error(error.message);
    err.status = UNAUTHORIZED;
    err.message = error.message;
    throw err;
  }
};

module.exports = {
  getToken,
  decodeToken,
};
