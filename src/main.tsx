import { App } from "@/App.tsx";
import "@/index.css";
import { registerServiceWorker } from "@/lib/registerSW.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.querySelector("#app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
