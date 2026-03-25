import { Routes, Route } from 'react-router-dom'
import TablePage from './pages/Table/TablePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TablePage />} />
    </Routes>
  )
}
