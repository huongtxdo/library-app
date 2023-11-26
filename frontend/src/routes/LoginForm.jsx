import { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN } from '../queries'

import { useNavigate } from 'react-router-dom'

const LoginForm = ({ setError, setToken, refetch }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  const [login, result] = useMutation(LOGIN, {
    onError: (error) => {
      setError(error.graphQLErrors[0].message)
    },
  })

  useEffect(() => {
    if (result.data) {
      const token = result.data.login.value
      setToken(token)
      localStorage.setItem('login-token', token)
      refetch()
      navigate('/')
    }
  }, [result.data])

  const submit = (e) => {
    e.preventDefault()
    login({ variables: { username, password } })
  }

  return (
    <>
      <form onSubmit={submit}>
        <div>
          username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div>
          password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit">login</button>
      </form>
    </>
  )
}

export default LoginForm

