import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";
import { useNavigate } from "react-router-dom";

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
          "http://spotifyorganizer.matgosoft.com/check-login",
          {
            cancelToken: source.token,
          },
        );
        const userIsLoggedIn = response.data.isLoggedIn;
        if (userIsLoggedIn) {
          login(); // Update the context if the user is logged in
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error checking login status:", error.message);
          // Handle other errors if needed
        }
      } finally {
        setLoading(false);
      }
    };

    checkSpotifyLoginStatus();

    // Clean up the effect if unmounting
    return () => {
      source.cancel("Request canceled: Component unmounted");
    };
  }, [login]); // 'login' added to the dependency array

  const handleLogin = () => {
    // Redirect the user to the Spotify login page
    window.location.href = authorizeURL;
  };

  useEffect(() => {
    // Fetch the Spotify authorization URL
    const fetchSpotifyAuthURL = async () => {
      try {
        const response = await axios.get(
          "http://spotifyorganizer.matgosoft.com/login",
        );
        setAuthorizeURL(response.data.authorizeURL);
      } catch (error) {
        console.error(
          "Error fetching Spotify authorization URL:",
          error.message,
        );
        // Handle errors if needed
      }
    };

    fetchSpotifyAuthURL();
  }, []); // Empty dependency array to run only once when the component mounts

  useEffect(() => {
    // Check for a callback from Spotify
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Handle the Spotify callback logic here
      handleSpotifyCallback(code);
    }
  }, []); // Empty dependency array to run only once when the component mounts

  const handleSpotifyCallback = async (code) => {
    console.log("handleSpotifyCallback 0");
    try {
      // Make a request to your backend to exchange the code for an access token
      const response = await axios.get(
        `http://spotifyorganizer.matgosoft.com/callback?code=${code}`,
      );
      console.log("handleSpotifyCallback response: ", response);
      // Assuming your backend sends a success response upon successful authentication
      if (response.data.success) {
        // Update the context
        console.log("handleSpotifyCallback before login");
        login();
        console.log("handleSpotifyCallback after login");
        // Navigate the user back to the original login route
        console.log("handleSpotifyCallback before navigate/login");
        navigate("/login");
        console.log("handleSpotifyCallback after navigate/login");
      } else {
        // Handle authentication failure
      }
    } catch (error) {
      console.error("Error handling Spotify callback:", error.message);
      // Handle errors if needed
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

export default SpotifyAuthorization;
