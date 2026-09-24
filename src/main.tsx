import "@fontsource/vazirmatn/300.css";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
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
