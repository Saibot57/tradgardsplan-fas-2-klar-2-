import { jsx as _jsx } from "react/jsx-runtime";
import "./styles/tokens.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
const storedTheme = localStorage.getItem("pp-theme");
if (storedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
}
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
//# sourceMappingURL=main.js.map