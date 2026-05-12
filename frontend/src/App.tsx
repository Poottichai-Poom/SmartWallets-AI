import { useState, useEffect } from 'react'
import axios from 'axios'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get('http://localhost:3001/health')
        setBackendStatus(response.data.message)
      } catch (error) {
        setBackendStatus('Backend unreachable')
        console.error('Error connecting to backend:', error)
      }
    }
    checkBackend()
  }, [])

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={reactLogo} className="logo react" alt="React logo" />
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </div>
        <div>
          <h1>SmartWallets-AI</h1>
          <p>
            Backend Status: <strong>{backendStatus}</strong>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
    </>
  )
}

export default App
