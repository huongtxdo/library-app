import { gql } from '@apollo/client'

export const ALL_BOOKS = gql`
  query {
    allBooks {
      author
      published
      genres
      title
      id
    }
  }
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
      author
      genres
      published
      id
      title
    }
  }
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

