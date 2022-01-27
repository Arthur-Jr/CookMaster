const rescue = require('express-rescue');
const { handleLoginService } = require('../services/login.service');
const { HTTP_OK_STATUS } = require('../utils/httpStatus');

const handleLoginController = rescue(async (req, res) => {
  const { email, password } = req.body;
  const loginToken = await handleLoginService({ email, password });

  return res.status(HTTP_OK_STATUS).json(loginToken);
});

module.exports = {
  handleLoginController,
};
