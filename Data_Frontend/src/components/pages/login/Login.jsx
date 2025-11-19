import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import toast, { Toaster } from "react-hot-toast";
import "./Login.css";

const AnimatedText = ({ text, className, delay = 100, color }) => {
  const [letters, setLetters] = useState([]);

  useEffect(() => {
    setLetters(text.split(""));
  }, [text]);

  return (
    <h1 className={`animated-text ${className}`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className="animated-letter"
          style={{
            animationDelay: `${index * delay}ms`,
            color: color,
          }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
};
AnimatedText.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
  delay: PropTypes.number,
  color: PropTypes.string,
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    // Validación local temporal
    if (email === "databig@gmail.com" && password === "123abc") {
      toast.success("Bienvenido, User 👋");
      setTimeout(() => navigate("/"), 1500);
    } else {
      toast.error("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="login-page">
      <Toaster position="top-right" />
      <div className="login-card">
        
        <div className="login-title">
          <AnimatedText text="Data" className="principal-binvity" delay={80} />
          <AnimatedText text="Big" color="#ffffff" delay={80} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">

            <AnimatedText text="Correo electronico" delay={50} className="small-text" />

            <input
              type="email"
              name="email"
              placeholder="Ingrese su correo"
              required
            />
          </div>

          <div className="input-group password-group">
            <AnimatedText text="Contraseña" delay={50} className="small-text" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Ingrese su contraseña"
              required
            />
            <button
              type="button"
              className="show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button type="submit" className="back-home-btn">
            Ingresar
          </button>
        </form>

        <p className="signup-text">
          ¿No tienes cuenta? <span className="signup-link">Regístrate</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
