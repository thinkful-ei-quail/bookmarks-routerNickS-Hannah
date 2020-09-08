require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
// const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');
const { NODE_ENV } = require('./config');
const bookmarksRouter = require('./bookmarks/bookmarks-router');
const BookmarksService = require('./bookmarks/bookmarks-service');

const app = express();
const jsonParser = express.json()
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
// app.use(validateBearerToken);

app.get('/api/bookmarks', (req, res, next) => {
  const knexInstance = req.app.get('db')
  BookmarksService.getAllArticles(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks)
    })
    .catch(next)
})
app.post('/api/bookmarks', jsonParser, (req, res, next) => {
  res.status(201).json({
    ...req.body,
    id: 12,
  })
})


app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use(errorHandler);

module.exports = app;