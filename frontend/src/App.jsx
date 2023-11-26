import { useState } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom'
import { useApolloClient, useQuery, useSubscription } from '@apollo/client'

import { ALL_BOOKS, ALL_AUTHORS, ME, BOOK_ADDED } from './queries'

import Authors from './routes/Authors'
import Books from './routes/Books'
import NewBook from './routes/NewBook'
import LoginForm from './routes/LoginForm'
import Recommendations from './routes/Recommendations'

const App = () => {
  const [error, setError] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('login-token'))

  const booksResult = useQuery(ALL_BOOKS)
  const authorsResult = useQuery(ALL_AUTHORS)
  const userResult = useQuery(ME)

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded
      window.alert(`${addedBook.title} added!`)

      client.cache.updateQuery({ query: ALL_BOOKS }, ({ allBooks }) => {
        return {
          allBooks: allBooks.concat(addedBook),
        }
      })
    },
  })

  const client = useApolloClient() //reset the cache

  if (booksResult.loading || authorsResult.loading || userResult.loading) {
    return <>loading...</>
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
    alert('logged out')
  }

  const setErrorTimeout = (message) => {
    setError(message)
    setTimeout(() => {
      setError(null)
    }, 5000)
  }

  const padding = { padding: 5 }

  return (
    <Router>
      {error && <div>{error}</div>}
      <div>
        <Link style={padding} to="/">
          Home
        </Link>
        <Link style={padding} to="/authors">
          Authors
        </Link>
        <Link style={padding} to="/books">
          Books
        </Link>
        {!token && (
          <Link style={padding} to="/login">
            Login
          </Link>
        )}
        {token && (
          <>
            <Link style={padding} to="/add">
              Add book
            </Link>
            <Link style={padding} to="/recommend">
              Recommend
            </Link>
            <Link style={padding} onClick={logout} to="/">
              logout
            </Link>
          </>
        )}
      </div>

      <Routes>
        <Route path="/" element={<h2>Library app</h2>} />
        <Route
          path="/authors"
          element={
            <Authors
              setError={setErrorTimeout}
              authors={authorsResult.data.allAuthors}
              token={token}
            />
          }
        />
        <Route
          path="/books"
          element={<Books books={booksResult.data.allBooks} />}
        />
        <Route
          path="/login"
          element={
            <LoginForm
              setError={setErrorTimeout}
              setToken={setToken}
              refetch={userResult.refetch}
            />
          }
        />
        <Route path="/add" element={<NewBook setError={setErrorTimeout} />} />
        <Route path="/recommend" element={<Recommendations />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Router>
  )
}

export default App

