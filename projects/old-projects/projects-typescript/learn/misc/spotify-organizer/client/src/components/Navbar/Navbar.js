import React, { useState } from "react";
import Logo from "../../assets/logo.jpg";
import { Link } from "react-router-dom";
import ReorderIcon from "@mui/icons-material/Reorder";
import "./Navbar.css";
import { Button } from "@mui/material";

function Navbar() {
  const [openLinks, setOpenLinks] = useState(false);
  const toggleNavbar = () => {
    setOpenLinks(!openLinks);
  };

  return (
    <div className="navbar">
      <div className="leftSide" id={openLinks ? "open" : "close"}>
        <img src={Logo} alt="img-not-loaded" />
        <div className="hiddenLinks">
          <Link to="/">HOME</Link>
          <Link to="/about">ABOUT</Link>
          <Link to="/contact">CONTACT</Link>
          <Link to="/login">LOGIN WITH SPOTIFY</Link>
        </div>
      </div>

      <div className="rightSide">
        <Link to="/">HOME</Link>
        <Link to="/about">ABOUT</Link>
        <Link to="/contact">CONTACT</Link>
        <Link to="/login">LOGIN WITH SPOTIFY</Link>
        <Button onClick={toggleNavbar}>
          <ReorderIcon />
        </Button>
      </div>
    </div>
  );
}

export default Navbar;
