import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/*
          Later you can add more routes here, e.g.
          <Route path="/booking" element={<BookingPage />} />
        */}
      </Routes>
    </BrowserRouter>
  );
}
