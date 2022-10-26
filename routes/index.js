var express = require('express')
var router = express.Router()
const Book = require("../models").Book
const db = require("../models/index")
const { Op } = db.Sequelize

/* Try-Catch error handler. */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

/* GET home page. */
router.get('/', (req, res, next) => {
  res.redirect("/books")
})

/* GET book list. */
// With pagination logic
router.get("/books", asyncHandler(async (req, res, next) => {
  let booksPerPage = 10
  let numBooks = await Book.count()
  // Calculate number of pagination buttons
  let buttons = Math.ceil(numBooks / booksPerPage)
  // Check if a pageNum exists in query string, if not set the pageNum to default 1
  const pageNum = req.query.pageNum ?? 1
  if (pageNum <= buttons && pageNum > 0) {
    const books = await Book.findAll({
      limit: booksPerPage,
      offset: (pageNum - 1) * booksPerPage
    })
    res.render("index", { books, title: "Books", buttons })
  } else {
    throw new Error()
  }
}))

/* POST find searched books. */
router.post("/books", asyncHandler(async (req, res, next) => {
  const books = await Book.findAll({
    where: {
      // Use operation "or" to check title, author, genre, and year for search matches
      [Op.or]: [
        {
          title: {
            // Use operation "like" to find if search term contained in title
            [Op.like]: '%' + req.body.search + '%'
          }
        },
        {
          author: {
            [Op.like]: '%' + req.body.search + '%'
          }
        },
        {
          genre: {
            [Op.like]: '%' + req.body.search + '%'
          }
        },
        {
          year: {
            [Op.like]: '%' + req.body.search + '%'
          }
        }
      ]
    }
  })
  res.render("index", { books, title: "Books" })
}))


/* GET create book form. */
router.get("/books/new", (req, res, next) => {
  res.render("new-book", { book: {}, title: "New Book" })
})

/* POST create new book. */
router.post("/books/new", asyncHandler(async (req, res, next) => {
  let book
  try {
    book = await Book.create(req.body)
    res.redirect("/books/")
  } catch (error) {
    // If errors are from the Book model validation, display the errors
    if (error.name === "SequelizeValidationError") {
      // Use build to capture the unsaved state of the book for display
      book = await Book.build(req.body)
      res.render("new-book", { book, errors: error.errors, title: "New Book" })
    } else {
      throw error;
    }
  }
}))

/* GET book detail form. */
router.get("/books/:id", asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id)
  if (book) {
    res.render("update-book", { book, title: "Update Book" })
  } else {
    throw new Error()
  }
}))

/* POST update book information. */
router.post("/books/:id", asyncHandler(async (req, res, next) => {
  let book
  try {
    book = await Book.findByPk(req.params.id)
    if (book) {
      await book.update(req.body)
      res.redirect("/books/")
    } else {
      throw new Error()
    }
  } catch (error) {
    // If errors are from the Book model validation, display the errors
    if (error.name === "SequelizeValidationError") {
      // Use build to capture the unsaved state of the book for display
      book = await Book.build(req.body)
      book.id = req.params.id
      res.render("update-book", { book, errors: error.errors, title: "Update Book" })
    } else {
      throw error;
    }
  }
}))

/* POST delete book. */
router.post("/books/:id/delete", asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id)
  if (book) {
    await book.destroy()
    res.redirect("/books")
  } else {
    throw new Error()
  }
}))

module.exports = router
