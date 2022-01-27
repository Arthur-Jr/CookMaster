const express = require('express');
const errorMiddleware = require('../middlewares/errorMiddleware');
const { handleLoginController } = require('../controllers/login.controller');

const router = express.Router();

router.post('/', handleLoginController);

router.use(errorMiddleware);

module.exports = router;
