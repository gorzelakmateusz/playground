import React, { Component } from "react";
import { Window, App, Button } from "proton-native";
import { cpuUsage } from "node:process";

var robot = require("robotjs");
robot.setMouseDelay(50);

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export default class Example extends Component {
  move() {
    for (let x = 0, y = 5; x < 100; x++) {
      robot.moveMouse(x, y);
    }
  }

  async ktap() {
    console.log(cpuUsage(startUsage));
    for (let i = 0; i < 60; ++i) {
      robot.keyTap("audio_vol_down");
      await delay(2000);
      robot.keyTap("audio_vol_up");
      await delay(60000);
    }
  }

  render() {
    // all Components must have a render method
    return (
      <App>
        {/* you must always include App around everything */}
        <Window style={{ width: 300, height: 300, backgroundColor: "black" }}>
          {
            /* all your other components go here*/

            <Button
              style={{ backgroundColor: "red" }}
              title="Move mouse"
              onPress={() => {
                console.log("Pressed");
                //this.move();
                this.ktap();
              }}
            />
          }
        </Window>
      </App>
    );
  }
}
