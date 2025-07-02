#include <Arduino.h>
#include <Preferences.h>

enum PossibleStates {
  INIT=0,
  SETUP,
  NORMAL
};

//this is consumed by taskShutters, filled by taskMqtHandler
struct shuttersStruct{
  Preferences preferences;
  PossibleStates state;
  String shutters = ""; // mqtt message from messageHandler from deserialized doc["shutters"]
  uint16_t lightLux; // calculated and filled in taskLightSensor, used in taskShutters
  uint8_t blinkAmount;
  bool lfeEnabled = false;
  bool shuttersDown = false; // shutters status from device
};

