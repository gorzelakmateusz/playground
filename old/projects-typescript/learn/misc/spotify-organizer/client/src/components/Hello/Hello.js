import React, { useContext } from "react";
import "./Hello.css";
import { HelloContext } from "../HelloContext";

const SlowText = (props) => {
  const { data, updateData } = useContext(HelloContext);
  const { speed, text } = props;
  const [placeholder, setPlaceholder] = React.useState(text[0]);
  const index = React.useRef(0);

  React.useEffect(() => {
    function tick() {
      index.current++;
      setPlaceholder((prev) => prev + text[index.current]);
    }
    if (index.current < text.length - 1) {
      let addChar = setInterval(tick, speed);
      return () => clearInterval(addChar);
    } else {
      updateData(!data);
    }
  }, [placeholder, speed, text, data, updateData]);
  return <span>{placeholder}</span>;
};

function Hello() {
  return (
    <div className="Hello">
      <SlowText speed={400} text={"Hello.   "} />
    </div>
  );
}

export default Hello;
