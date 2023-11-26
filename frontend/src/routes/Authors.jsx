import { useEffect, useState } from 'react'
import { useMutation } from '@apollo/client'

import { ALL_AUTHORS, ALL_BOOKS, EDIT_AUTHOR } from '../queries'

const Authors = ({ setError, authors, token }) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [editAuthor, result] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_BOOKS }],
  })

  const changeBirthyear = (event) => {
    event.preventDefault()
    editAuthor({ variables: { name, setBornTo: Number(born) } })
    setBorn('')
  }

  useEffect(() => {
    if (result.data && result.data.editAuthor === null) {
      setError('person not found')
    }
  }, [result.data])

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {token && (
        <>
          <h2>Set birthyear</h2>
          <form onSubmit={changeBirthyear}>
            <label>
              <select
                value={name}
                onChange={({ target }) => setName(target.value)}
                style={{ width: '100%' }}
              >
                {authors.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <br />
            born
            <input
              value={born}
              onChange={({ target }) => setBorn(target.value)}
            />
            <br />
            <button type="submit">update author</button>
          </form>
        </>
      )}
    </div>
  )
}

export default Authors

