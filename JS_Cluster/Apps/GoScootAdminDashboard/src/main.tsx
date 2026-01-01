import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NotificationProvider } from "./context/NotificationContext";
import { BrowserRouter as Router} from "react-router-dom";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </Router>

  </StrictMode>
);
