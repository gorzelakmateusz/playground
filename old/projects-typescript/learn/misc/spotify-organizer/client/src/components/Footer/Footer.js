import React from "react";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import PinterestIcon from "@mui/icons-material/Pinterest";
import "./Footer.css";

function Footer() {
  return (
    <div className="footer">
      <p> &copy; 2023 spotifyorganizer.matgosoft.com </p>
      <div className="socialMedia">
        <InstagramIcon fontSize="large" sx={{ color: "#E1306C" }} />
        <YouTubeIcon fontSize="large" sx={{ color: "#FF0000" }} />
        <FacebookIcon color="primary" fontSize="large" />
        <TwitterIcon fontSize="large" sx={{ color: "#1DA1F2" }} />
        <PinterestIcon fontSize="large" sx={{ color: "#E60023" }} />
      </div>
    </div>
  );
}

export default Footer;
