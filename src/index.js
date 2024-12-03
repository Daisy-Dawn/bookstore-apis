require('dotenv').config() // Load .env variables

const express = require('express')
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb')

//init application
const app = express()
app.use(express.json())

//db connection
let db

// Use process.env to access variables from .env
const PORT = process.env.PORT || 3000

connectToDb((err) => {
    if (!err) {
        app.listen(PORT, () => {
            console.log('APP LISTENING ON PORT 3000')
        })
        db = getDb()
    }
})

//routes
app.get('/api/books', (req, res) => {
    // Pagination
    let page = parseInt(req.query.page) || 1 // Page number from query (default to 1 if not provided)
    if (page < 1) page = 1 // Ensure page is at least 1

    const booksPerPage = 4 // Number of books to display per page

    db.collection('books')
        .find()
        .sort({ title: 1 }) // Sort by title in ascending order
        .skip((page - 1) * booksPerPage) // Skip books for previous pages
        .limit(booksPerPage) // Limit the result to `booksPerPage` documents
        .toArray() // Convert the MongoDB cursor to an array
        .then((books) => {
            res.status(200).json(books) // Send the books as JSON
        })
        .catch((err) => {
            res.status(500).json({
                error: 'Internal Server Error',
                details: err.message,
            })
        })
})

app.get('/api/books/:id', (req, res) => {
    const bookId = req.params.id

    // Check if the ID is valid
    if (!ObjectId.isValid(bookId)) {
        return res.status(400).json({ error: 'Id not a valid Document Id' })
    }

    // Proceed if ID is valid
    db.collection('books')
        .findOne({ _id: new ObjectId(bookId) })
        .then((doc) => {
            if (!doc) {
                return res.status(404).json({ error: 'Book not found' })
            }
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({
                error: 'Internal Server Error',
                details: err.message,
            })
        })
})

app.post('/api/books', (req, res) => {
    const book = req.body

    // Basic validation to ensure required fields are present
    if (
        !book.title ||
        !book.author ||
        !book.pages ||
        !book.genres ||
        !book.rating
    ) {
        return res.status(400).json({
            error: 'All required fields (title, author, pages, genres, rating) must be provided.',
        })
    }

    db.collection('books')
        .insertOne(book)
        .then((result) => {
            res.status(201).json({
                message: 'Book added successfully!',
                bookId: result.insertedId, // Return the ID of the inserted book
                book,
            })
        })
        .catch((err) => {
            res.status(500).json({
                error: 'An error occurred while adding the book.',
                details: err.message,
            })
        })
})

app.delete('/api/books/:id', (req, res) => {
    const bookId = req.params.id

    // Validate the ID
    if (!ObjectId.isValid(bookId)) {
        return res.status(400).json({ error: 'Id not a valid Document Id' })
    }

    // Proceed to delete the document
    db.collection('books')
        .deleteOne({ _id: new ObjectId(bookId) })
        .then((result) => {
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Book not found.' })
            }

            res.status(200).json({
                message: 'Book deleted successfully!',
                deletedId: bookId,
            })
        })
        .catch((err) => {
            res.status(500).json({
                error: 'An error occurred while deleting the book.',
                details: err.message,
            })
        })
})

app.patch('/api/books/:id', (req, res) => {
    const bookId = req.params.id
    const updates = req.body

    // Validate the ID
    if (!ObjectId.isValid(bookId)) {
        return res.status(400).json({ error: 'Id not a valid Document Id' })
    }

    // Update the document
    db.collection('books')
        .updateOne(
            { _id: new ObjectId(bookId) }, // Filter document by ID
            { $set: updates } // Apply updates
        )
        .then((result) => {
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Book not found.' })
            }

            res.status(200).json({
                message: 'Book updated successfully!',
                updatedId: bookId,
                modifiedCount: result.modifiedCount, // Number of modified documents
            })
        })
        .catch((err) => {
            res.status(500).json({
                error: 'An error occurred while updating the book.',
                details: err.message,
            })
        })
})
