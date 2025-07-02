import express from "express";
import session from "express-session";
import SpotifyWebApi from "spotify-web-api-node";
import cors from "cors";
import expressWs from "express-ws";

const app = express();
const spotifyApi = new SpotifyWebApi({
  clientId: "-",
  clientSecret: "-",
  redirectUri: "-",
});

const corsOptions = {
  origin: (origin, callback) => {
    // Check if the origin is allowed, or use a dynamic check based on your requirements
    const allowedOrigins = ["-"];
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

// Enable WebSocket support
const { getWss, applyTo } = expressWs(app);
// WebSocket connection handling
app.ws("/ws", (ws) => {
  console.log("WebSocket connection established");

  // Handle WebSocket communication

  // Example: Broadcast a message to all clients
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
  // Check if the user is already authenticated with Spotify
  if (req.session.spotifyAccessToken) {
    // User is already logged in, redirect or handle accordingly
    res.json({ message: "User is already logged in." });
  } else {
    // User is not logged in, initiate Spotify login
    const scopes = ["user-library-read", "user-library-modify"];
    const redirectUri = "http://so.matgosoft.com/"; // Update the redirect URI
    const authorizeURL = spotifyApi.createAuthorizeURL(
      scopes,
      null,
      redirectUri,
    );
    res.json({ authorizeURL }); // Return the authorization URL to the React component
  }
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];

    // Store the access token in the session
    req.session.spotifyAccessToken = accessToken;
    console.log("/callback ", req.session.spotifyAccessToken);

    // Redirect the user to so.spotifyorganizer.com/login with the access token as a query parameter
    res.redirect(`http://so.matgosoft.com/login?accessToken=${accessToken}`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error occurred while authenticating with Spotify.");
  }
});

// Add a new endpoint to check if the user is logged in
app.get("/check-login", (req, res) => {
  try {
    // Check if the user is authenticated by looking at the session data
    // Check if the user is authenticated by looking at the session data
    const isLoggedIn = !!req.session.spotifyAccessToken;
    console.log("isLoggedIn:", isLoggedIn);

    // Respond with the login status
    res.json({ isLoggedIn });
  } catch (error) {
    console.error("Error in /check-login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/my-music", async (eq, res) => {
  try {
    let allPlaylists = [];
    let allAlbums = [];
    let likedSongs = [];

    // Get user playlists with pagination
    let playlistsOffset = 0;
    const playlistsLimit = 50;

    while (true) {
      const playlistsData = await spotifyApi.getUserPlaylists({
        offset: playlistsOffset,
        limit: playlistsLimit,
      });
      const playlists = playlistsData.body.items.map(async (item) => {
        const playlistInfo = {
          id: item.id,
          name: item.name,
          description: item.description,
          tracksCount: item.tracks.total,
          songs: [], // Array to store songs for each playlist
        };

        // Get songs for the current playlist
        const playlistTracksData = await spotifyApi.getPlaylistTracks(item.id);
        const tracks = playlistTracksData.body.items.map((trackItem) => {
          return {
            id: trackItem.track.id,
            title: trackItem.track.name,
          };
        });

        playlistInfo.songs = tracks;
        return playlistInfo;
      });

      allPlaylists = [...allPlaylists, ...(await Promise.all(playlists))];
      playlistsOffset += playlistsLimit;

      if (playlistsData.body.items.length < playlistsLimit) {
        break;
      }
    }

    // Get user albums with pagination
    let albumsOffset = 0;
    const albumsLimit = 50;

    while (true) {
      const albumsData = await spotifyApi.getMySavedAlbums({
        offset: albumsOffset,
        limit: albumsLimit,
      });
      const albums = albumsData.body.items.map(async (item) => {
        const albumInfo = {
          id: item.album.id,
          name: item.album.name,
          artists: item.album.artists.map((artist) => artist.name).join(", "),
          songs: [], // Array to store songs for each album
        };

        // Get tracks for the current album
        const albumTracksData = await spotifyApi.getAlbumTracks(item.album.id);
        const tracks = albumTracksData.body.items.map((trackItem) => {
          return {
            id: trackItem.id,
            name: trackItem.name,
          };
        });

        albumInfo.songs = tracks;
        return albumInfo;
      });

      allAlbums = [...allAlbums, ...(await Promise.all(albums))];
      albumsOffset += albumsLimit;

      if (albumsData.body.items.length < albumsLimit) {
        break;
      }
    }

    // Get user's saved tracks (Liked Songs) with pagination
    let likedSongsOffset = 0;
    const likedSongsLimit = 50;

    while (true) {
      const likedSongsData = await spotifyApi.getMySavedTracks({
        offset: likedSongsOffset,
        limit: likedSongsLimit,
      });
      const songs = likedSongsData.body.items.map(async (item) => {
        const trackInfo = {
          id: item.track.id,
          name: item.track.name,
          album: {
            id: item.track.album.id,
            name: item.track.album.name,
            artists: item.track.album.artists
              .map((artist) => artist.name)
              .join(", "),
          },
        };
        return trackInfo;
      });

      likedSongs = [...likedSongs, ...(await Promise.all(songs))];
      likedSongsOffset += likedSongsLimit;

      if (likedSongsData.body.items.length < likedSongsLimit) {
        break;
      }
    }

    const response = {
      playlists: allPlaylists,
      albums: allAlbums,
      likedSongs: likedSongs,
    };

    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error occurred while retrieving user's music.");
  }
});

app.delete("/liked-songs/:songId", async (req, res) => {
  const songId = req.params.songId;

  try {
    // Call the Spotify API to remove the song from liked songs
    await spotifyApi.removeFromMySavedTracks([songId]);

    res.status(200).json({
      message: `Song with ID ${songId} has been removed from liked songs.`,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to remove a song from a specific playlist
app.delete("/playlists/:playlistId/songs/:songId", async (req, res) => {
  const { playlistId, songId } = req.params;

  try {
    // Call the Spotify API to remove the song from the playlist
    /*await*/ spotifyApi.removeTracksFromPlaylist(playlistId, [songId]);
    res.status(200).json({
      message: `Song with ID ${songId} has been removed from the playlist.`,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//add song to playlist
//add song to liked songs
//reorder song in playlist
//reorder song in liked songs

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
