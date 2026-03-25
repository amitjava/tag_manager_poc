import { Routes, Route } from 'react-router-dom'
import TablePage from './pages/Table/TablePage'
import CreatePage from './pages/Create/CreatePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TablePage />} />
      <Route path="/create" element={<CreatePage />} />
    </Routes>
  )
}
