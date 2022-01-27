const express = require('express');
const path = require('path');
const { getRecipeImageController } = require('../controllers/recipes.controller');
const errorMiddleware = require('../middlewares/errorMiddleware');

const router = express.Router();

router.use(express.static(path.resolve(__dirname, '..', 'uploads/')));

router.get('/:id.jpeg', getRecipeImageController);

router.use(errorMiddleware);

module.exports = router;
