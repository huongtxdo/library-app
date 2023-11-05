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
    bookCount: (root) => {
      return Book.filter((b) => b.author === root.name).length
    },
  },

  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      // if (args.author && args.genre) {
      //   return Book.find({ author: args.author })
      //   // (b) => b.author === args.author && b.genres.includes(args.genre)
      // }
      // if (args.author) {
      //   return Book.find({ author: args.author })
      // }
      // if (args.genre) {
      //   // return books.filter((b) => b.genres.includes(args.genre))
      //   return Book.find({ genres: args.genre })
      // }
      return Book.find({})
    },
    allAuthors: async (root, args) => {
      return Author.find({})
    },
  },

  Mutation: {
    addBook: async (root, args) => {
      console.log('------', Book.findOne({ title: args.title }).title)
      if (Book.findOne({ title: args.title })) {
        throw new GraphQLError('This book is already added', {
          extensions: {
            code: 'EXISTING_BOOK_TITLE',
            invalidArgs: args.title,
          },
        })
      }
      if (!Author.findOne({ name: args.author })) {
        const author = new Author({ name: args.author })
        await author.save()
      }
      const book = new Book({ ...args })
      await book.save()
      return book
    },
    editAuthor: (root, args) => {
      const author = Author.findOne({ name: args.name })
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

