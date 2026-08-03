import "./styles/variables.css";
import "./styles/global.css";
import "./styles/navbar.css";
import "./styles/banner.css";
import "./styles/category.css";
import "./styles/product.css";
import "./styles/footer.css";
import "./styles/responsive.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);