#include "tasks/taskBlinker/taskBlinker.h"
#include "tasks/taskLightSensor/taskLightSensor.h"
#include "tasks/taskMqttHandler/taskMqttHandler.h"
#include "tasks/taskShutters/taskShutters.h"
#include "tasks/taskWifiHandler/taskWiFiHandler.h"
#include "customTypes.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"


shuttersStruct dataForShutters;


void setup()
{

  Serial.begin(9600);
  Serial.println("Setting state to INIT");
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); //disable   detector

  xTaskCreate(
    taskBlinker,
    "taskBlinker",
    5000,
    (void*)&dataForShutters.blinkAmount,
    10,
    NULL
  );
  xTaskCreate(
    taskLightSensor,
    "taskLightSensor",
    5000,
    (void*)&dataForShutters.lightLux,
    4,
    NULL
  );
  xTaskCreate(
    taskMqttHandler,
    "taskMqttHandler",
    10000,
    (void*)&dataForShutters,
    3,
    NULL
  );
  xTaskCreate(
    taskShutters,
    "taskShutters",
    5000,
    (void*)&dataForShutters,
    2,
    NULL
  );
  xTaskCreate(
    taskWiFiHandler,
    "taskWiFiHandler",
    5000,
    (void*)&dataForShutters,
    1,
    NULL
  );
  

  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(R_DOWN_PIN, OUTPUT);
  pinMode(R_UP_PIN, OUTPUT);
  dataForShutters.state = PossibleStates::INIT;
}


void loop()
{
  switch (dataForShutters.state)
  {
    case PossibleStates::INIT:
      dataForShutters.blinkAmount = 1;
      //jezeli nie ma wifi, state setup?
      break;
    case PossibleStates::SETUP:
      dataForShutters.blinkAmount = 2;
      break;
    case PossibleStates::NORMAL:
      dataForShutters.blinkAmount = 3;
      break;
    default:
      dataForShutters.blinkAmount = 4;
      Serial.print("Default state reached");
      ESP.restart();
      break;
  }
}
