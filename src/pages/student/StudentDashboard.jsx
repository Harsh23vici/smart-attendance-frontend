import { useState , useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
useEffect(() => {
  const fetchDashboard = async () => {
  try {
    const res = await API.get("/student/dashboard");
    setDashboardData(res.data);
    
    // Backend se aaya fresh naam localStorage mein update karo:
    if (res.data.user?.name) {
      localStorage.setItem("name", res.data.user.name);
    }
  } catch (err) {
    console.log(err);
  }
};

  fetchDashboard();
}, []);
if (!dashboardData) return null;
  const stats = [
    {
      label: "Total Classes", value: dashboardData.stats.totalClasses,
      color: "#6366f1", glow: "rgba(99,102,241,0.3)",
      bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)",
      img: "https://cdn-icons-png.flaticon.com/512/2232/2232688.png",
    },
    {
      label: "Present", value: dashboardData.stats.present,
      color: "#10b981", glow: "rgba(16,185,129,0.3)",
      bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)",
      img: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    },
    {
      label: "Absent",value: dashboardData.stats.absent,
      color: "#f43f5e", glow: "rgba(244,63,94,0.3)",
      bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)",
      img: "https://cdn-icons-png.flaticon.com/512/753/753345.png",
    },
    {
      label: "Attendance %", value: `${dashboardData.stats.attendancePct}%`,
      color: "#f59e0b", glow: "rgba(245,158,11,0.3)",
      bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)",
      img: "https://cdn-icons-png.flaticon.com/512/2920/2920322.png",
    },
  ];

  const subjects = dashboardData.subjects;

  const recentAttendance = dashboardData.recentAttendance;

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
  };

  const pill = (status) => ({
    fontSize: "11px", fontWeight: "600",
    padding: "4px 12px", borderRadius: "99px",
    background: status === "present" ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
    color: status === "present" ? "#10b981" : "#f43f5e",
    border: status === "present" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
    textTransform: "capitalize",
  });

  // Main navigation — these are REAL pages
  const navItems = [
    { key: "overview", label: "Overview", icon: "🏠", type: "tab" },
    { key: "mark", label: "Mark Attendance", icon: "✅", type: "route", path: "/student/mark-attendance" },
    { key: "analytics", label: "Analytics", icon: "📊", type: "route", path: "/student/analytics" },
    { key: "face", label: "Face Scan", icon: "🤳", type: "route", path: "/student/face-recognition" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ── NAVBAR ── */}
      <div style={{
        background: "rgba(10,8,28,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px", height: "72px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate("/student/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 }}
        >
          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="logo"
            style={{
              width: "34px", height: "34px", borderRadius: "9px", padding: "5px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              filter: "brightness(0) invert(1)",
            }}
          />
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>
            Smart<span style={{ color: "#a78bfa" }}>Attendance</span>
          </span>
        </div>

        {/* Main Nav — big clear buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {navItems.map(({ key, label, icon, type, path }) => {
            const isActive = type === "tab" && activeTab === key;
            return (
              <button
                key={key}
                onClick={() => type === "tab" ? setActiveTab(key) : navigate(path)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 18px", borderRadius: "12px", border: "none",
                  cursor: "pointer", fontSize: "14px", fontWeight: "600",
                  transition: "all 0.2s",
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

        {/* Settings / Avatar */}
        <div
          onClick={() => navigate("/student/change-password")}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50px", padding: "6px 16px 6px 6px",
            cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(JSON.parse(localStorage.getItem("user") || "{}").name || "S")}&backgroundColor=7c3aed&textColor=ffffff`}
            alt="avatar"
            style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }}
          />
          <div>
            <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0, lineHeight: 1.2 }}>{JSON.parse(localStorage.getItem("user") || "{}").name}</p>

            <p style={{ color: "rgba(167,139,250,0.7)", fontSize: "10px", margin: 0 }}>⚙️ Settings</p>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Welcome Banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(79,70,229,0.15) 100%)",
          border: "1px solid rgba(124,58,237,0.2)", borderRadius: "20px",
          padding: "24px 28px", marginBottom: "28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            position: "absolute", right: "120px", top: "-40px",
            width: "180px", height: "180px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent)",
            pointerEvents: "none",
          }}/>
          <div>
            <p style={{
              fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#a78bfa", marginBottom: "6px",
            }}>Student Dashboard</p>
            <h1 style={{ color: "white", fontSize: "26px", fontWeight: "700", margin: "0 0 6px" }}>
            Welcome back, {localStorage.getItem("name")} 👋🏻
            </h1>
            <p style={{ color: "rgba(156,163,175,0.7)", fontSize: "14px", margin: 0 }}>
              Here's your attendance summary for this semester
            </p>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" alt="student"
            style={{
              width: "110px", height: "110px", opacity: 0.9, flexShrink: 0,
              filter: "drop-shadow(0 0 20px rgba(124,58,237,0.5))",
            }}
          />
        </div>

        {/* Sub-tabs for overview content */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
          {["overview", "subjects", "history"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "7px 18px", borderRadius: "8px", border: "none",
              cursor: "pointer", fontSize: "13px", fontWeight: "500",
              textTransform: "capitalize", transition: "all 0.2s",
              background: activeTab === tab ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
              color: activeTab === tab ? "#c4b5fd" : "rgba(156,163,175,0.7)",
              border: activeTab === tab ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
              {stats.map(({ label, value, color, glow, bg, border, img }) => (
                <div key={label}
                  style={{ background: bg, border: `1px solid ${border}`, borderRadius: "18px", padding: "20px", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${glow}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <img src={img} alt={label} style={{ position: "absolute", top: "12px", right: "12px", width: "36px", height: "36px", opacity: 0.12 }} />
                  <img src={img} alt={label} style={{ width: "32px", height: "32px", marginBottom: "12px", filter: `drop-shadow(0 0 6px ${color})`, opacity: 0.9 }} />
                  <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(156,163,175,0.7)", margin: "0 0 6px" }}>{label}</p>
                  <p style={{ fontSize: "32px", fontWeight: "800", color, margin: 0, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={card}>
                <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "4px" }}>Subject Wise</p>
                <h2 style={{ color: "white", fontSize: "17px", fontWeight: "700", marginBottom: "20px" }}>Attendance Breakdown</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {subjects.map(({ name, present, total }) => {
                    const pct = Math.round((present / total) * 100);
                    const barColor = pct >= 75 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f43f5e";
                    return (
                      <div key={name}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>{name}</span>
                          <span style={{ color: barColor, fontSize: "13px", fontWeight: "700" }}>{pct}%</span>
                        </div>
                        <div style={{ height: "6px", borderRadius: "99px", background: "rgba(255,255,255,0.07)" }}>
                          <div style={{ height: "100%", borderRadius: "99px", width: `${pct}%`, background: barColor }} />
                        </div>
                        <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", marginTop: "4px" }}>{present} / {total} classes</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={card}>
                <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "4px" }}>Recent Activity</p>
                <h2 style={{ color: "white", fontSize: "17px", fontWeight: "700", marginBottom: "20px" }}>Latest Records</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {recentAttendance.slice(0, 6).map(({ subject, date, status }, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={status === "present" ? "https://cdn-icons-png.flaticon.com/512/190/190411.png" : "https://cdn-icons-png.flaticon.com/512/753/753345.png"}
                          alt={status} style={{ width: "26px", height: "26px", flexShrink: 0 }}
                        />
                        <div>
                          <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500", margin: 0 }}>{subject}</p>
                          <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>{date}</p>
                        </div>
                      </div>
                      <span style={pill(status)}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ SUBJECTS TAB ══ */}
        {activeTab === "subjects" && (
          <div>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "6px" }}>All Subjects</p>
            <h2 style={{ color: "white", fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>Subject-wise Attendance</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {subjects.map(({ name, present, total, code }) => {
                const pct = Math.round((present / total) * 100);
                const barColor = pct >= 75 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f43f5e";
                const absent = total - present;
                return (
                  <div key={name} style={{ ...card, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `rgba(${barColor === "#10b981" ? "16,185,129" : barColor === "#f59e0b" ? "245,158,11" : "244,63,94"},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📘</div>
                        <div>
                          <p style={{ color: "white", fontSize: "15px", fontWeight: "600", margin: 0 }}>{name}</p>
                          <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>{code}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ color: "#10b981", fontWeight: "700", fontSize: "15px", margin: 0 }}>{present}</p>
                          <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>Present</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ color: "#f43f5e", fontWeight: "700", fontSize: "15px", margin: 0 }}>{absent}</p>
                          <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>Absent</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ color: barColor, fontWeight: "800", fontSize: "20px", margin: 0 }}>{pct}%</p>
                          <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>Overall</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ height: "8px", borderRadius: "99px", background: "rgba(255,255,255,0.07)" }}>
                      <div style={{ height: "100%", borderRadius: "99px", width: `${pct}%`, background: barColor, transition: "width 0.6s ease" }} />
                    </div>
                    {pct < 75 && (
                      <p style={{ color: "#f59e0b", fontSize: "12px", marginTop: "8px" }}>
                        ⚠️ Need {Math.ceil((0.75 * total - present) / 0.25)} more classes to reach 75%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === "history" && (
          <div>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "6px" }}>Attendance Log</p>
            <h2 style={{ color: "white", fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>Full History</h2>

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total", val: recentAttendance.length, color: "#6366f1" },
                { label: "Present", val: recentAttendance.filter(r => r.status === "present").length, color: "#10b981" },
                { label: "Absent", val: recentAttendance.filter(r => r.status === "absent").length, color: "#f43f5e" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ flex: 1, padding: "14px 18px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <p style={{ color, fontSize: "22px", fontWeight: "800", margin: 0 }}>{val}</p>
                  <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "12px", margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: "12px", padding: "0 8px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "8px" }}>
                {["Subject", "Date", "Day", "Status"].map(h => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(156,163,175,0.5)" }}>{h}</span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {recentAttendance.map(({ subject, date, day, status }, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: "12px",
                    padding: "12px 8px", borderRadius: "10px",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={status === "present" ? "https://cdn-icons-png.flaticon.com/512/190/190411.png" : "https://cdn-icons-png.flaticon.com/512/753/753345.png"}
                        alt={status} style={{ width: "22px", height: "22px" }}
                      />
                      <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>{subject}</span>
                    </div>
                    <span style={{ color: "rgba(156,163,175,0.7)", fontSize: "13px" }}>{date}</span>
                    <span style={{ color: "rgba(156,163,175,0.5)", fontSize: "13px" }}>{day}</span>
                    <span style={pill(status)}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;