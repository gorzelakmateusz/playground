import express, { Request, Response } from "express";
import logger from "jet-logger";

const app = express();
const port = 3000;
const SERVER_START_MSG: string =
  "Express server started on port: " + port.toString();

let ventState: number = 0;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world, from Express!" + req);
});

app.get("/api/esp32-vent/data", (req: Request, res: Response) => {
  logger.info(`ESP32 requested data. Current state: ${ventState}`);
  res.json({ value: ventState });
});

interface CommandRequestBody {
  value: number;
}

app.post(
  "/api/esp32-vent/command",
  (req: Request<{}, {}, CommandRequestBody>, res: Response) => {
    const { value } = req.body;

    if (typeof value === "number" && (value === 0 || value === 1)) {
      ventState = value;
      logger.info(`Command received: Set ventState to ${ventState}`);
      res.status(200).json({
        message: "State updated successfully",
        newValue: ventState,
      });
    } else {
      logger.warn(
        `Invalid command received. Expected value 0 or 1, got: ${value}`
      );
      res.status(400).json({
        error: "Invalid input. 'value' must be 0 or 1.",
        receivedValue: value,
      });
    }
  }
);

app.listen(port, (err?: Error) => {
  if (!!err) {
    logger.err(err.message);
  } else {
    logger.info(SERVER_START_MSG);
  }
});
