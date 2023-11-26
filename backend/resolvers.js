const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const resolvers = {
  // Author: {
  //   bookCount: async (root) => {
  //     console.log('1')
  //     const books = await Book.find({ author: { $in: [root._id] } })
  //     return books.length
  //   },
  // },

  Query: {
    me: async (root, args, { currentUser }) => {
      return currentUser
    },
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.author && args.genre) {
        const author = await Author.findOne({ name: args.author })
        return Book.find({ author: author, genres: args.genre }).populate(
          'author'
        )
      }
      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        return Book.find({ author: author }).populate('author')
      }
      if (args.genre) {
        return Book.find({ genres: args.genre }).populate('author')
      }
      const books = Book.find({}).populate('author')
      return books
    },
    allAuthors: async (root, args) => {
      const authors = await Author.find({}).lean()

      const authorsWithBookCountPromises = authors.map(async (author) => {
        const bookCount = await Book.collection.countDocuments({
          author: author._id,
        })
        return { ...author, bookCount }
      })

      const authorsWithBookCount = await Promise.all(
        authorsWithBookCountPromises
      )

      return authorsWithBookCount.map((a) => ({ ...a, id: a._id }))
    },
  },
  Mutation: {
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      })
      return user.save().catch((e) => {
        throw new GraphQLError(`Creating new user failed`, {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.username,
            e,
          },
        })
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new GraphQLError(`Wrong credentials`, {
          extensions: {
            code: `BAD_USER_INPUT`,
          },
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError(`Not authenticated`, {
          extensions: 'BAD_USER_INPUT',
        })
      }

      if (!(await Author.findOne({ name: args.author }))) {
        const author = new Author({ name: args.author })
        try {
          await author.save()
        } catch (e) {
          throw new GraphQLError(`Cannot add author`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.author,
              e,
            },
          })
        }
      }
      const bookExists = await Book.findOne({ title: args.title })
      if (bookExists) {
        throw new GraphQLError('This book is already added', {
          extensions: {
            code: 'EXISTING_BOOK_TITLE',
            invalidArgs: args.title,
          },
        })
      }
      const author = await Author.findOne({ name: args.author })
      const book = new Book({ ...args, author: author })
      try {
        await book.save()
      } catch (error) {
        throw new GraphQLError(`Saving book failed`, {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError(`Not authenticated`, {
          extensions: 'BAD_USER_INPUT',
        })
      }

      const author = await Author.findOne({ name: args.name })
      if (!author) {
        return null
      }
      author.born = args.setBornTo
      author.save()
      return author
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
}

module.exports = resolvers

