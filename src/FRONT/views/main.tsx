import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.js";
import { CartProvider } from "./components/CartContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <CartProvider>
        <App />
      </CartProvider>
    </StrictMode>
  );
} else {
  throw new Error('Root element not found');
}
