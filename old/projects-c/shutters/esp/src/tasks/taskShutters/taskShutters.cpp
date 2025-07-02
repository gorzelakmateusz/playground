#include "taskShutters.h"
#include "customTypes.h"


void taskShutters(void * parameter){
  vTaskDelay(5000 / portTICK_PERIOD_MS);
  unsigned long currentTime;
  unsigned long elapsedTime;
  unsigned long timer_shutters_up = 0;
  unsigned long timer_shutters_down = 0;
  uint8_t light_delay_counter = 0;
  uint8_t sample_counter = 0;

  bool shuttersChangeOngoing;
  bool flashShuttersChangeOngoing;
  bool flashShuttersDown;

  try //setup
  {
    ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
    flashShuttersDown = ((shuttersStruct *)parameter)->preferences.getBool("fSD"); 
    flashShuttersChangeOngoing = ((shuttersStruct *)parameter)->preferences.getBool("fSCO"); 
    ((shuttersStruct *)parameter)->preferences.end();
    ((shuttersStruct *)parameter)->shuttersDown = flashShuttersDown;
    shuttersChangeOngoing = flashShuttersChangeOngoing;
    Serial.print("\n[taskShutters] (!!! shutters_down, shuttersChangeOngoing are set, extracting...");
  } catch(const std::exception& e){
    // shutters_down || shuttersChangeOngoing not set in storage -> init it in storage then load variables
    ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
    ((shuttersStruct *)parameter)->preferences.putBool("fSD", false);
    ((shuttersStruct *)parameter)->preferences.putBool("fSCO", false);
    flashShuttersDown = ((shuttersStruct *)parameter)->preferences.getBool("fSD"); 
    flashShuttersChangeOngoing = ((shuttersStruct *)parameter)->preferences.getBool("fSCO");
    ((shuttersStruct *)parameter)->preferences.end();
    ((shuttersStruct *)parameter)->shuttersDown = flashShuttersDown;
    shuttersChangeOngoing = flashShuttersChangeOngoing;
    Serial.print("\n[taskShutters] (!!! fSD, fSCO are not set, setup & extracting...");
  }
  
  //timer_shutters_up == 0 or timer_shutters_down == 0 always after start/restart both true
  if(shuttersChangeOngoing && ((shuttersStruct *)parameter)->shuttersDown){
    // shutters were rolling up but for example esp32 restarted, timer_shutters_up == 0 because of first run after restart etc
    timer_shutters_up = millis();
    timer_shutters_down = 0;
  } 
  else if(shuttersChangeOngoing && ((shuttersStruct *)parameter)->shuttersDown == false){
    // shutters were rolling down but for example esp32 restarted, timer_shutters_down == 0 because of first run after restart etc
    timer_shutters_down = millis();
    timer_shutters_up = 0;
  } 

  for(;;){
    delay(1000);
    Serial.print("\n[taskShutters] (!!! stored value of fSD: ");
    Serial.print(flashShuttersDown); 
    Serial.print("\n[taskShutters] (!!! stored value of fSCO: ");
    Serial.print(flashShuttersChangeOngoing);
    ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
    flashShuttersDown = ((shuttersStruct *)parameter)->preferences.getBool("fSD"); 
    flashShuttersChangeOngoing = ((shuttersStruct *)parameter)->preferences.getBool("fSCO");
    ((shuttersStruct *)parameter)->preferences.end();
    currentTime = millis();

    if(((shuttersStruct *)parameter)->lfeEnabled){
      // set shutters behavior depending on light sensor
      Serial.print("\n[taskShutters] lux val: ");
      Serial.print(((shuttersStruct *)parameter)->lightLux);
      if(light_delay_counter < 0){ // for now delay disabled
        Serial.print("\n[taskShutters] light_delay_counter val: ");
        Serial.print(light_delay_counter);
        light_delay_counter++;
      } else {
        light_delay_counter = 0;

        if(shuttersChangeOngoing == false){
          if(((shuttersStruct *)parameter)->shuttersDown == false){
            if(((shuttersStruct *)parameter)->lightLux < 100 && sample_counter < 5) {
              sample_counter++;
            } else if(((shuttersStruct *)parameter)->lightLux > 100 && sample_counter > 0) {
              //measurements interrupted
              Serial.print("\n[taskShutters] (measurements interrupted- again not dark -sample_counter val: ");
              Serial.print(sample_counter); 
              sample_counter = 0;
            } else if(sample_counter == 5) {
              sample_counter = 0;
              timer_shutters_up = 0;
              timer_shutters_down = currentTime;
              Serial.print("\n[taskShutters] roll_down caused by light sensor");
            } else {
              // do nothing
            }
          } else {
            if(((shuttersStruct *)parameter)->lightLux > 100 && sample_counter < 5) {
              sample_counter++;
            } else if(((shuttersStruct *)parameter)->lightLux < 100 && sample_counter > 0) {
              //measurements interrupted
              Serial.print("\n[taskShutters] (measurements interrupted - again dark) sample_counter val: ");
              Serial.print(sample_counter); 
              sample_counter = 0;
            } else if(sample_counter == 5) {
              sample_counter = 0;
              timer_shutters_up = currentTime;//millis();
              timer_shutters_down = 0;
              Serial.print("\n[taskShutters] roll_up caused by light sensor");
            } else {
            // do nothing
            }
          }
        } else {
          // do nothing
        }
      }
    }



    // set shutters behavior depending on message from mqtt
    if(((shuttersStruct *)parameter)->shutters == "roll_up" ){
      timer_shutters_up = currentTime;
      timer_shutters_down = 0;
      ((shuttersStruct *)parameter)->shutters = "";
      Serial.print("\n[taskShutters] roll_up caused by new mqtt msg");
    } else if(((shuttersStruct *)parameter)->shutters == "roll_down"){
      timer_shutters_up = 0;
      timer_shutters_down = currentTime;
      ((shuttersStruct *)parameter)->shutters = "";
      Serial.print("\n[taskShutters] roll_down caused by new mqtt msg");
    }
      
    // handle shutters behavior
    if (timer_shutters_up != 0){
      Serial.print("\n[taskShutters] timer_shutters_up != 0");
      elapsedTime = currentTime - timer_shutters_up;
      Serial.print("\n[taskShutters] elapsed time: ");
      Serial.print(elapsedTime);
      if (elapsedTime < SHUTTERS_TIME) {
        digitalWrite(R_UP_PIN, HIGH);
        digitalWrite(R_DOWN_PIN, LOW);
        shuttersChangeOngoing = true;
        if(flashShuttersChangeOngoing != shuttersChangeOngoing){
          ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
          ((shuttersStruct *)parameter)->preferences.putBool("fSCO", shuttersChangeOngoing);
          ((shuttersStruct *)parameter)->preferences.end();
        }
        Serial.print("\n[taskShutters] R_UP_PIN, HIGH, opening...");
      } else {
        digitalWrite(R_UP_PIN, LOW);
        timer_shutters_up = 0;
        ((shuttersStruct *)parameter)->shuttersDown = false;
        shuttersChangeOngoing = false;
        if(flashShuttersDown != ((shuttersStruct *)parameter)->shuttersDown){
          ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
          ((shuttersStruct *)parameter)->preferences.putBool("fSD", ((shuttersStruct *)parameter)->shuttersDown);
          ((shuttersStruct *)parameter)->preferences.end();
        }
        if(flashShuttersChangeOngoing != shuttersChangeOngoing){
          ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
          ((shuttersStruct *)parameter)->preferences.putBool("fSCO", shuttersChangeOngoing);
          ((shuttersStruct *)parameter)->preferences.end();
        }
        Serial.print("\n[taskShutters] R_UP_PIN, LOW, opening shutters done.");
      }
    } else if(timer_shutters_down != 0){
      Serial.print("\n[taskShutters] timer_shutters_down != 0");
      elapsedTime = currentTime - timer_shutters_down;
      Serial.print("\n[taskShutters] elapsed time: ");
      Serial.print(elapsedTime);
      if (elapsedTime < SHUTTERS_TIME){
        digitalWrite(R_DOWN_PIN, HIGH);
        digitalWrite(R_UP_PIN, LOW);
        shuttersChangeOngoing = true;
        if(flashShuttersChangeOngoing != shuttersChangeOngoing){
          ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
          ((shuttersStruct *)parameter)->preferences.putBool("fSCO", shuttersChangeOngoing);
          ((shuttersStruct *)parameter)->preferences.end();
        }
        Serial.print("\n[taskShutters] R_DOWN_PIN, HIGH, shutting...");
      } else{
        digitalWrite(R_DOWN_PIN, LOW);
        timer_shutters_down = 0;;
        ((shuttersStruct *)parameter)->shuttersDown = true;
        shuttersChangeOngoing = false;
        if(flashShuttersDown != ((shuttersStruct *)parameter)->shuttersDown){
          ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
          ((shuttersStruct *)parameter)->preferences.putBool("fSD", ((shuttersStruct *)parameter)->shuttersDown);
          ((shuttersStruct *)parameter)->preferences.end();
        }
        if(flashShuttersChangeOngoing != shuttersChangeOngoing){
          ((shuttersStruct *)parameter)->preferences.begin("storageShutters");
          ((shuttersStruct *)parameter)->preferences.putBool("fSCO", shuttersChangeOngoing);
          ((shuttersStruct *)parameter)->preferences.end();
        }
        Serial.print("\n[taskShutters] R_DOWN_PIN, LOW, shutting done.");
      }
    } else {
        //do nothing
    }
  }
}
