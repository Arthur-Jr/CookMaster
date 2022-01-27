const express = require('express');
const errorMiddleware = require('../middlewares/errorMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  addRecipeController,
  getAllRecipesController,
  getRecipeByIdController,
  editRecipeController,
  deleteRecipeController,
  addRecipeImageController,
} = require('../controllers/recipes.controller');
const multerUpload = require('../middlewares/multerMiddleware');

const router = express.Router();

router.get('/', getAllRecipesController);

router.get('/:id', getRecipeByIdController);

router.post('/', authMiddleware, addRecipeController);

router.put('/:id', authMiddleware, editRecipeController);

router.delete('/:id', authMiddleware, deleteRecipeController);

router.put('/:id/image', multerUpload.single('image'), authMiddleware, addRecipeImageController);

router.use(errorMiddleware);

module.exports = router;
