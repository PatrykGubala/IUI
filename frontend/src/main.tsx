import { StrictMode } from "react";
import { Provider } from "@/components/ui/provider";
import { createRoot } from "react-dom/client";
import App from "./app.tsx";
import theme from "./components/ui/theme.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider theme={theme}>
      <App />
    </Provider>
  </StrictMode>
);
