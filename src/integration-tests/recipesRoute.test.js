const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const path = require('path');

const { getConnection } = require('./mongoMockConnection');
const server = require('../api/app');
const { BAD_REQUEST, UNAUTHORIZED, CREATED, HTTP_OK_STATUS, NOT_FOUND, UNPROCESSABLE, NO_CONTENT } = require('../utils/httpStatus');
const { expect } = chai;

chai.use(chaiHttp);

const cryptPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
};

describe('Testes da rota "recipes"', () => {
  let connectionMock;
  let recipe;
  const photoFile = path.resolve(__dirname, '..', 'uploads', 'ratinho.jpg');

  before(async () => {
    connectionMock = await getConnection();
    sinon.stub(MongoClient, 'connect').resolves(connectionMock);

    const adminPassword = await cryptPassword('admin');
    const userPassword = await cryptPassword('test');

    const rootAdmin = { name: 'admin', email: 'root@email.com', password: adminPassword, role: 'admin' }
    const rootUser = { name: 'test', email: 'test@email.com', password: userPassword, role: 'user' }
    const rootUser2 = { name: 'test2', email: 'test2@email.com', password: userPassword, role: 'user' }
    const db = connectionMock.db('cookmaster');
    await db.collection('users').insertMany([rootAdmin, rootUser, rootUser2]);
  });

  after(async () => {
    await connectionMock.db('cookmaster').collection('recipes').deleteMany({});
    await connectionMock.db('cookmaster').collection('recipes').drop();

    await connectionMock.db('cookmaster').collection('users').deleteMany({});
    await connectionMock.db('cookmaster').collection('users').drop();

    MongoClient.connect.restore();
  });

  describe('Cadastro de receitas', () => {
    let response;
    let loginHash;

    before(async () => {
      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com', password: 'admin'});
    });

    it('Deve retornar o status 400 com uma mensagem se o campo "nome" não existir', async () => {
      response = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ ingredients: 'ovo', preparation: 'fritar' });

      expect(response).to.have.status(BAD_REQUEST);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });

    it('Deve retornar o status 400 com uma mensagem se o campo "ingredients" não existir', async () => {
      response = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', preparation: 'fritar' });

      expect(response).to.have.status(BAD_REQUEST);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });

    it('Deve retornar o status 400 com uma mensagem se o campo "preparation" não existir', async () => {
      response = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo' });

      expect(response).to.have.status(BAD_REQUEST);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('Invalid entries. Try again.');
    });

    it('Deve retornar o status 401 com uma mensagem se o token for inválido', async () => {
      response = await chai.request(server)
      .post('/recipes')
      .set('authorization', '999')
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('jwt malformed');
    });

    it('Deve retornar o status 201 caso a receita tenha sido cadastrada.', async () => {
      response = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });

      expect(response).to.have.status(CREATED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('recipe');
      expect(response.body.recipe).to.have.property('_id');

      const db = connectionMock.db('cookmaster');
      const recipe = await db.collection('recipes').findOne({ _id: ObjectId(response.body.recipe._id) });

      expect(recipe).to.not.be.null;
    });
  });

  describe('Listagem de todas as receitas', () => {
    let response;
    
    it('Deve retornar a lista de "recipes."', async () => {
      response = await chai.request(server)
      .get('/recipes');

      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(1);
    });

    it('Deve retornar um "array" vazio se o BD estiver vazio', async () => {
      await connectionMock.db('cookmaster').collection('recipes').deleteMany({});

      response = await chai.request(server)
      .get('/recipes');

      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(0);
    });
  });

  describe('"GET" de uma receita específica', () => {
    let response;
    let recipe;

    before(async () => {
      recipe = await connectionMock.db('cookmaster').collection('recipes').insertOne({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });
    });

    it('Deve retornar a receita referente ao ID passado.', async () => {
      response = await chai.request(server)
      .get(`/recipes/${recipe.insertedId}`);

      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('_id');
      expect(response.body._id).to.be.equal(recipe.insertedId.toString());      
    });
    
    it('Deve retornar a mensagem "not found" se for passado um id inexistente.', async () => {
      response = await chai.request(server)
      .get('/recipes/61e7741d13240f3516bf9253');

      expect(response).to.have.status(NOT_FOUND);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('recipe not found');      
    });

    it('Deve retornar a mensagem "Wrong id format" se for passado um id inválido.', async () => {
      response = await chai.request(server)
      .get('/recipes/61e7');

      expect(response).to.have.status(UNPROCESSABLE);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('Wrong id format');      
    });
  });

  describe('Edição de uma receita', () => {
    let response;
    let loginHash;

    before(async () => {
      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'test@email.com', password: 'test'});

      recipe = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });
    });

    it('Deve retornar status 401 se o token não for passado ', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}`)
      .send({ name: 'frango frito', ingredients: 'frango', preparation: 'fritar' });

        expect(response).to.have.status(UNAUTHORIZED);
        expect(response.body).to.be.a('object');
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.equal('missing auth token');      
    });

    it('Deve retornar status 200 se o token for igual ao userId.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}`)
      .set('authorization', loginHash.body.token)
      .send({ name: 'frango frito', ingredients: 'frango', preparation: 'fritar' });
    
      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('_id');
      expect(response.body._id).to.be.equal(recipeInfo._id);
      expect(response.body.name).to.be.equal('frango frito');

      const editedRecipe = await connectionMock.db('cookmaster')
      .collection('recipes').findOne({ _id: ObjectId(recipeInfo._id) });

      expect(editedRecipe.name).to.be.equal('frango frito');
    });
    
    it('Deve retornar status 401 se o token não for igual ao userId.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'test2@email.com', password: 'test'});

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}`)
      .set('authorization', loginHash.body.token)
      .send({ name: 'frango frito', ingredients: 'frango', preparation: 'fritar' });

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('jwt malformed');      
    });

    it('Deve retornar status 200 se o token for de um admin.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com', password: 'admin'});

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}`)
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });
    
      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('_id');
      expect(response.body._id).to.be.equal(recipeInfo._id);
      expect(response.body.name).to.be.equal('ovo frito');

      const editedRecipe = await connectionMock.db('cookmaster')
      .collection('recipes').findOne({ _id: ObjectId(recipeInfo._id) });

      expect(editedRecipe.name).to.be.equal('ovo frito');
    });
  });

  describe('Remover uma receita', () => {
    let response;
    let loginHash;

    before(async () => {
      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'test@email.com', password: 'test'});
    });

    it('Deve retornar status 401 se o token não for passado ', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .delete(`/recipes/${recipeInfo._id}`);

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('missing auth token');      
    });

    it('Deve retornar status 204 se o token for igual ao userId.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .delete(`/recipes/${recipeInfo._id}`)
      .set('authorization', loginHash.body.token);
    
      expect(response).to.have.status(NO_CONTENT);

      const deletedRecipe = await connectionMock.db('cookmaster')
      .collection('recipes').findOne({ _id: ObjectId(recipeInfo._id) });

      expect(deletedRecipe).to.be.null;
    });
    
    it('Deve retornar status 200 se o token for de um admin.', async () => {
      recipe = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });

      const { body: { recipe: recipeInfo } } = recipe;

      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com', password: 'admin'});

      response = await chai.request(server)
      .delete(`/recipes/${recipeInfo._id}`)
      .set('authorization', loginHash.body.token);
    
      expect(response).to.have.status(NO_CONTENT);

      const deletedRecipe = await connectionMock.db('cookmaster')
      .collection('recipes').findOne({ _id: ObjectId(recipeInfo._id) });

      expect(deletedRecipe).to.be.null;
    });
  });

  describe('Adicionar imagem na receita', () => {
    let response;
    let loginHash;

    before(async () => {
      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'test@email.com', password: 'test'});

      recipe = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });
    });

    it('Deve retornar status 401 se o token não for passado ', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}/image`)
      .field('image', 'ratinho')
      .attach('image', photoFile, 'ratinho.jpg');

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('missing auth token');      
    });

    it('Deve retornar status 200 se o token for igual ao userId.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}/image`)
      .field('image', 'ratinho')
      .attach('image', photoFile, 'ratinho.jpg')
      .set('authorization', loginHash.body.token);

      // Link de referência:
      // https://github.com/chaijs/chai-http/issues/168
    
      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('_id');
      expect(response.body._id).to.be.equal(recipeInfo._id);

      const editedRecipe = await connectionMock.db('cookmaster')
      .collection('recipes').findOne({ _id: ObjectId(recipeInfo._id) });

      expect(editedRecipe).to.have.property('image');
    });
    
    it('Deve retornar status 401 se o token não for igual ao userId.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'test2@email.com', password: 'test'});

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}/image`)
      .set('authorization', loginHash.body.token)
      .field('image', 'ratinho')
      .attach('image', photoFile, 'ratinho.jpg');

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('jwt malformed');      
    });

    it('Deve retornar status 200 se o token for de um admin.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com', password: 'admin'});

      response = await chai.request(server)
      .put(`/recipes/${recipeInfo._id}/image`)
      .set('authorization', loginHash.body.token)
      .field('image', 'ratinho')
      .attach('image', photoFile, 'ratinho.jpg');
    
      expect(response).to.have.status(HTTP_OK_STATUS);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('_id');
      expect(response.body._id).to.be.equal(recipeInfo._id);

      const editedRecipe = await connectionMock.db('cookmaster')
      .collection('recipes').findOne({ _id: ObjectId(recipeInfo._id) });

      expect(editedRecipe).to.have.property('image');
    });
  });

  describe('Visualizar imagem da receita.', () => {
    let response;
    let loginHash;

    before(async () => {
      loginHash = await chai.request(server)
      .post('/login')
      .send({ email: 'test@email.com', password: 'test'});

      recipe = await chai.request(server)
      .post('/recipes')
      .set('authorization', loginHash.body.token)
      .send({ name: 'ovo frito', ingredients: 'ovo', preparation: 'fritar' });
    });

    it('Deve retornar status 404 se a receita não tiver imagem.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      response = await chai.request(server)
      .get(`/images/${recipeInfo._id}.jpeg`);

      expect(response).to.have.status(NOT_FOUND);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('image not found');
    });

    it('Deve retornar a imagem da receita.', async () => {
      const { body: { recipe: recipeInfo } } = recipe;

      await chai.request(server)
      .put(`/recipes/${recipeInfo._id}/image`)
      .set('authorization', loginHash.body.token)
      .field('image', 'ratinho')
      .attach('image', photoFile, 'ratinho.jpg');

      response = await chai.request(server)
      .get(`/images/${recipeInfo._id}.jpeg`);

      expect(response).to.have.status(HTTP_OK_STATUS);
    });
  });
});
