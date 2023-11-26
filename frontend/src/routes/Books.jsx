import { useState } from 'react'
import { useQuery } from '@apollo/client'

import { ALL_BOOKS } from '../queries'

const Books = ({ books }) => {
  const [genre, setGenre] = useState(null)

  const genreList = [...new Set([...books.map((b) => b.genres)].flat())]
  const { data: filteredBooks, loading } = useQuery(ALL_BOOKS, {
    variables: genre ? { genre } : {},
  })

  if (loading) return <>loading ...</>

  return (
    <div>
      <h2>books</h2>
      <button onClick={() => setGenre(null)}>All genres</button>
      {genreList.map((g) => (
        <button key={g} onClick={() => setGenre(g)}>
          {g}
        </button>
      ))}

      {filteredBooks && (
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>author</th>
              <th>published</th>
            </tr>
            {filteredBooks.allBooks.map((a) => (
              <tr key={a.title}>
                <td>{a.title}</td>
                <td>{a.author.name}</td>
                <td>{a.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Books

