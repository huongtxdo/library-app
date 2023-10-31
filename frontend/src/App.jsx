import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'

const App = () => {
  const [error, setError] = useState(null)

  const notify = (message) => {
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
        <Link style={padding} to="books">
          Books
        </Link>
        <Link style={padding} to="add">
          Add book
        </Link>
      </div>

      <Routes>
        <Route path="/" element={<h2>Main page</h2>} />
        <Route path="/authors" element={<Authors setError={notify} />} />
        <Route path="/books" element={<Books />} />
        <Route path="/add" element={<NewBook />} />
      </Routes>
    </Router>
  )
}

export default App

