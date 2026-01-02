import { createTheme } from "@mui/material/styles";

export const zcorTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#214318" },
    secondary: { main: "#a8f5c7" },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#0f1b10", secondary: "rgba(15,27,16,.72)" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    button: { textTransform: "none", fontWeight: 700 },
  },
});
