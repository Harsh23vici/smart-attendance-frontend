// src/pages/TakeAttendance.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import io from "socket.io-client";

function TakeAttendance() {
  const navigate = useNavigate();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [subjects, setSubjects] = useState([]);

  const [locationStatus, setLocationStatus] = useState("idle");
  const [location, setLocation] = useState(null);

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionCode, setSessionCode] = useState("");
  const [otp, setOtp] = useState("----");
  const [countdown, setCountdown] = useState(275);
  const [presentStudents, setPresentStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("name");

  const [faceToggle, setFaceToggle] = useState(true);
  const [antiSpoof, setAntiSpoof] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertLog, setAlertLog] = useState([]);
  const [faceVerifiedCount, setFaceVerifiedCount] = useState(0);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Socket setup ──
  useEffect(() => {
    const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace("/api", "");
socketRef.current = io(SOCKET_URL);

    socketRef.current.on("student:joined", (student) => {
      setPresentStudents((prev) => {
        if (prev.some((s) => s.roll === student.roll)) return prev;
        const timeStr = new Date(student.time).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", hour12: false,
        });
        return [...prev, { ...student, time: timeStr }];
      });
      if (student.method === "face") setFaceVerifiedCount((c) => c + 1);
    });

    socketRef.current.on("face:alert", (a) => {
      const time = new Date(a.time).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
      setShowAlert(true);
      setAlertLog((prev) => [{ time }, ...prev].slice(0, 5));
      setTimeout(() => setShowAlert(false), 5000);
    });

    return () => socketRef.current?.disconnect();
  }, []);

 useEffect(() => {
  API.get("/attendance/faculty/subjects")
    .then((res) => {
      // Backend se array directly ya {subjects: [...]} dono handle karo
      const data = Array.isArray(res.data) ? res.data : res.data.subjects || [];
      setSubjects(data);
      if (data.length > 0) setSelectedSubject(data[0]._id);
    })
    .catch((err) => console.error("Subjects fetch failed:", err));
}, []);

  // ── Countdown timer ──
  useEffect(() => {
    if (!sessionActive) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionActive]);

  // ── Face verified count sync ──
  useEffect(() => {
    if (faceToggle) setFaceVerifiedCount(presentStudents.filter((s) => s.method === "face").length);
  }, [presentStudents, faceToggle]);

  const requestLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  };

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");
  const canStart = selectedSubject && roomNo.trim() && locationStatus === "granted";

  const startSession = async () => {
    if (!canStart) return;
    setStarting(true);
    setStartError("");
    try {
      const res = await API.post("/attendance/session/create", {
        subjectId: selectedSubject,
        room: roomNo.trim(),
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng),
        faceVerificationEnabled: faceToggle,
        antiSpoofEnabled: antiSpoof,
        alertsEnabled,
      });
      const sess = res.data.session;
      setSessionId(sess._id);
      setSessionCode(sess.sessionCode);
      setOtp(String(sess.otp));
      socketRef.current.emit("session:join", sess._id);
      setSessionActive(true);
      setPresentStudents([]);
      setCountdown(275);
      setFaceVerifiedCount(0);
      setAlertLog([]);
    } catch (err) {
      setStartError(err.response?.data?.message || "Session start failed");
    } finally {
      setStarting(false);
    }
  };

  const endSession = async () => {
    try {
      if (sessionId) await API.patch(`/attendance/session/${sessionId}/end`);
    } catch (err) {
      console.error("End session error:", err);
    }
    socketRef.current?.emit("session:leave", sessionId);
    setSessionActive(false);
    setSessionId(null);
    setSessionCode("");
    setOtp("----");
  };

  const handleExportCsv = async () => {
    if (!sessionId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/attendance/session/${sessionId}/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${sessionCode}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
    }
  };

  const handleToggleUpdate = async (field, value) => {
    try {
      if (sessionId) {
        await API.patch("/attendance/session/settings", { sessionId, [field]: value });
      }
    } catch (err) {
      console.error("Settings update failed:", err);
    }
  };

  const filtered = presentStudents.filter((s) => {
    if (!search) return true;
    return searchBy === "name"
      ? s.name.toLowerCase().includes(search.toLowerCase())
      : s.roll.toLowerCase().includes(search.toLowerCase());
  });

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px", padding: "20px",
  };
  const labelStyle = {
    fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#7c3aed", margin: "0 0 4px",
  };
  const inputStyle = {
    width: "100%", height: "44px", padding: "0 14px", borderRadius: "12px",
    fontSize: "14px", background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.1)", color: "white", outline: "none",
    transition: "border 0.2s, box-shadow 0.2s", boxSizing: "border-box",
  };

  const Toggle = ({ on, onClick, color }) => (
    <button onClick={onClick} style={{
      width: "44px", height: "24px", borderRadius: "99px", border: "none", cursor: "pointer",
      background: on ? `linear-gradient(135deg, ${color}, ${color}cc)` : "rgba(255,255,255,0.1)",
      position: "relative", transition: "background 0.3s", flexShrink: 0,
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", background: "white",
        position: "absolute", top: "3px", left: on ? "23px" : "3px",
        transition: "left 0.3s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }} />
    </button>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* NAVBAR */}
      <div style={{
        background: "rgba(10,8,28,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div onClick={() => navigate("/faculty/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="logo"
            style={{ width: "32px", height: "32px", borderRadius: "8px", padding: "4px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", filter: "brightness(0) invert(1)" }} />
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>
            Smart<span style={{ color: "#a78bfa" }}>Attendance</span>
          </span>
        </div>
        <button onClick={() => navigate("/faculty/dashboard")} style={{
          padding: "7px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
          fontSize: "13px", fontWeight: "600", background: "transparent", color: "rgba(156,163,175,0.7)",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(156,163,175,0.7)"}>
          ← Dashboard
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "5px 14px 5px 5px" }}>
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "Faculty")}&backgroundColor=7c3aed&textColor=ffffff`}
            alt="avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }} />
          <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>{user.name || "Faculty"}</span>
        </div>
      </div>

      {/* Alert toast */}
      {showAlert && (
        <div style={{
          position: "fixed", top: "76px", right: "24px", zIndex: 200,
          background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)",
          borderRadius: "14px", padding: "14px 18px",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 8px 24px rgba(244,63,94,0.25)", maxWidth: "320px",
          animation: "slideIn 0.3s ease",
        }}>
          <span style={{ fontSize: "22px" }}>🚨</span>
          <div>
            <p style={{ color: "#f43f5e", fontSize: "13px", fontWeight: "700", margin: "0 0 2px" }}>Unauthorized User Attempt Detected</p>
            <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "11px", margin: 0 }}>Unknown face flagged near camera zone</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        <div>
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 4px" }}>Faculty Portal</p>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: "700", margin: 0 }}>Take Attendance 📸</h1>
        </div>

        {/* SESSION SETUP CARD */}
        {!sessionActive && (
          <div style={{ ...card, border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.06)" }}>
            <p style={labelStyle}>📋 Session Setup</p>
            <h2 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: "0 0 16px" }}>
              Fill in session details before starting
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {/* Subject */}
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: "8px" }}>Subject</label>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={e => { e.target.style.border = "1.5px solid rgba(124,58,237,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                  onBlur={e => { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}>
                  <option value="" style={{ background: "#0d0b1e" }}>-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id} style={{ background: "#0d0b1e" }}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: "8px" }}>Room No.</label>
                <input type="text" placeholder="e.g. B-204, Lab-3" value={roomNo}
                  onChange={e => setRoomNo(e.target.value)} style={inputStyle}
                  onFocus={e => { e.target.style.border = "1.5px solid rgba(124,58,237,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                  onBlur={e => { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }} />
              </div>

              {/* Location */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ ...labelStyle, display: "block", marginBottom: "8px" }}>📍 Classroom Location</label>

                {locationStatus === "idle" && (
                  <div onClick={requestLocation} style={{
                    display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px",
                    borderRadius: "12px", background: "rgba(255,255,255,0.03)",
                    border: "1.5px dashed rgba(255,255,255,0.15)", cursor: "pointer", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.border = "1.5px dashed rgba(124,58,237,0.5)"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.border = "1.5px dashed rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="loc" style={{ width: "32px", height: "32px", opacity: 0.6 }} />
                    <div>
                      <p style={{ color: "#e5e7eb", fontSize: "14px", fontWeight: "500", margin: 0 }}>Click to fetch classroom location</p>
                      <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>Students within 200m will be allowed</p>
                    </div>
                  </div>
                )}
                {locationStatus === "loading" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.3)" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "3px solid rgba(99,102,241,0.3)", borderTop: "3px solid #6366f1", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: "#a5b4fc", fontSize: "14px", fontWeight: "500", margin: 0 }}>Fetching location...</p>
                  </div>
                )}
                {locationStatus === "granted" && location && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "12px", background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="ok" style={{ width: "28px", height: "28px" }} />
                      <div>
                        <p style={{ color: "#10b981", fontSize: "14px", fontWeight: "600", margin: 0 }}>Location Captured ✓</p>
                        <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>📍 {location.lat}, {location.lng}</p>
                      </div>
                    </div>
                    <button onClick={requestLocation} style={{ padding: "5px 12px", borderRadius: "8px", border: "none", background: "rgba(16,185,129,0.2)", color: "#10b981", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Refresh</button>
                  </div>
                )}
                {locationStatus === "denied" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "12px", background: "rgba(244,63,94,0.1)", border: "1.5px solid rgba(244,63,94,0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img src="https://cdn-icons-png.flaticon.com/512/753/753345.png" alt="denied" style={{ width: "28px", height: "28px" }} />
                      <div>
                        <p style={{ color: "#f43f5e", fontSize: "14px", fontWeight: "600", margin: 0 }}>Location Denied</p>
                        <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>Enable location in browser settings</p>
                      </div>
                    </div>
                    <button onClick={requestLocation} style={{ padding: "5px 12px", borderRadius: "8px", border: "none", background: "rgba(244,63,94,0.2)", color: "#f43f5e", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Retry</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INFO CARDS (shown after session starts) */}
        {sessionActive && (
          <>
            <div style={{ padding: "10px 16px", borderRadius: "10px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <p style={{ color: "#a78bfa", fontSize: "12px", margin: 0 }}>
                📋 Share with students → Session ID: <strong style={{ color: "white", fontSize: "14px" }}>{sessionCode}</strong>
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "14px" }}>
              <div style={card}>
                <p style={labelStyle}>Session Info</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {[
                    { l: "Subject", v: subjects.find(s => s._id === selectedSubject)?.name || "—" },
                    { l: "Room", v: roomNo },
                    { l: "Faculty", v: user.name || "—" },
                    { l: "Session", v: `#${sessionCode?.split("-").pop() || "—"}` },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(156,163,175,0.6)", fontSize: "12px" }}>{l}</span>
                      <span style={{ color: "#e5e7eb", fontSize: "12px", fontWeight: "600", maxWidth: "60%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <p style={labelStyle}>📍 Location</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                  <div>
                    <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "10px", margin: "0 0 2px" }}>Latitude</p>
                    <p style={{ color: "#a78bfa", fontSize: "13px", fontWeight: "700", margin: 0 }}>{location?.lat}° N</p>
                  </div>
                  <div>
                    <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "10px", margin: "0 0 2px" }}>Longitude</p>
                    <p style={{ color: "#a78bfa", fontSize: "13px", fontWeight: "700", margin: 0 }}>{location?.lng}° E</p>
                  </div>
                </div>
              </div>

              <div style={{ ...card, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", textAlign: "center" }}>
                <p style={labelStyle}>Generated OTP</p>
                <p style={{ color: "white", fontSize: "32px", fontWeight: "800", letterSpacing: "0.1em", margin: "8px 0 6px", textShadow: "0 0 16px rgba(124,58,237,0.6)" }}>{otp}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: countdown < 60 ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)", padding: "3px 10px", borderRadius: "99px" }}>
                  <span style={{ fontSize: "10px" }}>⏱️</span>
                  <span style={{ color: countdown < 60 ? "#f43f5e" : "#f59e0b", fontSize: "12px", fontWeight: "700" }}>{mins}:{secs}</span>
                </div>
              </div>

              <div style={{ ...card, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", textAlign: "center" }}>
                <p style={labelStyle}>Present Students</p>
                <p style={{ color: "#10b981", fontSize: "32px", fontWeight: "800", margin: "8px 0 4px", textShadow: "0 0 16px rgba(16,185,129,0.5)" }}>{presentStudents.length}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.2s ease infinite" }} />
                  <span style={{ color: "rgba(156,163,175,0.6)", fontSize: "11px" }}>Live</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* START / STATUS BUTTON */}
        {!sessionActive ? (
          <div>
            <button onClick={startSession} disabled={!canStart || starting} style={{
              width: "100%", height: "54px", borderRadius: "16px", border: "none",
              background: canStart ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.07)",
              color: canStart ? "white" : "rgba(156,163,175,0.4)",
              fontSize: "16px", fontWeight: "700", cursor: canStart ? "pointer" : "not-allowed",
              boxShadow: canStart ? "0 8px 28px rgba(124,58,237,0.4)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "transform 0.2s",
            }}
              onMouseEnter={e => { if (canStart) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              {starting ? (
                <>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", animation: "spin 0.8s linear infinite" }} />
                  Starting Session...
                </>
              ) : (
                <>
                  ▶️ Start Session
                  {!canStart && <span style={{ fontSize: "13px", fontWeight: "400", opacity: 0.7 }}>— Fill subject, room & location first</span>}
                </>
              )}
            </button>
            {startError && <p style={{ color: "#f43f5e", fontSize: "13px", textAlign: "center", marginTop: "8px" }}>⚠️ {startError}</p>}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px", borderRadius: "14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.2s ease infinite" }} />
            <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "700" }}>Attendance Session Active</span>
          </div>
        )}

        {/* ATTENDANCE TABLE */}
        {sessionActive && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <p style={labelStyle}>Live Attendance</p>
                <h2 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>Student Records</h2>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
                  {[{ k: "name", l: "Name" }, { k: "roll", l: "Roll No" }].map(({ k, l }) => (
                    <button key={k} onClick={() => setSearchBy(k)} style={{
                      padding: "5px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
                      fontSize: "11px", fontWeight: "600",
                      background: searchBy === k ? "rgba(124,58,237,0.3)" : "transparent",
                      color: searchBy === k ? "#c4b5fd" : "rgba(156,163,175,0.5)",
                    }}>{l}</button>
                  ))}
                </div>
                <input type="text" placeholder={searchBy === "name" ? "Search by Name" : "Search by Roll No"}
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ height: "32px", padding: "0 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "12px", outline: "none", width: "160px" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: faceToggle ? "2fr 1.5fr 1fr 1fr" : "2fr 1.5fr 1fr", gap: "10px", padding: "0 10px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "4px" }}>
              {["Name", "Roll No", "Time", ...(faceToggle ? ["Face ID"] : [])].map(h => (
                <span key={h} style={{ color: "rgba(156,163,175,0.45)", fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "260px", overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <p style={{ color: "rgba(156,163,175,0.4)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                  {presentStudents.length === 0 ? "Waiting for students to mark attendance..." : "No matching students"}
                </p>
              ) : filtered.map((s, i) => (
                <div key={s.roll} style={{
                  display: "grid", gridTemplateColumns: faceToggle ? "2fr 1.5fr 1fr 1fr" : "2fr 1.5fr 1fr", gap: "10px",
                  padding: "10px", borderRadius: "10px", alignItems: "center",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "white", fontWeight: "700", flexShrink: 0 }}>
                      {s.name.charAt(0)}
                    </div>
                    <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>{s.name}</span>
                  </div>
                  <span style={{ color: "rgba(156,163,175,0.7)", fontSize: "12px" }}>{s.roll}</span>
                  <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>{s.time}</span>
                  {faceToggle && (
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>
                      ✅ {s.confidenceScore ? `${s.confidenceScore}%` : "Verified"}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={endSession} style={{ flex: 1, height: "44px", borderRadius: "12px", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)", color: "#f43f5e", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>⏹️ End Session</button>
              <button onClick={handleExportCsv} style={{ flex: 1, height: "44px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>📊 Export CSV</button>
            </div>
          </div>
        )}

        {/* AI FEATURES */}
        <div style={card}>
          <p style={labelStyle}>🤖 AI Features</p>
          <h2 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: "0 0 16px" }}>Smart Detection Settings</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Face Verification */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px",
                background: faceToggle ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.03)",
                border: faceToggle ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>🎭</span>
                  <div>
                    <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0 }}>Enable Face Verification</p>
                    <p style={{ color: faceToggle ? "#a78bfa" : "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>
                      {faceToggle ? "Active — verifying every check-in" : "AI-based identity confirmation"}
                    </p>
                  </div>
                </div>
                <Toggle on={faceToggle} onClick={async () => {
                  const v = !faceToggle; setFaceToggle(v);
                  await handleToggleUpdate("faceVerification", v);
                }} color="#7c3aed" />
              </div>
              {faceToggle && (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "10px", margin: "0 0 2px" }}>Faces Verified</p>
                    <p style={{ color: "#a78bfa", fontSize: "16px", fontWeight: "800", margin: 0 }}>{faceVerifiedCount}</p>
                  </div>
                  <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "10px", margin: "0 0 2px" }}>Match Accuracy</p>
                    <p style={{ color: "#a78bfa", fontSize: "16px", fontWeight: "800", margin: 0 }}>96.2%</p>
                  </div>
                </div>
              )}
            </div>

            {/* Anti-Spoofing */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px",
              background: antiSpoof ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
              border: antiSpoof ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>🛡️</span>
                <div>
                  <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0 }}>Anti-Spoofing</p>
                  <p style={{ color: antiSpoof ? "#10b981" : "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>
                    Liveness Detection {antiSpoof ? "ON — blocking photo/video spoofs" : "OFF"}
                  </p>
                </div>
              </div>
              <Toggle on={antiSpoof} onClick={async () => {
                const v = !antiSpoof; setAntiSpoof(v);
                await handleToggleUpdate("antiSpoofing", v);
              }} color="#10b981" />
            </div>

            {/* Alerts */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px",
                background: alertsEnabled ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                border: alertsEnabled ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>🚨</span>
                  <div>
                    <p style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "600", margin: 0 }}>Unknown Face Alerts</p>
                    <p style={{ color: alertsEnabled ? "#f59e0b" : "rgba(156,163,175,0.5)", fontSize: "11px", margin: 0 }}>
                      {!faceToggle ? "Requires Face Verification to be enabled"
                        : alertsEnabled ? "Monitoring for unauthorized attempts" : "Alerts muted"}
                    </p>
                  </div>
                </div>
                <Toggle on={alertsEnabled} onClick={async () => {
                  const v = !alertsEnabled; setAlertsEnabled(v);
                  await handleToggleUpdate("unknownFaceAlerts", v);
                }} color="#f59e0b" />
              </div>
              {alertLog.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {alertLog.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px", borderRadius: "8px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                      <span style={{ fontSize: "12px" }}>⚠️</span>
                      <span style={{ color: "#f43f5e", fontSize: "11px", fontWeight: "600" }}>Unauthorized attempt</span>
                      <span style={{ color: "rgba(156,163,175,0.5)", fontSize: "10px", marginLeft: "auto" }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0; transform:translateX(20px);} to{opacity:1; transform:translateX(0);} }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0d0b1e; color: white; }
      `}</style>
    </div>
  );
}

export default TakeAttendance;