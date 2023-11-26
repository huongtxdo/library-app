import { gql } from '@apollo/client'

export const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    author {
      name
    }
    published
    genres
    title
    id
  }
`

// query
export const ME = gql`
  query {
    me {
      favoriteGenre
    }
  }
`

export const ALL_BOOKS = gql`
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`

export const ALL_AUTHORS = gql`
  query {
    allAuthors {
      bookCount
      born
      id
      name
    }
  }
`

export const BOOK_COUNT = gql`
  query {
    bookCount
  }
`

export const AUTHOR_COUNT = gql`
  query {
    authorCount
  }
`

// mutation
export const ADD_BOOK = gql`
  mutation addBook(
    $title: String!
    $published: Int!
    $author: String!
    $genres: [String!]
  ) {
    addBook(
      title: $title
      published: $published
      author: $author
      genres: $genres
    ) {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`

export const EDIT_AUTHOR = gql`
  mutation editAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      id
      born
      bookCount
    }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`
// subscription
export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`

