import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

const MODELS_URL = "/models";

export default function FaceRecognitionAttendance() {
  const navigate = useNavigate();
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("idle");
  const [currentMatch, setCurrentMatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [clock, setClock] = useState(new Date());
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Pending attendance data
  const pendingData = JSON.parse(localStorage.getItem("pendingAttendance") || "null");

  // Models load
  useEffect(() => {
    const faceapi = window.faceapi;
    if (!faceapi) return;
    setModelsLoading(true);
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ])
      .then(() => setModelsReady(true))
      .catch(console.error)
      .finally(() => setModelsLoading(false));
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cleanup camera
  useEffect(() => {
    return () => {
      clearInterval(scanIntervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startScanning = async () => {
    if (!modelsReady) return;
    setError("");
    setScanning(true);
    setStatus("scanning");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      streamRef.current = stream;
      
      const v = document.getElementById("fr-video");
      if (v) {
        v.srcObject = stream;
        await new Promise(res => { v.onloadedmetadata = res; });
      }

      const faceapi = window.faceapi;
      if (!faceapi) return;

      scanIntervalRef.current = setInterval(async () => {
        if (!v || v.readyState < 2) return;
        try {
          const result = await faceapi
            .detectSingleFace(v, 
              new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (result) {
            clearInterval(scanIntervalRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            setScanning(false);
            setStatus("detected");
            
            // Attendance mark karo
            await markAttendance(Array.from(result.descriptor));
          }
        } catch (e) { console.log(e); }
      }, 1500);

    } catch {
      setStatus("idle");
      setScanning(false);
      setError("Camera access denied. Please allow camera.");
    }
  };

   const markAttendance = async (descriptor) => {
  if (!pendingData) {
    setError("No pending attendance data. Please go back and fill details.");
    return;
  }
  setSubmitting(true);
  try {
    // Step 1: OTP se session verify karo
    const otpRes = await API.post("/attendance/mark", {
      sessionCode: pendingData.sessionCode,
      otp: pendingData.otp,
      lat: pendingData.lat,
      lng: pendingData.lng,
      descriptor, // face descriptor bhi bhejo
    });

    localStorage.removeItem("pendingAttendance");
    setAttendanceResult("success");
    const now = new Date();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentMatch({
      name: user.name || "Student",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      confidence: 95,
    });
    setHistory(h => [{
      id: now.getTime(),
      name: user.name || "Student",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: 95,
      result: "detected",
    }, ...h]);

  } catch (err) {
    setAttendanceResult("failed");
    setError(err.response?.data?.message || "Attendance marking failed. Try again.");
    setStatus("idle");
  } finally {
    setSubmitting(false);
  }
};
  const stopScanning = () => {
    clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setScanning(false);
    setStatus("idle");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060614", padding: "20px", 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      color: "white" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", 
          alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <button onClick={() => navigate("/student/mark-attendance")}
              style={{ background: "none", border: "none", color: "rgba(156,163,175,0.6)", 
                fontSize: "13px", cursor: "pointer", marginBottom: "6px", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(156,163,175,0.6)"}>
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", 
              background: "linear-gradient(135deg, #ffffff, #a78bfa)", 
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              FaceTrack Attendance
            </h1>
            <p style={{ margin: "4px 0 0", color: "rgba(156,163,175,0.6)", fontSize: "13px" }}>
              Face scan required to mark attendance
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", fontFamily: "monospace" }}>
              {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(156,163,175,0.5)" }}>
              {clock.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Pending data info */}
        {pendingData && (
          <div style={{ padding: "10px 16px", borderRadius: "10px", 
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", 
            marginBottom: "14px" }}>
            <p style={{ color: "#a78bfa", fontSize: "12px", margin: 0 }}>
              📋 Session: <strong style={{ color: "white" }}>{pendingData.sessionCode}</strong>
              {" · "}OTP: <strong style={{ color: "white" }}>{pendingData.otp}</strong>
            </p>
          </div>
        )}

        {/* No pending data warning */}
        {!pendingData && (
          <div style={{ padding: "12px 16px", borderRadius: "10px",
            background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)",
            marginBottom: "14px" }}>
            <p style={{ color: "#f43f5e", fontSize: "13px", margin: 0 }}>
              ⚠️ No attendance session found. 
              <span onClick={() => navigate("/student/mark-attendance")}
                style={{ color: "#a78bfa", cursor: "pointer", marginLeft: "6px" }}>
                Go back and fill details first →
              </span>
            </p>
          </div>
        )}

        {/* Models loading */}
        {modelsLoading && (
          <div style={{ padding: "10px 16px", borderRadius: "10px", 
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", 
            marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", 
              border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid #6366f1", 
              animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <p style={{ color: "#a5b4fc", fontSize: "12px", margin: 0 }}>
              Loading face recognition AI... (first time ~15s)
            </p>
          </div>
        )}

        {/* Success banner */}
        {attendanceResult === "success" && (
          <div style={{ padding: "16px 20px", borderRadius: "14px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            marginBottom: "16px", textAlign: "center" }}>
            <p style={{ color: "#10b981", fontSize: "18px", fontWeight: "700", margin: "0 0 6px" }}>
              ✅ Attendance Marked Successfully!
            </p>
            <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "13px", margin: "0 0 12px" }}>
              Session: {pendingData?.sessionCode || "—"}
            </p>
            <button onClick={() => navigate("/student/dashboard")}
              style={{ padding: "10px 24px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "10px",
            background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)",
            marginBottom: "14px" }}>
            <p style={{ color: "#f43f5e", fontSize: "13px", margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px", alignItems: "start" }}>
          
          {/* Camera side */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Camera feed */}
            <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", 
              background: "#060614", aspectRatio: "4/3", width: "100%" }}>
              <video id="fr-video" autoPlay muted playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", 
                  transform: "scaleX(-1)",
                  display: scanning || status === "detected" ? "block" : "none" }} />
              
              {!scanning && status === "idle" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", 
                  flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ fontSize: "40px" }}>📷</span>
                  <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "13px", margin: 0 }}>
                    Click Start Scanning
                  </p>
                </div>
              )}

              {submitting && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)",
                  display: "flex", flexDirection: "column", alignItems: "center", 
                  justifyContent: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%",
                    border: "3px solid rgba(124,58,237,0.3)", borderTop: "3px solid #7c3aed",
                    animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: "white", fontSize: "13px", margin: 0 }}>
                    Verifying face & marking attendance...
                  </p>
                </div>
              )}

              {/* Scan brackets */}
              {scanning && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {[
                    { top: "22%", left: "28%", borderTop: "2px solid #7c3aed", borderLeft: "2px solid #7c3aed", borderRadius: "4px 0 0 0" },
                    { top: "22%", right: "28%", borderTop: "2px solid #7c3aed", borderRight: "2px solid #7c3aed", borderRadius: "0 4px 0 0" },
                    { bottom: "18%", left: "28%", borderBottom: "2px solid #7c3aed", borderLeft: "2px solid #7c3aed", borderRadius: "0 0 0 4px" },
                    { bottom: "18%", right: "28%", borderBottom: "2px solid #7c3aed", borderRight: "2px solid #7c3aed", borderRadius: "0 0 4px 0" },
                  ].map((s, i) => <div key={i} style={{ position: "absolute", width: "20px", height: "20px", ...s }} />)}
                  <div style={{ position: "absolute", left: "28%", right: "28%", height: "2px",
                    background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)",
                    animation: "scanline 1.8s ease-in-out infinite", boxShadow: "0 0 8px #7c3aed" }} />
                </div>
              )}

              {/* Status badge */}
              {(scanning || status === "detected") && (
                <div style={{ position: "absolute", top: "10px", left: "10px", 
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
                  borderRadius: "99px", padding: "3px 10px", 
                  border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%",
                    background: status === "detected" ? "#10b981" : "#f59e0b",
                    animation: "pulse 1.2s ease infinite" }} />
                  <span style={{ color: "white", fontSize: "10px", fontWeight: "600" }}>
                    {status === "detected" ? "CAPTURED" : "SCANNING"}
                  </span>
                </div>
              )}
            </div>

            {/* Status card */}
            <div style={{ 
              background: status === "detected" ? "rgba(16,185,129,0.08)" : 
                status === "scanning" ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.08)",
              border: "1px solid " + (status === "detected" ? "rgba(16,185,129,0.25)" : 
                status === "scanning" ? "rgba(245,158,11,0.25)" : "rgba(99,102,241,0.2)"),
              borderRadius: "14px", padding: "14px 16px",
              display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "26px", flexShrink: 0 }}>
                {status === "detected" ? "✅" : status === "scanning" ? "🔍" : "👁️"}
              </span>
              <div>
                <p style={{ color: "rgba(156,163,175,0.55)", fontSize: "10px", fontWeight: "600",
                  letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px" }}>
                  Detection Status
                </p>
                <p style={{ color: status === "detected" ? "#10b981" : 
                  status === "scanning" ? "#f59e0b" : "#6366f1",
                  fontSize: "16px", fontWeight: "800", margin: 0 }}>
                  {status === "detected" ? "Face Captured!" : 
                    status === "scanning" ? "Scanning..." : "Waiting"}
                </p>
                <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "11px", margin: 0 }}>
                  {status === "detected" ? "Attendance marked ✓" : 
                    status === "scanning" ? "Look directly at camera" : "Click Start Scanning"}
                </p>
              </div>
            </div>

            {/* Button */}
            {attendanceResult !== "success" && (
              <button
                onClick={scanning ? stopScanning : startScanning}
                disabled={!modelsReady || submitting}
                style={{ width: "100%", padding: "14px", borderRadius: "12px",
                  border: "1px solid " + (scanning ? "rgba(244,63,94,0.3)" : "rgba(124,58,237,0.4)"),
                  background: scanning ? "rgba(244,63,94,0.1)" : 
                    (!modelsReady ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #7c3aed, #6d28d9)"),
                  color: scanning ? "#f43f5e" : (!modelsReady ? "rgba(156,163,175,0.4)" : "white"),
                  fontSize: "15px", fontWeight: "700", cursor: modelsReady ? "pointer" : "not-allowed",
                  transition: "all 0.2s" }}>
                {submitting ? "Verifying..." : 
                  scanning ? "⏸ Stop Scanning" : 
                  modelsReady ? "▶ Start Face Scan" : "Loading AI..."}
              </button>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Confidence score */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "16px" }}>
              <p style={{ color: "rgba(156,163,175,0.55)", fontSize: "10px", fontWeight: "600",
                letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Confidence Score
              </p>
              <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px" }}>
                <div style={{ position: "relative", width: "132px", height: "132px" }}>
                  <svg width="132" height="132">
                    <circle cx="66" cy="66" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle cx="66" cy="66" r="56" fill="none"
                      stroke={currentMatch ? "#10b981" : "#6366f1"} strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={currentMatch ? 
                        2 * Math.PI * 56 * (1 - (currentMatch.confidence / 100)) : 
                        2 * Math.PI * 56}
                      strokeLinecap="round"
                      transform="rotate(-90 66 66)"
                      style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", 
                    flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "26px", fontWeight: "800", 
                      color: currentMatch ? "#10b981" : "rgba(156,163,175,0.35)" }}>
                      {currentMatch ? `${currentMatch.confidence}%` : "—"}
                    </span>
                    <span style={{ color: "rgba(156,163,175,0.4)", fontSize: "10px" }}>match score</span>
                  </div>
                </div>
              </div>
              <p style={{ textAlign: "center", color: currentMatch ? "#10b981" : "#6366f1",
                fontSize: "12px", fontWeight: "700", margin: "0 0 2px" }}>
                {currentMatch ? "High confidence match" : "Awaiting scan"}
              </p>
              <p style={{ textAlign: "center", color: "rgba(156,163,175,0.45)", fontSize: "11px", margin: 0 }}>
                Match threshold: 75%
              </p>
            </div>

            {/* History */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "16px" }}>
              <p style={{ color: "rgba(156,163,175,0.55)", fontSize: "10px", fontWeight: "600",
                letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Recognition History
              </p>
              {history.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center" }}>
                  <span style={{ fontSize: "28px" }}>🗂️</span>
                  <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: "8px 0 0" }}>
                    No scans yet. Start scanning to build a log.
                  </p>
                </div>
              ) : (
                history.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 10px", borderRadius: "10px", marginBottom: "6px",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: "700", flexShrink: 0,
                      background: "rgba(16,185,129,0.12)", color: "#10b981",
                      border: "1px solid rgba(16,185,129,0.25)" }}>
                      {e.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "white" }}>{e.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "rgba(156,163,175,0.5)" }}>{e.time}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#10b981" }}>
                        {e.confidence}%
                      </p>
                      <p style={{ margin: 0, fontSize: "10px", color: "rgba(156,163,175,0.4)" }}>Marked ✓</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scanline { 0% { top: 22%; } 50% { top: 76%; } 100% { top: 22%; } }
      `}</style>
    </div>
  );
}