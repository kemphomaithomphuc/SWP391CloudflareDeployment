
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import '@maptiler/sdk/dist/maptiler-sdk.css';

  createRoot(document.getElementById("root")!).render(<App />);
  