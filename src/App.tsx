import { Routes, Route, Navigate } from 'react-router-dom'
import { FireExtinguisherGame } from './games/fire-extinguisher'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/game/fire-extinguisher" replace />} />
      <Route path="/game/fire-extinguisher" element={<FireExtinguisherGame />} />
    </Routes>
  )
}

export default App
