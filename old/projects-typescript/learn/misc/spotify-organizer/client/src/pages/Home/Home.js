import React, { useContext } from "react";
// import { Link } from "react-router-dom";
import BannerImage from "../../assets/headphones.jpg";
import "./Home.css";
import Hello from "../../components/Hello/Hello.js";
import { HelloContext } from "../../components/HelloContext";

function HomeContent() {
  return (
    <div className="home" style={{ backgroundImage: `url(${BannerImage})` }}>
      <div className="headerContainer">
        <h1 style={{ color: "white" }}> Organize your songs with us. </h1>
        {/* <Link to="/about">
        <button>About us.</button>
      </Link> */}
      </div>
    </div>
  );
}

function Home() {
  const { data } = useContext(HelloContext);
  console.log(data);
  return data === true ? <HomeContent /> : <Hello />;
}

export default Home;
