import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────

// Ye token se user info nikalte hai (JWT ka middle part base64 hota hai)
function getUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { id, name, email, role, ... }
  } catch {
    return null;
  }
}

// Greeting time ke hisaab se
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// Subject ke liye icon
const SUBJECT_ICONS = {
  dbms: "🗄️", database: "🗄️",
  os: "💻", operating: "💻",
  data: "📚", dsa: "📚",
  network: "🌐", cn: "🌐",
  math: "📐", default: "📖",
};
function getIcon(subjectName = "") {
  const lower = subjectName.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return SUBJECT_ICONS.default;
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,8,28,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px", padding: "10px 14px",
    }}>
      <p style={{ color: "white", fontSize: "13px", fontWeight: "700", margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: "#10b981", fontSize: "12px", margin: "0 0 2px" }}>Present: {payload[0]?.value}</p>
      <p style={{ color: "#f43f5e", fontSize: "12px", margin: 0 }}>Absent: {payload[1]?.value}</p>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

function FacultyDashboard() {
  const navigate = useNavigate();

  // ── 1. User name from JWT token ──────────────────────────────────────────
  const tokenUser = getUserFromToken();
  const facultyName = tokenUser?.name || "Faculty";           // "Dr. Sharma" → real name
  const initials    = facultyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // ── 2. Dashboard data state ──────────────────────────────────────────────
  const [dashData, setDashData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) { navigate("/login"); return; }

  API.get("/faculty/dashboard")
    .then(res => { setDashData(res.data); setLoading(false); })
    .catch(err => { setError(err.response?.data?.message || err.message); setLoading(false); });
}, [navigate]);


  // ── 3. Derived values (fallback to zeros while loading) ──────────────────
  const { stats = {}, weeklyData = [], recentSessions = [] } = dashData || {};

  const statCards = [
    {
      label: "Total Students", value: loading ? "—" : String(stats.totalStudents ?? 0),
      img: "https://cdn-icons-png.flaticon.com/512/3135/3135755.png",
      color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)", glow: "rgba(99,102,241,0.3)",
    },
    {
      label: "Classes Conducted", value: loading ? "—" : String(stats.classesConducted ?? 0),
      img: "https://cdn-icons-png.flaticon.com/512/2232/2232688.png",
      color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", glow: "rgba(167,139,250,0.3)",
    },
    {
      label: "Attendance Today", value: loading ? "—" : String(stats.attendanceToday ?? 0),
      img: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
      color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.3)",
    },
    {
      label: "Avg Attendance %", value: loading ? "—" : `${stats.avgAttendancePct ?? 0}%`,
      img: "https://cdn-icons-png.flaticon.com/512/2920/2920322.png",
      color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.3)",
    },
  ];

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px", padding: "20px",
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "🏠", path: "/faculty/dashboard" },
    { key: "take",      label: "Take Attendance", icon: "📸", path: "/faculty/take-attendance" },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── NAVBAR ── */}
      <div style={{
        background: "rgba(10,8,28,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px", height: "72px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div onClick={() => navigate("/faculty/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 }}>
          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="logo"
            style={{ width: "34px", height: "34px", borderRadius: "9px", padding: "5px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", filter: "brightness(0) invert(1)" }} />
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>
            Smart<span style={{ color: "#a78bfa" }}>Attendance</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {navItems.map(({ key, label, icon, path }) => {
            const isActive = path === "/faculty/dashboard";
            return (
              <button key={key} onClick={() => navigate(path)} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 18px", borderRadius: "12px", border: "none",
                cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s",
                background: isActive ? "rgba(124,58,237,0.28)" : "transparent",
                color: isActive ? "#e9d5ff" : "rgba(209,213,219,0.85)",
                boxShadow: isActive ? "0 0 0 1px rgba(124,58,237,0.4)" : "none",
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "16px" }}>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Avatar: initials from real name, seed bhi real name ── */}
        <div onClick={() => navigate("/faculty/change-password")} style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50px", padding: "6px 16px 6px 6px",
          cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(facultyName)}&backgroundColor=7c3aed&textColor=ffffff`}
            alt="avatar"
            style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }}
          />
          <div>
            <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0, lineHeight: 1.2 }}>{facultyName}</p>
            <p style={{ color: "rgba(167,139,250,0.7)", fontSize: "10px", margin: 0 }}>⚙️ Settings</p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "12px", padding: "14px 18px", color: "#fda4af", fontSize: "14px" }}>
            ⚠️ Dashboard data load nahi hua: {error}. Backend chal raha hai?
          </div>
        )}

        {/* ── HEADER BANNER ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 100%)",
          border: "1px solid rgba(124,58,237,0.2)", borderRadius: "20px",
          padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{ position: "absolute", right: "130px", top: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.2), transparent)", pointerEvents: "none" }} />
          <div>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#a78bfa", margin: "0 0 5px" }}>Faculty Dashboard</p>
            {/* ── Real name + dynamic greeting ── */}
            <h1 style={{ color: "white", fontSize: "24px", fontWeight: "700", margin: "0 0 5px" }}>
              {getGreeting()}, {facultyName} 👋
            </h1>
            <p style={{ color: "rgba(156,163,175,0.7)", fontSize: "14px", margin: 0 }}>
              Manage attendance and monitor student activity.
            </p>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="faculty"
            style={{ width: "100px", height: "100px", flexShrink: 0, opacity: 0.9, filter: "drop-shadow(0 0 18px rgba(124,58,237,0.5))" }} />
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
          {statCards.map(({ label, value, img, color, bg, border, glow }) => (
            <div key={label} style={{ background: bg, border: "1px solid " + border, borderRadius: "18px", padding: "18px", position: "relative", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px " + glow; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <img src={img} alt={label} style={{ position: "absolute", top: "10px", right: "10px", width: "32px", height: "32px", opacity: 0.12 }} />
              <img src={img} alt={label} style={{ width: "28px", height: "28px", marginBottom: "10px", filter: "drop-shadow(0 0 5px " + color + ")" }} />
              <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(156,163,175,0.65)", margin: "0 0 4px" }}>{label}</p>
              {/* Loading skeleton */}
              {loading
                ? <div style={{ height: "34px", width: "60px", borderRadius: "8px", background: "rgba(255,255,255,0.07)", animation: "pulse 1.5s infinite" }} />
                : <p style={{ fontSize: "28px", fontWeight: "800", color, margin: 0, lineHeight: 1 }}>{value}</p>
              }
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={card}>
          <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 4px" }}>Quick Actions</p>
          <h2 style={{ color: "white", fontSize: "16px", fontWeight: "700", margin: "0 0 16px" }}>What would you like to do?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <button onClick={() => navigate("/faculty/take-attendance")} style={{
              padding: "20px", borderRadius: "16px", border: "none",
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              color: "white", fontSize: "15px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "14px",
              boxShadow: "0 6px 24px rgba(124,58,237,0.4)", transition: "all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: "30px" }}>📸</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Take Attendance</p>
                <p style={{ margin: 0, fontSize: "12px", opacity: 0.85, fontWeight: "400" }}>Start a new session with OTP & location check</p>
              </div>
            </button>
            <button onClick={() => navigate("/faculty/change-password")} style={{
              padding: "20px", borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "#e5e7eb", fontSize: "15px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "14px", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.1)"; e.currentTarget.style.border = "1px solid rgba(124,58,237,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
            >
              <span style={{ fontSize: "30px" }}>⚙️</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Settings</p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(156,163,175,0.6)", fontWeight: "400" }}>Update password & account preferences</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "16px" }}>

          {/* Recent Sessions */}
          <div style={card}>
            <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 4px" }}>Today</p>
            <h2 style={{ color: "white", fontSize: "16px", fontWeight: "700", margin: "0 0 16px" }}>Recent Sessions</h2>

            {loading ? (
              // Skeleton rows
              [1,2,3,4].map(i => (
                <div key={i} style={{ height: "58px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", marginBottom: "10px", animation: "pulse 1.5s infinite" }} />
              ))
            ) : recentSessions.length === 0 ? (
              <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Aaj koi session nahi hua</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recentSessions.map(({ subject, code, time, present, total }) => {
                  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                  const barColor = pct >= 75 ? "#10b981" : "#f59e0b";
                  return (
                    <div key={subject + time} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 14px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                        {getIcon(subject)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subject}</p>
                          <span style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", flexShrink: 0, marginLeft: "8px" }}>{time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.07)" }}>
                            <div style={{ height: "100%", width: pct + "%", borderRadius: "99px", background: barColor }} />
                          </div>
                          <span style={{ color: barColor, fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>{present}/{total}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Graph */}
          <div style={card}>
            <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 4px" }}>This Week</p>
            <h2 style={{ color: "white", fontSize: "16px", fontWeight: "700", margin: "0 0 16px" }}>Weekly Attendance Graph</h2>

            {loading ? (
              <div style={{ height: "200px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
            ) : weeklyData.length === 0 ? (
              <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "13px", textAlign: "center", padding: "60px 0" }}>Is week ka koi data nahi</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barGap={4} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "rgba(156,163,175,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(156,163,175,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="present" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent"  fill="rgba(244,63,94,0.5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              {[{ color: "#7c3aed", label: "Present" }, { color: "rgba(244,63,94,0.7)", label: "Absent" }].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color }} />
                  <span style={{ color: "rgba(156,163,175,0.6)", fontSize: "12px" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Pulse animation for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default FacultyDashboard;
