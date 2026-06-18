import { Toaster } from "react-hot-toast";
import { Routers } from "./Routers/Routers";

const App = () => {
  return (
    <div>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routers />
    </div>
  );
};

export default App;
