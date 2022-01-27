const { ObjectId } = require('mongodb');
const connection = require('./connection');
const { UNPROCESSABLE } = require('../utils/httpStatus');

const COLLECTION_NAME = 'recipes';

const checkId = (id) => {
  if (!ObjectId.isValid(id)) {
    const err = new Error('Wrong id format');
    err.status = UNPROCESSABLE;
    err.message = 'Wrong id format';
    throw err;
  }
};

const addRecipeModel = async (newRecipe) => {
  checkId(newRecipe.userId);
  const db = await connection();
  const { ops } = await db.collection(COLLECTION_NAME).insertOne(newRecipe);

  return ops[0];
};

const getAllRecipesModel = async () => {
  const db = await connection();
  const recipes = await db.collection(COLLECTION_NAME).find({}).toArray();

  return recipes;
};

const getRecipeByIdModel = async (id) => {
  checkId(id);
  const db = await connection();
  const recipe = await db.collection(COLLECTION_NAME).findOne({ _id: ObjectId(id) });

  return recipe;
};

const editRecipeModel = async (recipeId, recipe) => {
  checkId(recipeId);
  const db = await connection();
  const editedRecipe = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { _id: ObjectId(recipeId) },
    { $set: { ...recipe } },
    { returnOriginal: false },
  );
  // Referência do "returnOriginal":
  // https://stackoverflow.com/questions/32811510/mongoose-findoneandupdate-doesnt-return-updated-document

  return editedRecipe.value;
};

const deleteRecipeModel = async (recipeId) => {
  checkId(recipeId);
  const db = await connection();
  await db.collection(COLLECTION_NAME).deleteOne({ _id: ObjectId(recipeId) });
};

const addRecipeImageModel = async (recipeId, imgUrl) => {
  const db = await connection();
  const editedRecipe = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { _id: ObjectId(recipeId) },
    { $set: { image: imgUrl } },
    { returnOriginal: false },
  );

  return editedRecipe.value;
};

module.exports = {
  addRecipeModel,
  getAllRecipesModel,
  getRecipeByIdModel,
  editRecipeModel,
  deleteRecipeModel,
  addRecipeImageModel,
};
