const rescue = require('express-rescue');
const { decodeToken } = require('../jwt/jwt');
const { getUserByEmailModel } = require('../models/users.model');
const { UNAUTHORIZED } = require('../utils/httpStatus');

const jwtErroThrow = () => {
  const err = new Error('jwt malformed');
  err.status = UNAUTHORIZED;
  err.message = 'jwt malformed';
  throw err;
};

const handleToken = async (token) => {
  const { data } = decodeToken(token);
  const user = await getUserByEmailModel(data.email);

  if (user === null) jwtErroThrow();

  const { _id: id, role } = user;
  if (data.email !== user.email || data.role !== role || data.id !== id.toString()) jwtErroThrow();

  return { id, role };
};

module.exports = rescue(async (req, _res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    const err = new Error('missing auth token');
    err.status = UNAUTHORIZED;
    err.message = 'missing auth token';
    throw err;
  }

  const user = await handleToken(authorization);

  req.body.user = user;

  next();
});
