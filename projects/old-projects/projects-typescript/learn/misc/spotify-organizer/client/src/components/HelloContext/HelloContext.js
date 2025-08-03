import React, { createContext, useState } from "react";

export const HelloContext = createContext();

export const HelloContextProvider = ({ children }) => {
  const [data, setData] = useState(false);
  const updateData = (newData) => {
    setData(newData);
  };

  return (
    <HelloContext.Provider value={{ data, updateData }}>
      {children}
    </HelloContext.Provider>
  );
};
