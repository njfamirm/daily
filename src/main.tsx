import { App } from "@/App.tsx";
import "@/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.querySelector("#app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
