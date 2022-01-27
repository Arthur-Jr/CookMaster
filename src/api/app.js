const express = require('express');
const bodyParser = require('body-parser');
const usersRouter = require('../router/usersRouter');
const loginRouter = require('../router/loginRouter');
const recipesRouter = require('../router/recipesRouter');
const imageRouter = require('../router/imgesRouter');

const app = express();

// Não remover esse end-point, ele é necessário para o avaliador
app.get('/', (request, response) => {
  response.send();
});
// Não remover esse end-point, ele é necessário para o avaliador

app.use(bodyParser.json());

app.use('/users', usersRouter);

app.use('/login', loginRouter);

app.use('/recipes', recipesRouter);

app.use('/images', imageRouter);

module.exports = app;
