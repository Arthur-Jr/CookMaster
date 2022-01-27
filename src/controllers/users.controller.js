const rescue = require('express-rescue');
const { CREATED } = require('../utils/httpStatus');
const {
  registerUserService, registerAdminService,
} = require('../services/users.service');

const registerUserController = rescue(async (req, res) => {
  const { email, name, password } = req.body;
  const newUser = await registerUserService({ email, name, password });

  res.status(CREATED).json(newUser);
});

const registerAdminController = rescue(async (req, res) => {
  const { user: { role }, name, email, password } = req.body;

  const newAdmin = await registerAdminService(role, { name, email, password });

  res.status(CREATED).json(newAdmin);
});

module.exports = {
  registerUserController,
  registerAdminController,
};
