import { useState } from "react";
import { useNavigate } from "react-router-dom";

function FacultyChangePassword() {
  const navigate = useNavigate();
  const [fields, setFields] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const toggle = (key) => setShow((p) => ({ ...p, [key]: !p[key] }));
  const update = (key, val) => {
    setFields((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const strength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    const map = [
      { label: "Too weak", color: "#f43f5e" },
      { label: "Weak", color: "#f43f5e" },
      { label: "Fair", color: "#f59e0b" },
      { label: "Good", color: "#6366f1" },
      { label: "Strong", color: "#10b981" },
    ];
    return { score, ...map[score] };
  };

  const str = strength(fields.newPass);

  const validate = () => {
    const e = {};
    if (!fields.current) e.current = "Enter your current password";
    if (!fields.newPass) e.newPass = "Enter a new password";
    else if (fields.newPass.length < 8) e.newPass = "Minimum 8 characters required";
    else if (fields.newPass === fields.current) e.newPass = "New password must differ from current";
    if (!fields.confirm) e.confirm = "Please confirm your password";
    else if (fields.confirm !== fields.newPass) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1800);
  };

  const EyeIcon = ({ visible }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  const inputRow = (key, label, placeholder) => (
    <div>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: "600",
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: errors[key] ? "#f43f5e" : "#7c3aed", marginBottom: "8px",
      }}>{label}</label>

      <div style={{ position: "relative" }}>
        <input
          type={show[key] ? "text" : "password"}
          placeholder={placeholder}
          value={fields[key]}
          onChange={(e) => update(key, e.target.value)}
          style={{
            width: "100%", height: "52px", padding: "0 48px 0 20px",
            borderRadius: "14px", fontSize: "15px",
            background: "rgba(255,255,255,0.05)",
            border: `1.5px solid ${errors[key] ? "rgba(244,63,94,0.6)" : "rgba(255,255,255,0.1)"}`,
            color: "white", outline: "none", boxSizing: "border-box",
            transition: "border 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.border = `1.5px solid ${errors[key] ? "rgba(244,63,94,0.8)" : "rgba(124,58,237,0.7)"}`;
            e.target.style.boxShadow = `0 0 0 3px ${errors[key] ? "rgba(244,63,94,0.12)" : "rgba(124,58,237,0.15)"}`;
          }}
          onBlur={(e) => {
            e.target.style.border = `1.5px solid ${errors[key] ? "rgba(244,63,94,0.6)" : "rgba(255,255,255,0.1)"}`;
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          onClick={() => toggle(key)}
          style={{
            position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: show[key] ? "#a78bfa" : "rgba(156,163,175,0.5)",
            padding: "4px", display: "flex", alignItems: "center",
            transition: "color 0.2s",
          }}
        >
          <EyeIcon visible={show[key]} />
        </button>
      </div>

      {errors[key] && (
        <p style={{ color: "#f43f5e", fontSize: "12px", marginTop: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
          ⚠️ {errors[key]}
        </p>
      )}
    </div>
  );

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
        fontFamily: "system-ui, sans-serif", padding: "24px",
      }}>
        <div style={{
          textAlign: "center", maxWidth: "360px", width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "24px", padding: "48px 36px",
          boxShadow: "0 0 40px rgba(16,185,129,0.12)",
        }}>
          <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="success"
            style={{ width: "72px", height: "72px", marginBottom: "20px", filter: "drop-shadow(0 0 16px rgba(16,185,129,0.6))" }}
          />
          <h2 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: "0 0 8px" }}>
            Password Changed!
          </h2>
          <p style={{ color: "rgba(156,163,175,0.7)", fontSize: "14px", margin: "0 0 28px" }}>
            Your password has been updated successfully.
          </p>
          <button
            onClick={() => navigate("/faculty/dashboard")}
            style={{
              width: "100%", height: "48px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── NAVBAR ── */}
      <div style={{
        background: "rgba(10,8,28,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div
          onClick={() => navigate("/faculty/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        >
          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="logo"
            style={{ width: "32px", height: "32px", borderRadius: "8px", padding: "4px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", filter: "brightness(0) invert(1)" }}
          />
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>
            Smart<span style={{ color: "#a78bfa" }}>Attendance</span>
          </span>
        </div>

        <button
          onClick={() => navigate("/faculty/dashboard")}
          style={{
            padding: "7px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: "600",
            background: "transparent", color: "rgba(156,163,175,0.7)",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(156,163,175,0.7)"}
        >
          ← Dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "5px 14px 5px 5px" }}>
          <img src="https://api.dicebear.com/7.x/initials/svg?seed=Faculty&backgroundColor=7c3aed&textColor=ffffff" alt="avatar"
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }}
          />
          <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>Faculty</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "40px 24px" }}>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "6px" }}>
            Account Settings
          </p>
          <h1 style={{ color: "white", fontSize: "26px", fontWeight: "700", margin: "0 0 6px" }}>
            Change Password 🔐
          </h1>
          <p style={{ color: "rgba(156,163,175,0.7)", fontSize: "14px", margin: 0 }}>
            Keep your account secure with a strong password
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px", padding: "32px",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>

          <div style={{
            display: "flex", alignItems: "flex-start", gap: "12px",
            padding: "12px 16px", borderRadius: "12px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}>
            <img src="https://cdn-icons-png.flaticon.com/512/2092/2092663.png" alt="tip"
              style={{ width: "20px", height: "20px", opacity: 0.8, flexShrink: 0, marginTop: "1px" }}
            />
            <p style={{ color: "rgba(196,181,253,0.8)", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
              Use 8+ characters with uppercase, numbers & symbols for a strong password.
            </p>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {inputRow("current", "Current Password", "Enter current password")}

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {inputRow("newPass", "New Password", "Enter new password")}

          {fields.newPass.length > 0 && (
            <div style={{ marginTop: "-10px" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: "4px", borderRadius: "99px",
                    background: i <= str.score ? str.color : "rgba(255,255,255,0.08)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              <p style={{ color: str.color, fontSize: "11px", margin: 0, fontWeight: "600" }}>
                {str.label}
              </p>
            </div>
          )}

          {inputRow("confirm", "Confirm Password", "Re-enter new password")}

          {fields.confirm.length > 0 && fields.newPass.length > 0 && (
            <div style={{ marginTop: "-10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: fields.confirm === fields.newPass ? "#10b981" : "#f43f5e",
              }} />
              <span style={{ fontSize: "12px", color: fields.confirm === fields.newPass ? "#10b981" : "#f43f5e" }}>
                {fields.confirm === fields.newPass ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          <button
            onClick={handleSubmit}
            style={{
              width: "100%", height: "52px", borderRadius: "14px", border: "none",
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              color: "white", fontSize: "15px", fontWeight: "700",
              cursor: "pointer", boxShadow: "0 8px 28px rgba(124,58,237,0.4)",
              transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {submitting ? (
              <>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Updating Password...
              </>
            ) : "🔐 Change Password"}
          </button>

        </div>
      </div>
    </div>
  );
}

export default FacultyChangePassword;