const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')

const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
console.log('connecting to', MONGODB_URI)
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('connected to MongoDB'))
  .catch((e) => console.log('error connecting to MongoDB: ', e.message))

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
      name: String!,
      id: ID!,
      born: Int,
      bookCount: Int!
  }

  type Book {
      title: String!,
      published: Int!,
      author: Author!,
      id: ID!,
      genres: [String!]
  }

  type Query {
    me: User
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
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Author: {
    bookCount: async (root) => {
      return Book.find({ author: root}).countDocuments()
    },
  },

  Query: {
    me: async (root, args, context) => {
      return context.currentUser
    },
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
    createUser: async (root, args) => {
      const user = new User({username: args.username, favoriteGenre: args.favoriteGenre})
      return user.save().catch(e => {
        throw new GraphQLError(`Creating new user failed`, {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.username,
            e
          }
        }
        )
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({username: args.username})

      if (!user || args.password !== 'secret') {
        throw new GraphQLError(`Wrong credentials`, {
          extensions: {
            code: `BAD_USER_INPUT`
          }
        })
      }

      userForToken = {
        username: user.username,
        id: user._id
      }

      return {value: jwt.sign(userForToken, process.env.JWT_SECRET)}
    },
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError(`Not authenticated`, {
          extensions: 'BAD_USER_INPUT'
        })
      }

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
        try {
          await author.save()
        } catch (e) {
          throw new GraphQLError(`Cannot add author`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.author,
              e
            }
          })
        }
      }
      const author = await Author.findOne({name: args.author})
      const book = new Book({ ...args, author: author })
      try {
        await book.save()
      } catch (error) {
        throw new GraphQLError(`Saving book failed`, {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
      return book
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError(`Not authenticated`, {
          extensions: 'BAD_USER_INPUT'
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
  }
}


const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({req, res}) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id).populate('favoriteGenre')
      return {currentUser}
    }
  }
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})

