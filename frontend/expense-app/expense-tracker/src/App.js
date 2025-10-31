import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.js";
import Dashboard from "./pages/Dashboard.js";
import Groups from "./pages/Groups.js";
import Expenses from "./pages/Expenses.js";
import Members from "./pages/Members.js";
import Register from "./pages/Register.js";

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/members" element={<Members />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}
