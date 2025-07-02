import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View, Switch } from "react-native";
import { Amplify, PubSub, Auth } from "aws-amplify";
import { AWSIoTProvider } from "@aws-amplify/pubsub";
import awsexport from "./aws/aws-export";
import { useState } from "react";

interface MQTTData {
  [key: string]: any;
}
declare type MQTTDatat = MQTTData;
const publishTopic: string = "esp32-1/sub";
const subscribeTopic: string = "esp32-1/pub";
let sdata: MQTTDatat;
let counter = 0;

Amplify.configure(awsexport);
PubSub.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: "eu-west-1",
    aws_pubsub_endpoint: "-",
  }),
);
PubSub.subscribe(subscribeTopic).subscribe({
  next: (data) => {
    console.log("Message received", data);
    sdata = data;
  },
  error: (error) => console.error(error),
  complete: () => console.log("Done"),
});

const shuttersRefreshStatus = () => {
  const [shuttersStatus, setShuttersStatusText] = useState("");
  let sD = "spróbuj zaraz...";
  const onPressBtn = () => {
    PubSub.publish(publishTopic, { msg: "report" });
    if (sdata != null && sdata != undefined) {
      let sDb: boolean = sdata["value"]["state"]["reported"]["shuttersDown"];
      if (sDb != null) {
        if (sDb === true) {
          sD = "Shutters down";
        } else {
          sD = "Shutters up";
        }
      }
    }
    setShuttersStatusText(sD);
  };

  return (
    <View>
      <Text
        style={{
          marginLeft: "10%",
          backgroundColor: "#CBD4D6",
          alignSelf: "flex-start",
        }}
      >
        {shuttersStatus}
      </Text>
      <Button
        title="Odśwież status rolet"
        color="#CBE4D6"
        onPress={onPressBtn}
      ></Button>
    </View>
  );
};

const lightSensorFE = () => {
  const [isEnabled, setlSFESwitch] = useState(false);
  const [lsfeText, setLsfeText] = useState(
    "Sterowanie funkcją czujnika światła",
  );
  const toggleSwitch = () => {
    setlSFESwitch((previousState) => !previousState);
    setLsfeText(() =>
      !isEnabled
        ? "Funkcja czujnika światła włączona"
        : "Funkcja czujnika światła wyłączona",
    );
    if (!isEnabled) {
      PubSub.publish(publishTopic, { msg: "lfe_1" });
    } else {
      PubSub.publish(publishTopic, { msg: "lfe_0" });
    }
    console.log("switch:" + !isEnabled);
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          marginLeft: "0%",
          backgroundColor: "#CBD4D6",
          alignSelf: "flex-start",
        }}
      >
        {lsfeText}
      </Text>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      ></Switch>
    </View>
  );
};

export default function App() {
  console.log("export default function App()");
  return (
    <View style={styles.container}>
      {shuttersRefreshStatus()}
      <View style={{ flexDirection: "row" }}>
        <Button
          title="Up"
          color="#CBE4D6"
          onPress={() => {
            PubSub.publish(publishTopic, { msg: "roll_up" });
            counter = counter + 1;
            console.log(counter);
          }}
        ></Button>
        <Button
          title="Down"
          color="#CBE4D6"
          onPress={() => {
            PubSub.publish(publishTopic, { msg: "roll_down" });
            counter = counter + 1;
            console.log(counter);
          }}
        ></Button>
      </View>
      <StatusBar style="auto" />
      {lightSensorFE()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
