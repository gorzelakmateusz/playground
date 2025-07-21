# draft

## turn on monitor mode
sudo ip link set wlan0 down
sudo iwconfig wlan0 mode monitor
sudo ip link set wlan0 up

## turn off monitor mode
sudo ip link set wlan0 down
sudo iwconfig wlan0 mode managed
sudo ip link set wlan0 up



### check if works
iwconfig wlan0
