import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../molecules/header/Logo";
import MainMenu from "../molecules/header/MainMenu";
import { Menu, X } from "lucide-react";
import "./MainHeader.css";

const MainHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="main-header-modern">
      <div className="header-container-modern">
        <Logo />

        <button className="menu-toggle-modern" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        <nav className={`menu-nav-modern ${menuOpen ? "open" : ""}`}>
          <MainMenu onLinkClick={() => setMenuOpen(false)} />
        </nav>

        <div className="header-actions-modern">
          <Link to="/login" className="login-btn-modern">Ingresar</Link>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
