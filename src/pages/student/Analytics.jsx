import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

function Analytics() {
  const navigate = useNavigate();
  const [animated, setAnimated] = useState(false);
  const [data, setData] = useState(null);     
  const [loading, setLoading] = useState(true);
  const pieRef = useRef(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get("/student/analytics");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (data) setTimeout(() => setAnimated(true), 100);
  }, [data]);
  
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", 
      justifyContent: "center", background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%",
        border: "3px solid rgba(124,58,237,0.3)", borderTop: "3px solid #7c3aed",
        animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return null;

  const subjects = data.subjects.map((s, i) => ({
    name: s.name,
    short: s.code,
    present: s.present,
    total: s.total,
    color: ["#6366f1","#10b981","#f59e0b","#a78bfa","#f43f5e"][i % 5],
  }));

  const totalPresent = data.totalPresent;
  const totalClasses = data.totalClasses;
  const totalAbsent = data.totalAbsent;
  const overallPct = data.overallPct;

  const pieData = [
    { label: "Present", value: totalPresent, color: "#10b981" },
    { label: "Absent", value: totalAbsent, color: "#f43f5e" },
  ];
  const cx = 80, cy = 80, r = 62;
  let startAngle = -90;
  const pieSlices = pieData.map((d) => {
    const angle = (d.value / totalClasses) * 360;
    const start = startAngle;
    startAngle += angle;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle));
    const y2 = cy + r * Math.sin(toRad(start + angle));
    const large = angle > 180 ? 1 : 0;
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  const pctColor = (p) => p >= 75 ? "#10b981" : p >= 60 ? "#f59e0b" : "#f43f5e";

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "18px",
  };

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── NAVBAR ── */}
      <div style={{
        background: "rgba(10,8,28,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px", height: "56px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div
          onClick={() => navigate("/student/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        >
          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="logo"
            style={{ width: "28px", height: "28px", borderRadius: "8px", padding: "3px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", filter: "brightness(0) invert(1)" }}
          />
          <span style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>
            Smart<span style={{ color: "#a78bfa" }}>Attendance</span>
          </span>
        </div>

        <button
          onClick={() => navigate("/student/dashboard")}
          style={{
            padding: "6px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: "600",
            background: "transparent", color: "rgba(156,163,175,0.7)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(156,163,175,0.7)"}
        >
          ← Dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "4px 12px 4px 4px" }}>
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(JSON.parse(localStorage.getItem("user") || "{}").name || "S")}&backgroundColor=7c3aed&textColor=ffffff`} alt="avatar"
            style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }}
          />
          <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>{JSON.parse(localStorage.getItem("user") || "{}").name}</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: "hidden", padding: "14px 24px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "1000px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        <div>
          <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 3px" }}>
            /student/analytics
          </p>
          <h1 style={{ color: "white", fontSize: "20px", fontWeight: "700", margin: 0 }}>
            Attendance Analytics 📊
          </h1>
        </div>

        {/* ── TOP ROW: % card + Pie ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "12px", flex: "0 0 auto" }}>

          <div style={{
            ...card,
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.25)",
          }}>
            <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", margin: "0 0 2px" }}>Overall</p>
            <h2 style={{ color: "white", fontSize: "14px", fontWeight: "700", margin: "0 0 12px" }}>Attendance Percentage</h2>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
                <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                  <circle cx="45" cy="45" r="36" fill="none"
                    stroke={pctColor(parseFloat(overallPct))}
                    strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={animated ? `${2 * Math.PI * 36 * (1 - parseFloat(overallPct) / 100)}` : `${2 * Math.PI * 36}`}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "16px", fontWeight: "800", color: pctColor(parseFloat(overallPct)) }}>{overallPct}%</span>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "Total", val: totalClasses, color: "#a78bfa" },
                  { label: "Present", val: totalPresent, color: "#10b981" },
                  { label: "Absent", val: totalAbsent, color: "#f43f5e" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "rgba(156,163,175,0.6)", fontSize: "11px" }}>{label}</span>
                    <span style={{ color, fontSize: "13px", fontWeight: "700" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: "10px", padding: "7px 12px", borderRadius: "8px",
              background: parseFloat(overallPct) >= 75 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              border: `1px solid ${parseFloat(overallPct) >= 75 ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
            }}>
              <p style={{ color: parseFloat(overallPct) >= 75 ? "#10b981" : "#f59e0b", fontSize: "11px", margin: 0 }}>
                {parseFloat(overallPct) >= 75 ? "✅ Above 75% — you're on track!" : "⚠️ Below 75% — attend more classes"}
              </p>
            </div>
          </div>

          <div style={card}>
            <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 2px" }}>Distribution</p>
            <h2 style={{ color: "white", fontSize: "14px", fontWeight: "700", margin: "0 0 12px" }}>Present vs Absent</h2>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "center" }}>
              <svg width="160" height="160" viewBox="0 0 160 160" ref={pieRef}>
                {pieSlices.map((s, i) => (
                  <path key={i} d={s.path} fill={s.color}
                    style={{ opacity: 0.9, filter: `drop-shadow(0 0 6px ${s.color}60)`, cursor: "pointer", transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.target.style.opacity = 1}
                    onMouseLeave={e => e.target.style.opacity = 0.9}
                  />
                ))}
                <circle cx="80" cy="80" r="40" fill="#0d0b1e" />
                <text x="80" y="77" textAnchor="middle" fill="white" fontSize="14" fontWeight="800">{overallPct}%</text>
                <text x="80" y="90" textAnchor="middle" fill="rgba(156,163,175,0.6)" fontSize="8">attendance</text>
              </svg>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pieData.map((d) => (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: d.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0 }}>{d.label}</p>
                      <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>{d.value} · {((d.value / totalClasses) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}

                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                {subjects.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ color: "rgba(156,163,175,0.7)", fontSize: "11px" }}>{s.short}</span>
                    <span style={{ color: s.color, fontSize: "11px", fontWeight: "600", marginLeft: "auto" }}>
                      {Math.round((s.present / s.total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── BAR CHART ── */}
        <div style={{ ...card, gridColumn: "1 / -1", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 2px" }}>Subject Wise</p>
          <h2 style={{ color: "white", fontSize: "14px", fontWeight: "700", margin: "0 0 10px" }}>Attendance Bar Chart</h2>

          <div style={{ flex: 1, display: "flex", gap: "10px", minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: "28px" }}>
              {[100, 75, 50, 25, 0].map(v => (
                <span key={v} style={{ color: "rgba(156,163,175,0.4)", fontSize: "10px", lineHeight: 1 }}>{v}%</span>
              ))}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "12px", position: "relative", minHeight: 0 }}>
                {[0, 25, 50, 75, 100].map(v => (
                  <div key={v} style={{
                    position: "absolute", left: 0, right: 0, bottom: `${v}%`, height: "1px",
                    background: v === 75 ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.05)",
                  }} />
                ))}

                {subjects.map((s) => {
                  const pct = Math.round((s.present / s.total) * 100);
                  const absentPct = 100 - pct;
                  return (
                    <div key={s.name}
                      style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", zIndex: 1 }}
                      onMouseEnter={e => { const t = e.currentTarget.querySelector(".tt"); if (t) t.style.opacity = "1"; }}
                      onMouseLeave={e => { const t = e.currentTarget.querySelector(".tt"); if (t) t.style.opacity = "0"; }}
                    >
                      <div className="tt" style={{
                        position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                        background: "rgba(10,8,28,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px", padding: "6px 10px", opacity: 0,
                        transition: "opacity 0.2s", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
                      }}>
                        <p style={{ color: "white", fontSize: "11px", fontWeight: "600", margin: "0 0 1px" }}>{s.name}</p>
                        <p style={{ color: s.color, fontSize: "11px", margin: 0, fontWeight: "700" }}>{pct}% · {s.present}/{s.total}</p>
                      </div>

                      <div style={{ width: "100%", height: animated ? `${absentPct}%` : "0%", background: "rgba(244,63,94,0.3)", borderRadius: "5px 5px 0 0", transition: "height 1s ease", minHeight: absentPct > 0 ? "3px" : "0" }} />
                      <div style={{ width: "100%", height: animated ? `${pct}%` : "0%", background: `linear-gradient(180deg, ${s.color} 0%, ${s.color}99 100%)`, borderRadius: absentPct === 0 ? "5px" : "0 0 5px 5px", transition: "height 1s ease", boxShadow: `0 0 10px ${s.color}50` }} />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                {subjects.map((s) => (
                  <div key={s.name} style={{ flex: 1, textAlign: "center" }}>
                    <p style={{ color: s.color, fontSize: "11px", fontWeight: "700", margin: "0 0 1px" }}>{s.short}</p>
                    <p style={{ color: "rgba(156,163,175,0.4)", fontSize: "10px", margin: 0 }}>{Math.round((s.present / s.total) * 100)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {[{ color: "#6366f1", label: "Present" }, { color: "rgba(244,63,94,0.5)", label: "Absent" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: color }} />
                <span style={{ color: "rgba(156,163,175,0.6)", fontSize: "11px" }}>{label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "20px", height: "2px", background: "rgba(245,158,11,0.5)" }} />
              <span style={{ color: "rgba(156,163,175,0.6)", fontSize: "11px" }}>75% threshold</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Analytics;