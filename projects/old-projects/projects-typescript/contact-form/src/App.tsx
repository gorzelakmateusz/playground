import "./App.css";
import SimpleForm from "./SimpleForm";
import ReactHookForm from "./ReactHookForms";
import ContactFormZod from "./ContactFormZod";

function App() {
  return (
    <>
      <div className="App">
        <SimpleForm />
        <ReactHookForm />
        <ContactFormZod />
      </div>
    </>
  );
}

export default App;
