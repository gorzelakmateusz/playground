#include <Arduino.h>
#define LIGHT_PIN 33
#define LIGHT_METER_SAMPLES_COUNT 21

struct point{
  uint16_t x; //ky018 adc 12 bit output
  uint16_t y; //lux measured with smartphone
};
static const point points[LIGHT_METER_SAMPLES_COUNT] = {{0, 2500}, {50, 1650}, {100, 1100}, {150, 900}, {200, 560},
                    {250, 450}, {300, 440}, {350, 380}, {400, 330}, {450, 250},
                    {500, 210}, {550, 200}, {600, 190}, {750, 110}, {1100, 78},
                    {2000, 30}, {2500, 24}, {3000, 7}, {3500, 3}, {4000, 0 }, {4095, 0}};

void taskLightSensor(void * parameter);