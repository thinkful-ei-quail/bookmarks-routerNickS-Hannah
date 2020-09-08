const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const { makeBookmarksArray } = require('./bookmarks-fixtures');


describe('Bookmarks Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('bookmarks').truncate());
  afterEach('cleanup', () => db('bookmarks').truncate());

  it(`responds with 401 Unauthorized for GET /api/bookmarks`, () => {
    return supertest(app)
      .get('/api/bookmarks')
      .expect(401, { error: 'Unauthorized request' })
  })

  it(`responds with 401 Unauthorized for POST /api/bookmarks`, () => {
    return supertest(app)
      .post('/api/bookmarks')
      .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
      .expect(401, { error: 'Unauthorized request' })
  })

  it(`responds with 401 Unauthorized for GET /api/bookmarks/:id`, () => {
    const secondBookmark = testBookmarks[1]
    return supertest(app)
      .get(`/api/bookmarks/${secondBookmark.id}`)
      .expect(401, { error: 'Unauthorized request' })
  })

  it(`responds with 401 Unauthorized for DELETE /api/bookmarks/:id`, () => {
    const aBookmark = testBookmarks[1]
    return supertest(app)
      .delete(`/api/bookmarks/${aBookmark.id}`)
      .expect(401, { error: 'Unauthorized request' })
  })

  it(`responds with 401 Unauthorized for PATCH /api/bookmarks/:id`, () => {
    const aBookmark = testBookmarks[1]
    return supertest(app)
      .patch(`/api/bookmarks/${aBookmark.id}`)
      .send({ title: 'updated-title' })
      .expect(401, { error: 'Unauthorized request' })
  })



  describe('GET /api/bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, []);
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, testBookmarks)
      });
    });


  });

  describe('GET /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('GET /api/bookmarks/:bookmark_id', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark);
      });
    })
  })

  describe.only(`POST /articles`, () => {
    it(`creates an article, responding with 201 and the new article`, () => {
      const newBookmark = {
        title: 'Test title',
        url: 'https://test.com',
        description: 'test description',
        rating: 1
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
        })
        .then(postRes => 
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })
  })

})