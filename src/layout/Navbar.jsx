import { useState } from "react";

export default function Navbar() {
  const [showHowTo, setShowHowTo] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      {/* ───── NAVBAR ───── */}
      <div
        className="navbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 32px",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
          VyzEraX
        </div>

        <div style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
          <span style={navLink} onClick={() => setShowHowTo(true)}>
            How to use
          </span>
          <span style={navLink} onClick={() => setShowContact(true)}>
            Contact
          </span>
        </div>
      </div>

      {/* ───── HOW TO USE MODAL ───── */}
      {showHowTo && (
        <div style={overlay} onClick={() => setShowHowTo(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "12px" }}>How to use VyzEraX</h3>

            <ol style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <li>Upload a CSV or Excel file</li>
              <li>Explore statistics and dashboards</li>
              <li>Read AI-generated insights</li>
              <li>Export reports as PDF or image</li>
            </ol>

            <button style={closeBtn} onClick={() => setShowHowTo(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ───── CONTACT SIDEBAR ───── */}
      {showContact && (
        <div style={overlay} onClick={() => setShowContact(false)}>
          <div style={sidebar} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px" }}>Contact</h3>

            {/* Name (icon only here) */}
            <p style={item}>
              👤{" "}
              <a
                href="https://anjanaajportfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={link}
              >
                Anjana R
              </a>
            </p>

            {/* Email */}
            <p style={item}>
              <a href="mailto:anjanar266@gmail.com" style={link}>
                anjanar266@gmail.com
              </a>
            </p>

            {/* LinkedIn */}
            <p style={item}>
              <a
                href="https://www.linkedin.com/in/anjana-ramachandran-achariya/"
                target="_blank"
                rel="noopener noreferrer"
                style={link}
              >
                LinkedIn
              </a>
            </p>

            {/* GitHub */}
            <p style={item}>
              <a
                href="https://github.com/Anjana-achariya"
                target="_blank"
                rel="noopener noreferrer"
                style={link}
              >
                GitHub
              </a>
            </p>

            {/* Hugging Face */}
            <p style={item}>
              <a
                href="https://huggingface.co/anjanaR"
                target="_blank"
                rel="noopener noreferrer"
                style={link}
              >
                Hugging Face
              </a>
            </p>

            <button style={closeBtn} onClick={() => setShowContact(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────── Styles ───────── */

const navLink = {
  cursor: "pointer",
  opacity: 0.85,
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 9999,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modal = {
  background: "#ffffff",
  borderRadius: "14px",
  padding: "24px 28px",
  width: "420px",
  boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
};

const sidebar = {
  position: "absolute",
  right: 0,
  top: 0,
  width: "320px",
  height: "100%",
  background: "#ffffff",
  padding: "24px",
  boxShadow: "-8px 0 24px rgba(0,0,0,0.3)",
};

const closeBtn = {
  marginTop: "20px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#ff8fab",
  color: "#fff",
  cursor: "pointer",
};

/* ✅ FIXED: missing styles */
const item = {
  fontSize: "14px",
  marginBottom: "14px",
};

const link = {
  color: "#ff8fab",
  fontWeight: 600,
  textDecoration: "none",
};
