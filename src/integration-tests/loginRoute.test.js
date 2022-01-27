const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const { getConnection } = require('./mongoMockConnection');
const server = require('../api/app');
const { UNAUTHORIZED } = require('../utils/httpStatus');
const { expect } = chai;

chai.use(chaiHttp);

const cryptPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
};

describe('Testes da rota "login".', () => {
  let connectionMock;

  before(async () => {
    connectionMock = await getConnection();
    sinon.stub(MongoClient, 'connect').resolves(connectionMock);

    const newPassword = await cryptPassword('admin');

    const rootAdmin = { name: 'admin', email: 'root@email.com', password: newPassword, role: 'admin' }
    const db = connectionMock.db('Cookmaster');
    await db.collection('users').insertOne(rootAdmin);
  });

  after(async () => {
    await connectionMock.db('Cookmaster').collection('users').deleteMany({});
    await connectionMock.db('Cookmaster').collection('users').drop();
    MongoClient.connect.restore();
  });

  describe('Quando o login é feito com sucesso', () => {
    let response;

    before(async () => {
      response = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com', password: 'admin'});
    });
    
    it('Deve retornar o código de status 200', () => {
      expect(response).to.have.status(200);
    });

    it('Deve retornar um objeto', () => {
      expect(response.body).to.be.a('object');
    });

    it('Deve possuir a propriedade "token"', () => {
      expect(response.body).to.have.property('token');
    });

    it('O valor da propriedade "token" deve ser uma "string"', () => {
      expect(response.body.token).to.be.a('string');
    });
  });

  describe('Quando o login não é feito com sucesso', () => {
    let response;
    
    it('Quando o campo "email" não é preenchido.', async () => {
      response = await chai.request(server)
      .post('/login')
      .send({ password: 'admin' });

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('All fields must be filled');
    });

    it('Quando o campo "password" não é preenchido.', async () => {
      response = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com' });

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('All fields must be filled');
    });

    it('Quando o campo "password" está incorreto.', async () => {
      response = await chai.request(server)
      .post('/login')
      .send({ email: 'root@email.com', password: 'admin5' });

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('Incorrect username or password');
    });

    it('Quando o campo "email" está incorreto.', async () => {
      response = await chai.request(server)
      .post('/login')
      .send({ email: 'root5@email.com', password: 'admin' });

      expect(response).to.have.status(UNAUTHORIZED);
      expect(response.body).to.be.a('object');
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.be.equal('Incorrect username or password');
    });
  });
});
