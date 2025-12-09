import React from 'react'
import { Link } from 'react-router-dom'
import './Logo.css'
import { Activity } from 'lucide-react'

const Logo = () => {
  return (
    <Link to="/" className="logo-container" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
      }}>
        <Activity size={28} color="#fff" strokeWidth={2.5} />
      </div>
      <h1 className="logo-text">Data_big</h1>
    </Link>
  )
}

export default Logo
