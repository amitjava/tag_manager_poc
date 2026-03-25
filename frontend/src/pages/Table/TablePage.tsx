import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Advertiser {
  id: number
  name: string
  tag_name: string
}

export default function TablePage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/advertisers')
      .then((r) => r.json())
      .then((data) => {
        setAdvertisers(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: 0 }}>Tag Manager</h1>
        <button onClick={() => navigate('/create')} style={btnStyle('primary')}>
          + Create Tag
        </button>
      </div>

      {advertisers.length === 0 ? (
        <p style={{ color: '#888' }}>No advertisers yet. Create one to get started.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={thStyle}>Advertiser Name</th>
              <th style={thStyle}>Tag Name</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {advertisers.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{a.name}</td>
                <td style={tdStyle}>{a.tag_name}</td>
                <td style={tdStyle}>
                  <button onClick={() => navigate(`/edit/${a.id}`)} style={btnStyle('secondary')}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{ ...btnStyle('danger'), marginLeft: '0.5rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  async function handleDelete(id: number) {
    if (!confirm('Delete this advertiser and its tag file?')) return
    await fetch(`/api/advertisers/${id}`, { method: 'DELETE' })
    setAdvertisers((prev) => prev.filter((a) => a.id !== id))
  }
}

const thStyle: React.CSSProperties = { padding: '0.75rem 1rem', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem' }

function btnStyle(variant: 'primary' | 'secondary' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '0.4rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
  }
  if (variant === 'primary') return { ...base, background: '#2563eb', color: '#fff' }
  if (variant === 'danger') return { ...base, background: '#ef4444', color: '#fff' }
  return { ...base, background: '#f3f4f6', color: '#374151' }
}
