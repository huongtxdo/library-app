import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'

const Recommendations = () => {
  const userResult = useQuery(ME)

  if (userResult.loading) return <>loading ...</>

  const recommendResult = useQuery(ALL_BOOKS, {
    variables: { genre: userResult.data.me.favoriteGenre },
    skip: !userResult.data.me,
  })
  if (recommendResult.loading) return <>loading ...</>

  return (
    <>
      {recommendResult.data && (
        <>
          <h2>Recommendations</h2>
          <h4>books in your favorite genre</h4>{' '}
          <table>
            <tbody>
              <tr>
                <th></th>
                <th>author</th>
                <th>published</th>
              </tr>
              {recommendResult.data.allBooks.map((a) => (
                <tr key={a.title}>
                  <td>{a.title}</td>
                  <td>{a.author.name}</td>
                  <td>{a.published}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}

export default Recommendations

