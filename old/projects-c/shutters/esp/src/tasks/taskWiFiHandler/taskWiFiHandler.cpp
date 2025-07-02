#include "taskWiFiHandler.h"
#include "WiFi.h"
#include "customTypes.h"


void taskWiFiHandler(void * parameter){
    vTaskDelay(1000 / portTICK_PERIOD_MS);
    String ssid = "";
    String password = ""; 

    //for now hardcoded
    ((shuttersStruct *)parameter)->preferences.begin("storage", false);
    ((shuttersStruct *)parameter)->preferences.putString("ssid", ""); 
    ((shuttersStruct *)parameter)->preferences.putString("password", "!"); 
    ssid = ((shuttersStruct *)parameter)->preferences.getString("ssid"); 
    password = ((shuttersStruct *)parameter)->preferences.getString("password");
    ((shuttersStruct *)parameter)->preferences.end();
    if (ssid == "" || password == ""){
      Serial.print("\n[taskWiFiHandler] No values saved for ssid or password");
      ((shuttersStruct *)parameter)->state = PossibleStates::SETUP;
    }
    else {
      WiFi.mode(WIFI_STA);
      WiFi.begin(ssid.c_str(), password.c_str());
      Serial.print("\n[taskWiFiHandler] Connecting to WiFi..");
      while (WiFi.status() != WL_CONNECTED) {
        ((shuttersStruct *)parameter)->state = PossibleStates::INIT;
        Serial.print('.');
        delay(1000);
      }
      ((shuttersStruct *)parameter)->state = PossibleStates::NORMAL;
    }

    for(;;){
        delay(1000);
        if(WiFi.status() == WL_CONNECTED){
        Serial.print("\n[taskWiFiHandler] WiFi ok.");
        }
        else {
          Serial.print("\n[taskWiFiHandler] WiFi connection lost. Reconnecting.");
          while (WiFi.status() != WL_CONNECTED) {
            ((shuttersStruct *)parameter)->state = PossibleStates::INIT;
            Serial.print('.');
            delay(1000);
          }
        }

    }
}
