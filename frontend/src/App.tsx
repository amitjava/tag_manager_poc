import { Routes, Route } from 'react-router-dom'
import TablePage from './pages/Table/TablePage'
import CreatePage from './pages/Create/CreatePage'
import EditPage from './pages/Edit/EditPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TablePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/edit/:id" element={<EditPage />} />
    </Routes>
  )
}
