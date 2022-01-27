const rescue = require('express-rescue');
const { CREATED, HTTP_OK_STATUS, NO_CONTENT } = require('../utils/httpStatus');
const { 
  addRecipeService,
  getAllRecipesService,
  getRecipeByIdService,
  editRecipeService,
  deleteRecipeService,
  addRecipeImageService,
  getRecipeImageService,
} = require('../services/recipes.service');

const addRecipeController = rescue(async (req, res) => {
  const { user, name, ingredients, preparation } = req.body;

  const recipe = await addRecipeService(user.id, { name, ingredients, preparation });

  return res.status(CREATED).json(recipe);
});

const getAllRecipesController = rescue(async (_req, res) => {
  const recipes = await getAllRecipesService();

  res.status(HTTP_OK_STATUS).json(recipes);
});

const getRecipeByIdController = rescue(async (req, res) => {
  const { id } = req.params;

  const recipe = await getRecipeByIdService(id);

  res.status(HTTP_OK_STATUS).json(recipe);
});

const editRecipeController = rescue(async (req, res) => {
  const { params: { id }, body: { user, name, ingredients, preparation } } = req;

  const editedRecipe = await editRecipeService(id, user, { name, ingredients, preparation });

  return res.status(HTTP_OK_STATUS).json(editedRecipe);
});

const deleteRecipeController = rescue(async (req, res) => {
  const { params: { id }, body: { user } } = req;

  await deleteRecipeService(id, user);

  res.status(NO_CONTENT).send();
});

const addRecipeImageController = rescue(async (req, res) => {
  const { params: { id }, file: { path }, headers: { host }, body: { user } } = req;

  const recipe = await addRecipeImageService(id, `${host}/${path}`, user);

  res.status(HTTP_OK_STATUS).json(recipe);
});

const getRecipeImageController = rescue(async (req, res) => {
  const { id } = req.params;

  const img = await getRecipeImageService(id);

  res.status(HTTP_OK_STATUS).send(img);
});

module.exports = {
  addRecipeController,
  getAllRecipesController,
  getRecipeByIdController,
  editRecipeController,
  deleteRecipeController,
  addRecipeImageController,
  getRecipeImageController,
};
