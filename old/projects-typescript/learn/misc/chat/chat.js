// Deprecated
// --- React part ---
import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar/Navbar.js";
import Home from "./pages/Home/Home.js";
import About from "./pages/About/About.js";
import Contact from "./pages/Contact/Contact.js";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Footer from "./components/Footer.js";
import { HelloContext } from "./components/HelloContext.js";
import axios from "axios";
import { useAuth } from "./components/AuthContext";

function App() {
  const { data } = useContext(HelloContext);

  return (
    <div className="App">
      <BrowserRouter>
        {data === true ? <Navbar /> : null}
        <Routes>
          <Route path="/" exact Component={Home} />
          <Route path="/about" exact Component={About} />
          <Route path="/contact" exact Component={Contact} />
          <Route path="/login" exact Component={SpotifyAuthorization} />
        </Routes>
        {data === true ? <Footer /> : null}
      </BrowserRouter>
    </div>
  );
}

function SpotifyAuthorization() {
  const { isLoggedIn, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authorizeURL, setAuthorizeURL] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const source = axios.CancelToken.source();

    const checkSpotifyLoginStatus = async () => {
      try {
        const response = await axios.get(
          "http://spotifyorganizer.domain.com/check-login",
          {
            cancelToken: source.token,
          },
        );
        const userIsLoggedIn = response.data.isLoggedIn;
        if (userIsLoggedIn) {
          login();
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error checking login status:", error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSpotifyLoginStatus();

    return () => {
      source.cancel("Request canceled: Component unmounted");
    };
  }, [login]);

  const handleLogin = () => {
    window.location.href = authorizeURL;
  };

  useEffect(() => {
    const fetchSpotifyAuthURL = async () => {
      try {
        const response = await axios.get(
          "http://spotifyorganizer.domain.com/login",
        );
        setAuthorizeURL(response.data.authorizeURL);
      } catch (error) {
        console.error(
          "Error fetching Spotify authorization URL:",
          error.message,
        );
      }
    };

    fetchSpotifyAuthURL();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleSpotifyCallback(code);
    }
  }, []);

  const handleSpotifyCallback = async (code) => {
    try {
      const response = await axios.get(
        `http://spotifyorganizer.domain.com/callback?code=${code}`,
      );
      if (response.data.success) {
        login();
        navigate("/login");
      }
    } catch (error) {
      console.error("Error handling Spotify callback:", error.message);
    }
  };

  return (
    <div className="Login">
      {loading ? (
        <p>Loading...</p>
      ) : isLoggedIn ? (
        <p>User is logged in!</p>
      ) : (
        <>
          <p>User is not logged in!</p>
          <button onClick={handleLogin}>Login with Spotify</button>
        </>
      )}
    </div>
  );
}

export default App;
export { SpotifyAuthorization };

// --- Node.js backend part ---
import express from "express";
import session from "express-session";
import SpotifyWebApi from "spotify-web-api-node";
import cors from "cors";
import expressWs from "express-ws";

const app = express();

const spotifyApi = new SpotifyWebApi({
  clientId: "myclientid",
  clientSecret: "myclientsecret",
  redirectUri: "http://spotifyorganizer.domain.com/callback",
});

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://domain.com",
      "http://domain.com/login",
      "http://spotifyorganizer.domain.com",
    ];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  }),
);

const { getWss } = expressWs(app);

app.ws("/ws", (ws) => {
  console.log("WebSocket connection established");

  ws.on("message", (message) => {
    getWss().clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

app.get("/", (req, res) => {
  res.json({ msg: "hw1" });
});

app.get("/login", (req, res) => {
  if (req.session.spotifyAccessToken) {
    res.json({ message: "User is already logged in." });
  } else {
    const scopes = ["user-library-read", "user-library-modify"];
    const redirectUri = "http://domain.com/";
    const authorizeURL = spotifyApi.createAuthorizeURL(
      scopes,
      null,
      redirectUri,
    );
    res.json({ authorizeURL });
  }
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];

    req.session.spotifyAccessToken = accessToken;
    console.log("/callback ", req.session.spotifyAccessToken);

    res.redirect(`http://domain.com/login?accessToken=${accessToken}`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error occurred while authenticating with Spotify.");
  }
});

app.get("/check-login", (req, res) => {
  try {
    const isLoggedIn = !!req.session.spotifyAccessToken;
    console.log("isLoggedIn:", isLoggedIn);
    res.json({ isLoggedIn });
  } catch (error) {
    console.error("Error in /check-login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
