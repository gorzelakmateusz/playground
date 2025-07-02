import { useEffect, useState } from "react";
import "./App.css";

/**
 * App Component
 *
 * This is the main application component responsible for managing various UI states
 * and demonstrating basic React state management, event handling, and side effects.
 */
function App() {
  // --- State Declarations ---
  // Numeric counter for general demonstration
  const [count, setCount] = useState<number>(() => {
    const storedCount = localStorage.getItem("count");
    return storedCount ? parseInt(storedCount, 10) : 0;
  });
  // String state, modified by appending a dot on click
  const [name, setName] = useState("test");
  // Boolean state for simple toggling behavior
  const [boolVar, setBoolVar] = useState(true);
  // Another numeric counter, specifically to demonstrate async state logging
  const [counter, setCounter] = useState(0);
  // Boolean state for conditional CSS styling
  const [isButtonActive, setIsButtonActive] = useState(false);
  // Numeric state for demonstrating useEffect dependencies
  const [effectCounter, setEffectCounter] = useState(0);
  // Boolean state for conditional CSS styling
  const [isButtonActive2, setIsButtonActive2] = useState(false);

  // --- Effects ---
  /**
   * Effect hook to log changes in the `count` state.
   * Runs whenever the `count` variable is updated.
   */
  useEffect(() => {
    console.log(`[log from useEffect] Count changed to: ${count}`);
  }, [count]);

  /**
   * Effect hook to log changes in the `effectCounter` state.
   * Runs whenever the `effectCounter` variable is updated.
   */
  useEffect(() => {
    console.log(
      `[log from useEffect] EffectCounter changed to: ${effectCounter}`,
    );
  }, [effectCounter]);

  /**
   * Effect hook to log changes in the `isButtonActive2` state.
   * Runs whenever the `isButtonActive2` variable is updated.
   */
  useEffect(() => {
    console.log(
      `[log from useEffect] isButtonActive2 changed to: ${isButtonActive2}`,
    );
  }, [isButtonActive2]);

  /**
   * Effect hook to load the `count` state from localStorage.
   * Runs once on component mount.
   */
  useEffect(() => {
    const savedCounter = localStorage.getItem("count");
    console.log("🔄 Odczyt z localStorage przy starcie:", savedCounter);
    if (savedCounter !== null) {
      setCount(parseInt(savedCounter));
    }
  }, []);

  /**
   * Effect hook to save the `count` state to localStorage.
   * Runs whenever the `count` variable is updated.
   */
  useEffect(() => {
    console.log("Zapisuję count do localStorage:", count);
    localStorage.setItem("count", count.toString());
  }, [count]);

  // --- Event Handlers ---
  /**
   * Handles the click event for the `counter` button.
   * Increments the counter and logs its *new* value directly.
   * Note: `console.log(counter)` inside the setter callback would log the old value
   * due to the asynchronous nature of state updates.
   */
  const handleCounterClick = () => {
    // Calculate the new value first to ensure the log reflects it immediately
    const newCounterValue = counter + 1;
    setCounter(newCounterValue);
    console.log(
      `[log from handleCounterClick] Counter (after click): ${newCounterValue}`,
    );
  };

  /**
   * Handles the click event for the `isButtonActive` (b2) button.
   * Toggles its boolean state and logs its *old* value,
   * demonstrating the asynchronous nature of setState.
   */
  const handleToggleButtonClick = () => {
    setIsButtonActive((prevIsActive) => !prevIsActive);
    console.log(
      `[log from handleToggleButtonClick] isButtonActive (before next render): ${isButtonActive}`,
    ); // This will log the old value
  };

  /**
   * Handles the click event for the `effectCounter` button.
   * Increments the `effectCounter` and logs its new value directly.
   */
  const handleEffectCounterClick = () => {
    const newEffectCounterValue = effectCounter + 1;
    setEffectCounter(newEffectCounterValue);
    console.log(
      `[log from handleEffectCounterClick] EffectCounter (from button click): ${newEffectCounterValue}`,
    );
  };

  // --- Render Method ---
  return (
    <>
      <div className="card">
        {/* Button: Increment Count */}
        <button onClick={() => setCount((prevCount) => prevCount + 1)}>
          Count is {count}
        </button>

        {/* Button: Append to Name */}
        <button onClick={() => setName((prevName) => prevName + ".")}>
          {name}
        </button>

        {/* Button: Toggle Boolean Variable */}
        <button onClick={() => setBoolVar((prevBool) => !prevBool)}>
          {String(boolVar)}
        </button>

        {/* Button: Increment Counter with Direct Log of New Value */}
        <button onClick={handleCounterClick}>{counter}</button>

        {/* Button: Toggle Boolean for CSS Styling */}
        <button
          onClick={handleToggleButtonClick}
          className={isButtonActive ? "btn-on" : "btn-off"}
        >
          {String(isButtonActive)}
        </button>

        {/* Button: Increment Effect Counter */}
        <button onClick={handleEffectCounterClick} id="effectCounterBtn">
          {effectCounter}
        </button>

        <button
          onClick={() => setIsButtonActive2((prevIsActive) => !prevIsActive)}
          className={isButtonActive2 ? "btn-on" : "btn-off"}
        >
          {String(isButtonActive2)}
        </button>
      </div>
    </>
  );
}

export default App;
