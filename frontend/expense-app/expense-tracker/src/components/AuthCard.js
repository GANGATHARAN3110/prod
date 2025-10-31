import React from "react";
import "./AuthCard.css"; // Add custom CSS for styling

export default function AuthCard({ title, children, message }) {
  return (
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="auth-card p-4 shadow-sm rounded">
        <h2 className="mb-4 text-center">{title}</h2>
        {message && <div className="alert alert-info">{message}</div>}
        {children}
      </div>
    </div>
  );
}
