import React from "react";
import ReactDOM from "react-dom/client";
import { HelloContextProvider } from "./components/HelloContext";
import { AuthProvider } from "./components/AuthContext";
import App from "./App.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelloContextProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelloContextProvider>
  </React.StrictMode>,
);
