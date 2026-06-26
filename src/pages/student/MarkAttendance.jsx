// src/pages/MarkAttendance.jsx
// Flow: Step 1 Session ID → Step 2 OTP → Step 3 Location → Step 4 Face Scan → Submit
// face-api.js must be loaded in index.html:
// <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
// Models go in public/models/ (tiny_face_detector, face_landmark_68, face_recognition)

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
const MODELS_URL = "/models";

function MarkAttendance() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const [sessionCode, setSessionCode] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [location, setLocation] = useState(null);

  // Face step
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [faceStatus, setFaceStatus] = useState("idle"); // idle | scanning | captured | error
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Load face-api models when component mounts
  useEffect(() => {
    const faceapi = window.faceapi;
    if (!faceapi) return; // graceful — no models = no face step
    setModelsLoading(true);
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ])
      .then(() => setModelsReady(true))
      .catch(() => setModelsReady(false))
      .finally(() => setModelsLoading(false));
  }, []);

  // When all 3 steps done → open camera automatically
  useEffect(() => {
    const step1ok = sessionCode.trim().length >= 4;
    const step2ok = otp.every((d) => d !== "");
    const step3ok = locationStatus === "granted";
    if (step1ok && step2ok && step3ok && modelsReady && !cameraOn) {
      openCamera();
    }
  }, [sessionCode, otp, locationStatus, modelsReady]);

  const openCamera = async () => {
    if (cameraOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((res) => { videoRef.current.onloadedmetadata = res; });
      }
      setCameraOn(true);
      startFaceScan();
    } catch {
      setFaceStatus("error");
    }
  };

  const startFaceScan = () => {
    setFaceStatus("scanning");
    const faceapi = window.faceapi;
    if (!faceapi || !videoRef.current) return;

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const result = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (result) {
          clearInterval(scanIntervalRef.current);
          setFaceDescriptor(Array.from(result.descriptor));
          setFaceStatus("captured");
        }
      } catch { /* keep scanning */ }
    }, 1000);
  };

  const retryFaceScan = () => {
    setFaceDescriptor(null);
    setFaceStatus("scanning");
    startFaceScan();
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      clearInterval(scanIntervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // OTP handlers
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const n = [...otp]; n[idx] = val; setOtp(n);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { setOtp(p.split("")); document.getElementById("otp-5")?.focus(); }
    e.preventDefault();
  };

  const requestLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  };

  // Face step is required only if models loaded; otherwise OTP-only fallback
  const faceReady = !modelsReady || faceStatus === "captured";
  const canSubmit =
  sessionCode.trim().length >= 4 &&
  otp.every((d) => d !== "") &&
  locationStatus === "granted";

  const handleSubmit = async () => {
  if (!canSubmit) return;
  
  // Face scan page pe redirect karo with session data
  const attendanceData = {
    sessionCode: sessionCode.trim(),
    otp: otp.join(""),
    lat: location.lat,
    lng: location.lng,
  };
  
  // localStorage mein save karo
  localStorage.setItem("pendingAttendance", JSON.stringify(attendanceData));
  
  // Face scan page pe redirect karo
  navigate("/student/face-recognition");
};

  const resetForm = () => {
    setSubmitted(false); setSessionCode(""); setOtp(["","","","","",""]);
    setLocationStatus("idle"); setLocation(null);
    setFaceStatus("idle"); setFaceDescriptor(null); setCameraOn(false);
    setApiError("");
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: "600",
    letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "8px",
  };
  const inputStyle = {
    width: "100%", height: "52px", padding: "0 20px", borderRadius: "14px", fontSize: "15px",
    background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)",
    color: "white", outline: "none", transition: "border 0.2s, box-shadow 0.2s", boxSizing: "border-box",
  };

  const StepBadge = ({ n }) => (
    <div style={{
      width: "24px", height: "24px", borderRadius: "50%",
      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "11px", color: "white", fontWeight: "700", flexShrink: 0,
    }}>{n}</div>
  );

  if (submitted) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)", fontFamily: "system-ui, sans-serif", padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: "380px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "24px", padding: "48px 36px", boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}>
        <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="success" style={{ width: "80px", height: "80px", marginBottom: "20px", filter: "drop-shadow(0 0 16px rgba(16,185,129,0.6))" }} />
        <h2 style={{ color: "white", fontSize: "24px", fontWeight: "700", margin: "0 0 8px" }}>Attendance Marked!</h2>
        <p style={{ color: "rgba(156,163,175,0.7)", fontSize: "14px", margin: "0 0 6px" }}>
          Session <span style={{ color: "#a78bfa", fontWeight: "600" }}>#{sessionCode}</span> — Done ✅
        </p>
        {faceDescriptor && <p style={{ color: "#10b981", fontSize: "12px", margin: "0 0 4px" }}>🎭 Face verified successfully</p>}
        {location && <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: "0 0 28px" }}>📍 {Number(location.lat).toFixed(5)}, {Number(location.lng).toFixed(5)}</p>}
        <button onClick={resetForm} style={{ width: "100%", height: "48px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.4)", marginBottom: "12px" }}>Mark Another</button>
        <button onClick={() => navigate("/student/dashboard")} style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(156,163,175,0.7)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>← Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)", fontFamily: "system-ui, sans-serif" }}>

      {/* NAVBAR */}
      <div style={{ background: "rgba(10,8,28,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => navigate("/student/dashboard")} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="logo" style={{ width: "32px", height: "32px", borderRadius: "8px", padding: "4px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", filter: "brightness(0) invert(1)" }} />
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>Smart<span style={{ color: "#a78bfa" }}>Attendance</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", padding: "5px 14px 5px 5px" }}>
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "S")}&backgroundColor=7c3aed&textColor=ffffff`} alt="avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }} />
          <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: "500" }}>{user.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 24px" }}>
        <button onClick={() => navigate("/student/dashboard")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "rgba(156,163,175,0.6)", fontSize: "13px", marginBottom: "16px", padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(156,163,175,0.6)"}>
          ← Back to Dashboard
        </button>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "6px" }}>Attendance Portal</p>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: "0 0 6px" }}>Mark Attendance</h1>
          <p style={{ color: "rgba(156,163,175,0.7)", fontSize: "14px", margin: 0 }}>Complete all steps to confirm your presence</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* STEP 1 — Session ID */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <StepBadge n={1} />
              <label style={{ ...labelStyle, margin: 0 }}>Session ID</label>
            </div>
            <input type="text" placeholder="e.g. CS301-2026-06-482" value={sessionCode}
              onChange={e => setSessionCode(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.border = "1.5px solid rgba(124,58,237,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
              onBlur={e => { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }} />
            <p style={{ color: "rgba(156,163,175,0.45)", fontSize: "12px", marginTop: "6px" }}>Get this from your faculty's attendance screen</p>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* STEP 2 — OTP */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <StepBadge n={2} />
              <label style={{ ...labelStyle, margin: 0 }}>One-Time Password (OTP)</label>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }} onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength={1}
                  value={digit} onChange={e => handleOtpChange(e.target.value, idx)} onKeyDown={e => handleOtpKeyDown(e, idx)}
                  style={{
                    width: "52px", height: "60px", borderRadius: "14px", fontSize: "22px", fontWeight: "700",
                    textAlign: "center", color: "white", outline: "none",
                    background: digit ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                    border: digit ? "1.5px solid rgba(124,58,237,0.7)" : "1.5px solid rgba(255,255,255,0.1)",
                    boxShadow: digit ? "0 0 0 3px rgba(124,58,237,0.12)" : "none", transition: "all 0.2s",
                  }}
                  onFocus={e => { e.target.style.border = "1.5px solid rgba(124,58,237,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                  onBlur={e => { if (!digit) { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; } }} />
              ))}
            </div>
            <p style={{ color: "rgba(156,163,175,0.45)", fontSize: "12px", marginTop: "8px" }}>6 digit OTP shown on your faculty's screen</p>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* STEP 3 — Location */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <StepBadge n={3} />
              <label style={{ ...labelStyle, margin: 0 }}>Location Verification</label>
            </div>

            {locationStatus === "idle" && (
              <div onClick={requestLocation} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderRadius: "14px", cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.15)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.border = "1.5px dashed rgba(124,58,237,0.5)"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.border = "1.5px dashed rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="loc" style={{ width: "36px", height: "36px", opacity: 0.7 }} />
                <div>
                  <p style={{ color: "#e5e7eb", fontSize: "14px", fontWeight: "500", margin: 0 }}>Allow Location Access</p>
                  <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>Tap to verify you're on campus</p>
                </div>
              </div>
            )}
            {locationStatus === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderRadius: "14px", background: "rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.3)" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "3px solid rgba(99,102,241,0.3)", borderTop: "3px solid #6366f1", animation: "spin 0.8s linear infinite" }} />
                <p style={{ color: "#a5b4fc", fontSize: "14px", fontWeight: "500", margin: 0 }}>Fetching location...</p>
              </div>
            )}
            {locationStatus === "granted" && location && (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderRadius: "14px", background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)" }}>
                <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="ok" style={{ width: "32px", height: "32px" }} />
                <div>
                  <p style={{ color: "#10b981", fontSize: "14px", fontWeight: "600", margin: 0 }}>Location Verified ✓</p>
                  <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>📍 {Number(location.lat).toFixed(5)}, {Number(location.lng).toFixed(5)}</p>
                </div>
              </div>
            )}
            {locationStatus === "denied" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "16px 20px", borderRadius: "14px", background: "rgba(244,63,94,0.1)", border: "1.5px solid rgba(244,63,94,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/753/753345.png" alt="denied" style={{ width: "28px", height: "28px" }} />
                  <div>
                    <p style={{ color: "#f43f5e", fontSize: "14px", fontWeight: "600", margin: 0 }}>Location Denied</p>
                    <p style={{ color: "rgba(156,163,175,0.5)", fontSize: "12px", margin: 0 }}>Enable location in browser settings</p>
                  </div>
                </div>
                <button onClick={requestLocation} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "rgba(244,63,94,0.2)", color: "#f43f5e", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Retry</button>
              </div>
            )}
          </div>

          {/* STEP 4 — Face Verification */}
        

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {apiError && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", fontSize: "13px" }}>
              ⚠️ {apiError}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
            width: "100%", height: "54px", borderRadius: "14px", border: "none",
            background: canSubmit ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" : "rgba(255,255,255,0.07)",
            color: canSubmit ? "white" : "rgba(156,163,175,0.4)",
            fontSize: "16px", fontWeight: "700", cursor: canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? "0 8px 28px rgba(124,58,237,0.4)" : "none",
            transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            {submitting ? (
              <>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", animation: "spin 0.8s linear infinite" }} />
                Marking Attendance...
              </>
            ) : "📷 Proceed to Face Scan"}
          </button>

          {!canSubmit && !apiError && (
            <p style={{ textAlign: "center", color: "rgba(156,163,175,0.4)", fontSize: "12px", marginTop: "-12px" }}>
            "Complete all 3 steps to enable submission" 
            </p>
          )}
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

export default MarkAttendance;