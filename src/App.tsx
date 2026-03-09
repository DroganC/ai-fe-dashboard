import { Routes, Route, Navigate } from 'react-router-dom'
import { FireExtinguisherGame } from './games/fire-extinguisher'
import { FireEquipmentRallyGame } from './games/fire-equipment-rally'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/game/fire-extinguisher" replace />} />
      <Route path="/game/fire-extinguisher" element={<FireExtinguisherGame />} />
      <Route path="/game/fire-equipment-rally" element={<FireEquipmentRallyGame />} />
    </Routes>
  )
}

export default App
