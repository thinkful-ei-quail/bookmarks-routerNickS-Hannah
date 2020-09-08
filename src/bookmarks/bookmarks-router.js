const path = require('path')
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service');
const { getBookmarkValidationError } = require('./bookmark-validator')

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})


bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, description, rating }

    for (const field of ['title', 'url', 'rating', 'description']) {
      if (!req.body[field]) {
        logger.error(`Missing '${field}' in request body`)
        return res.status(400).send({
          error: { message: `Missing '${field}' in request body` }
        })
      }
    }

    const error = getBookmarkValidationError(newBookmark)
    if(error) return res.status(400).send(error)

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        logger.info(`Bookmark with ${bookmark.id} created.`)
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(serializeBookmark(bookmark))
      })
      .catch(next)
  });


bookmarksRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    const { bookmark_id } = req.params
    const knexInstance = req.app.get('db')

    BookmarksService.getById(
      knexInstance,
      bookmark_id
    )
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`)
          return res.status(404).json({
            error: { message: `Bookmark Not Found` }
          })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark))
  })
  .delete((req, res, next) => {
    const { bookmark_id } = req.params
    const knexInstance = req.app.get('db')

    BookmarksService.deleteBookmark(
      knexInstance,
      bookmark_id
    )
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }
    const { bookmark_id } = req.params
    const knexInstance = req.app.get('db')

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if(numberOfValues === 0) {
      logger.error(`Invalid update without required fields`)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description', 'rating'`
        }
      })
    }

    const error = getBookmarkValidationError(bookmarkToUpdate)

    if(error) return res.status(400).send(error)


    BookmarksService.updateBookmark(
      knexInstance,
      bookmark_id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)

  })

module.exports = bookmarksRouter;