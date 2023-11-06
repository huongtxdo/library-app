const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Book = require('./models/book')
const Author = require('./models/author')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
console.log('connecting to', MONGODB_URI)
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('connected to MongoDB'))
  .catch((e) => console.log('error connecting to MongoDB: ', e.message))

const typeDefs = `
  type Author {
      name: String!,
      id: String!,
      born: Int,
      bookCount: Int!
  }

  type Book {
      title: String!,
      published: Int!,
      author: Author!,
      id: String!,
      genres: [String!]
  }

  type Query {
    bookCount: Int!,
    authorCount: Int!,
    allBooks(author: String, genre: String): [Book!]!,
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

const resolvers = {
  Author: {
    bookCount: async (root) => {
      return Book.find({ author: root}).countDocuments()
    },
  },

  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.author && args.genre) {
        const author = await Author.findOne({name: args.author})
        return Book.find({ author: author, genres: args.genre })
      }
      if (args.author) {
        const author = await Author.findOne({name: args.author})
        return Book.find({ author: author })
      }
      if (args.genre) {
        return Book.find({ genres: args.genre })
      }
      return Book.find({}).populate('author')
    },
    allAuthors: async (root, args) => {
      return Author.find({})
    },
  },

  Mutation: {
    addBook: async (root, args) => {
      const bookExists = await Book.findOne({title: args.title})
      if (bookExists) {
        throw new GraphQLError('This book is already added', {
          extensions: {
            code: 'EXISTING_BOOK_TITLE',
            invalidArgs: args.title,
          },
        })
      }
      if (!(await Author.findOne({name: args.author}))) {
        const author = new Author({ name: args.author })
        await author.save()
      }
      const author = await Author.findOne({name: args.author})
      const book = new Book({ ...args, author: author })

      await book.save()
      return book
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      if (!author) {
        return null
      }
      author.born = args.setBornTo
      author.save()
      return author
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})

