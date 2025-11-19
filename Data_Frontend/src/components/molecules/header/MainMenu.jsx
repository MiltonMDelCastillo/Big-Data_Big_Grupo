import React from 'react'
import { Link } from 'react-router-dom'
import './MainMenu.css'

// eslint-disable-next-line react/prop-types
const MainMenu = ({ onLinkClick }) => {
  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/productos', label: 'Analítica' },
    { to: '/contacto', label: 'Contacto' },
    { to: '/acerca', label: 'Acerca de' },
    
  ]

  return (
    <ul className="menu-list">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            onClick={onLinkClick}
            className="menu-link"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default MainMenu
