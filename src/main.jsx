import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Minesweeper from "./Minesweeper";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Minesweeper />
  </StrictMode>
);
