#include <Arduino.h>
#ifndef LED_BUILTIN
    #define LED_BUILTIN 2
#endif

void taskBlinker(void * parameter);