import React from 'react';
import { Link } from 'react-router-dom';
import './Error404.css';

const Error404 = () => {
  return (
    <div className="error-page">
      <div className="error-glow"></div>

      <div className="error-card">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Página no encontrada</h2>
        <p className="error-message">
          Lo sentimos, la dimensión que buscas no existe dentro de data big.
        </p>

        <Link to="/" className="back-home-btn">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default Error404;
