const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const { getConnection } = require('./mongoMockConnection');
const server = require('../api/app');
const { expect } = chai;

chai.use(chaiHttp);

const cryptPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
};

describe('Testes da rota "users".', () => {
  let connectionMock;

  before(async () => {
    connectionMock = await getConnection();
    sinon.stub(MongoClient, 'connect').resolves(connectionMock);
  });

  after(async () => {
    await connectionMock.db('Cookmaster').collection('users').deleteMany({});
    await connectionMock.db('Cookmaster').collection('users').drop();
    MongoClient.connect.restore();
  });

  describe('Teste de registro de usuário.', () => {
    let response;

    describe('Quando é cadatrado com sucesso.', () => {
      before(async () => {
        response = await chai.request(server)
        .post('/users')
        .send({ email: 'test@email.com', name: 'test', password: 'test123'});
      });

      it('Deve retornar o código de status 201', () => {
        expect(response).to.have.status(201);
      });

      it('Deve retornar um objeto', () => {
        expect(response.body).to.be.a('object');
      });

      it('Deve possuir a propriedade "user"', () => {
        expect(response.body).to.have.property('user');
      });

      it('Na propriedade "user" deve existir um "_id"', () => {
        expect(response.body.user).to.have.property('_id');
      });

      it('Na propriedade "user" deve existir "role" com valor "user"', () => {
        expect(response.body.user).to.have.property('role');
        expect(response.body.user.role).to.be.equal('user');
      });
    });

    describe('Quando não é cadatrado com sucesso.', () => {
      it('Se o email não exitir deve retornar o código de status 400 com uma mensagem.', async () => {
        response = await chai.request(server)
        .post('/users')
        .send({ name: 'test', password: 'test123'});

        expect(response).to.have.status(400);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.equal('Invalid entries. Try again.');
      });

      it('Se o name não exitir deve retornar o código de status 400 com uma mensagem.', async () => {
        response = await chai.request(server)
        .post('/users')
        .send({ email: 'test@email.com', password: 'test123'});

        expect(response).to.have.status(400);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.equal('Invalid entries. Try again.');
      });

      it('Se o paswword não exitir deve retornar o código de status 400 com uma mensagem.', async () => {
        response = await chai.request(server)
        .post('/users')
        .send({ email: 'test@email.com', name: 'test' });

        expect(response).to.have.status(400);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.equal('Invalid entries. Try again.');
      });

      it('Se o email já etiver cadastrado deve retornar o código de status 409 com uma mensagem.',  async () => {
        response = await chai.request(server)
        .post('/users')
        .send({ email: 'test@email.com', name: 'test', password: 'test123'});

        expect(response).to.have.status(409);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.equal('Email already registered');
      });
    });
  });

  describe('Teste de registro de Admin.', () => {
    let response;

    before(async () => {
      const newPasword = await cryptPassword('admin');

      const rootAdmin = { name: 'admin', email: 'root@email.com', password: newPasword, role: 'admin' }
      const db = connectionMock.db('Cookmaster');
      await db.collection('users').insertOne(rootAdmin);
    });

    describe('Quando é cadatrado com sucesso.', () => {
      before(async () => {
        const loginHash = await chai.request(server)
        .post('/login')
        .send({ email: 'root@email.com', password: 'admin'});

        response = await chai.request(server)
        .post('/users/admin')
        .send({ email: 'root1@email.com', password: 'admin', name: 'admin1'})
        .set('authorization', loginHash.body.token);
      });

      it('Deve retornar o código de status 201', () => {
        expect(response).to.have.status(201);
      });

      it('Deve retornar um objeto', () => {
        expect(response.body).to.be.a('object');
      });

      it('Deve possuir a propriedade "user"', () => {
        expect(response.body).to.have.property('user');
      });

      it('Na propriedade "user" deve existir um "_id"', () => {
        expect(response.body.user).to.have.property('_id');
      });
    });

    describe('Quando o "user" que está fazendo o cadastro não tem a "role" admin', () => {
      let loginHash;

      before(async () => {
        loginHash = await chai.request(server)
        .post('/login')
        .send({ email: 'test@email.com', password: 'test123'});

        response = await chai.request(server)
        .post('/users/admin')
        .send({ email: 'root1@email.com', password: 'admin', name: 'admin1'})
        .set('authorization', loginHash.body.token);
      });

      it('Deve retornar o código de status 403', () => {
        expect(response).to.have.status(403);
      });

      it('Deve retornar um objeto', () => {
        expect(response.body).to.be.a('object');
      });

      it('Deve possuir a propriedade "message"', () => {
        expect(response.body).to.have.property('message');
      });

      it('A propriedade "message" tem que ter o valor "Only admins can register new admins"', () => {
        expect(response.body.message).to.be.equal('Only admins can register new admins');
      });
    });

    describe('Quando o "jwt" nãe é informado.', () => {
      before(async () => {
        response = await chai.request(server)
        .post('/users/admin')
        .send({ email: 'root1@email.com', password: 'admin', name: 'admin1'})
      });

      it('Deve retornar o código de status 401', () => {
        expect(response).to.have.status(401);
      });

      it('Deve retornar um objeto', () => {
        expect(response.body).to.be.a('object');
      });

      it('Deve possuir a propriedade "message"', () => {
        expect(response.body).to.have.property('message');
      });

      it('A propriedade "message" tem que ter o valor "missing auth token"', () => {
        expect(response.body.message).to.be.equal('missing auth token');
      });
    });
  });
});
