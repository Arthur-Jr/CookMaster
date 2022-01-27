const express = require('express');
const errorMiddleware = require('../middlewares/errorMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  registerUserController,
  registerAdminController,
} = require('../controllers/users.controller');

const router = express.Router();

router.post('/', registerUserController);

router.post('/admin', authMiddleware, registerAdminController);

router.use(errorMiddleware);

module.exports = router;
