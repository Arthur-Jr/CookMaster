const joi = require('joi');
const { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } = require('../utils/httpStatus');
const {
  addRecipeModel,
  getAllRecipesModel,
  getRecipeByIdModel,
  editRecipeModel,
  deleteRecipeModel,
  addRecipeImageModel,
} = require('../models/recipes.model');

const notFoundThrow = () => {
  const err = new Error('recipe not found');
  err.status = NOT_FOUND;
  err.message = 'recipe not found';
  throw err;
};

const InvalidEntriesThrow = () => {
  const err = new Error('Invalid entries. Try again.');
  err.status = BAD_REQUEST;
  err.message = 'Invalid entries. Try again.';
  throw err;
};

const jwtErrorThrow = () => {
  const err = new Error('jwt malformed');
  err.status = UNAUTHORIZED;
  err.message = 'jwt malformed';
  throw err;
};

const checkRecipeData = (recipe) => {
  const { error } = joi.object({
    name: joi.string().min(5).required(),
    ingredients: joi.string().min(1).required(),
    preparation: joi.string().min(1).required(),
  }).validate(recipe);

  if (error) InvalidEntriesThrow();
};

const checkUserData = (userData) => {
  const { error } = joi.object({
    id: joi.required(),
    role: joi.string().min(4).max(5).required(),
  }).validate(userData);

  if (error) InvalidEntriesThrow();
};

const checkUserauthorization = async (recipeId, { id, role }) => {
  const recipe = await getRecipeByIdModel(recipeId);
  if (recipe === null) notFoundThrow();

  if (role === 'admin') return true;

  if (recipe.userId.toString() === id.toString()) return true;

  jwtErrorThrow();
};

const addRecipeService = async (userId, recipeData) => {
  checkRecipeData(recipeData);

  const recipe = await addRecipeModel({ ...recipeData, userId });

  return { recipe };
};

const getAllRecipesService = async () => getAllRecipesModel();

const getRecipeByIdService = async (id) => {
  const recipe = await getRecipeByIdModel(id);

  if (recipe === null) notFoundThrow();

  return recipe;
};

const editRecipeService = async (recipeId, userData, recipe) => {
  checkRecipeData(recipe);
  checkUserData(userData);
  await checkUserauthorization(recipeId, userData);

  return editRecipeModel(recipeId, recipe);
};

const deleteRecipeService = async (recipeId, userData) => {
  checkUserData(userData);
  await checkUserauthorization(recipeId, userData);

  await deleteRecipeModel(recipeId);
};

const addRecipeImageService = async (recipeId, imgUrl, user) => {
  await checkUserauthorization(recipeId, user);

  return addRecipeImageModel(recipeId, imgUrl);
};

const getRecipeImageService = async (id) => {
  const recipe = await getRecipeByIdService(id);

  if (recipe.image === undefined) {
    const err = new Error('image not found');
    err.status = NOT_FOUND;
    err.message = 'image not found';
    throw err;
  }

  return recipe.image;
};

module.exports = {
  addRecipeService,
  getAllRecipesService,
  getRecipeByIdService,
  editRecipeService,
  deleteRecipeService,
  addRecipeImageService,
  getRecipeImageService,
};
