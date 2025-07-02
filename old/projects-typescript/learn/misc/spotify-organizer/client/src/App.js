import React, { useContext } from "react";
import "./App.css";
import Navbar from "./components/Navbar/Navbar.js";
import Home from "./pages/Home/Home.js";
import About from "./pages/About/About.js";
import Contact from "./pages/Contact/Contact.js";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import { HelloContext } from "./components/HelloContext";

function App() {
  // eslint-disable-next-line
  const { data, updateData } = useContext(HelloContext);

  return (
    <div className="App">
      <BrowserRouter>
        {data === true ? <Navbar /> : null}
        <Routes>
          <Route path="/" exact Component={Home} />
          <Route path="/about" exact Component={About} />
          <Route path="/contact" exact Component={Contact} />
          <Route path="/login" exact Component={Login} />
        </Routes>
        {data === true ? <Footer /> : null}
      </BrowserRouter>
    </div>
  );
}

export default App;
