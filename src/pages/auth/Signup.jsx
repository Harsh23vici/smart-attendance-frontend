import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [faceDescriptor, setFaceDescriptor] = useState(null);
const [cameraOn, setCameraOn] = useState(false);
const [faceStatus, setFaceStatus] = useState("idle");
const [modelsLoading, setModelsLoading] = useState(false);
const [modelsReady, setModelsReady] = useState(false);
const videoRef = useRef(null);
const streamRef = useRef(null);
const scanIntervalRef = useRef(null);
useEffect(() => {
  const faceapi = window.faceapi;
  if (!faceapi) return;
  setModelsLoading(true);
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  ])
    .then(() => setModelsReady(true))
    .catch(() => setModelsReady(false))
    .finally(() => setModelsLoading(false));
}, []);

const openCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    streamRef.current = stream;
    setCameraOn(true); // pehle camera on karo taaki video element render ho
    // video element render hone ka wait karo
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startFaceScan();
        };
      }
    }, 100);
  } catch (err) {
    console.error("Camera error:", err);
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
        .detectSingleFace(videoRef.current, 
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (result) {
        clearInterval(scanIntervalRef.current);
        setFaceDescriptor(Array.from(result.descriptor));
        setFaceStatus("captured");
        // Camera band karo capture ke baad
        streamRef.current?.getTracks().forEach(t => t.stop());
        setCameraOn(false);
      }
    } catch { }
  }, 1000);
};

// Cleanup
useEffect(() => {
  return () => {
    clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };
}, []);

const handleCreateAccount = async () => {
  // Pehle saare validations
  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }
  if (!role) {
    alert("Please select your role (Student or Faculty)");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }
   if (role === 'student' && !faceDescriptor) {
    alert("Please complete face scan first");
    return;
  }
  console.log("faceDescriptor sending:", faceDescriptor?.length);
  try {
    const res = await API.post("/auth/signup", {
  name, email, password, role,
  faceDescriptor: role === 'student' ? faceDescriptor : null,
});

    // Token save karo login ke liye
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    alert("Account created successfully");

    if (role === "faculty") {
      navigate("/faculty/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Signup failed");
  }
};
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a0533 40%, #0d1b3e 100%)",
      }}
    >
      <div
        className="w-full flex rounded-3xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: "820px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >

        {/* ── LEFT PANEL ── */}
        <div
          className="hidden md:flex flex-col items-center justify-center w-5/12 p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #1e0a4a 0%, #0f172a 100%)",
          }}
        >
          {/* Glow blobs */}
          <div style={{
            position: "absolute", top: "-80px", left: "-80px",
            width: "260px", height: "260px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.35), transparent)",
          }}/>
          <div style={{
            position: "absolute", bottom: "-60px", right: "-60px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.3), transparent)",
          }}/>

          {/* SVG Illustration */}
          <svg viewBox="0 0 220 220" className="w-36 h-36 mb-5" fill="none">
            {/* Outer glow ring */}
            <circle cx="110" cy="110" r="90" fill="rgba(124,58,237,0.08)" stroke="rgba(167,139,250,0.2)" strokeWidth="1"/>
            <circle cx="110" cy="110" r="70" fill="rgba(124,58,237,0.06)" stroke="rgba(167,139,250,0.15)" strokeWidth="1"/>
            {/* Cap */}
            <polygon points="110,55 165,82 110,96 55,82" fill="#7c3aed"/>
            <ellipse cx="110" cy="96" rx="55" ry="10" fill="#6d28d9" opacity="0.6"/>
            <rect x="158" y="82" width="5" height="32" fill="#a78bfa" rx="2"/>
            <circle cx="163" cy="116" r="6" fill="#7c3aed"/>
            {/* Person body */}
            <circle cx="110" cy="135" r="20" fill="#c4b5fd"/>
            <rect x="80" y="154" width="60" height="38" rx="16" fill="#4c1d95" opacity="0.9"/>
            {/* Badge */}
            <circle cx="148" cy="162" r="16" fill="#10b981"/>
            <polyline points="140,162 146,169 157,154" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <h2 className="text-white text-2xl font-bold text-center mb-3" style={{ lineHeight: "1.4" }}>
            Join Smart<br/>Attendance
          </h2>
          <p className="text-center text-sm" style={{ color: "rgba(196,181,253,0.7)", lineHeight: "1.7" }}>
            Track attendance effortlessly.<br/>
            Students & Faculty — all in one place.
          </p>

          {/* Stats */}
          <div
            className="flex gap-6 mt-6 px-6 py-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {[["500+", "Students"], ["50+", "Faculty"], ["99%", "Accuracy"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-white font-bold text-xl">{num}</p>
                <p className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: FORM ── */}
        <div
          className="flex-1 flex flex-col justify-center px-8  py-8"
          style={{
            background: "rgba(10, 8, 28, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Heading */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#7c3aed" }}>
              
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p style={{ color: "rgba(156,163,175,0.8)", fontSize: "15px" }}>
              Fill in your details below to register
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: "16px" }}>

            {/* Full Name */}
            <div>
              <label style={{
                display: "block", fontSize: "11px", fontWeight: "600",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#6d28d9", marginBottom: "8px"
              }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Harsh Sharma"
                value={name}
onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%", height: "48px", padding: "0 20px",
                  borderRadius: "14px", fontSize: "15px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  color: "white", outline: "none",
                  transition: "border 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => {
                  e.target.style.border = "1.5px solid rgba(124,58,237,0.7)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
                }}
                onBlur={e => {
                  e.target.style.border = "1.5px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: "11px", fontWeight: "600",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#6d28d9", marginBottom: "8px"
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                style={{
                  width: "100%", height: "48px", padding: "0 20px",
                  borderRadius: "14px", fontSize: "15px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  color: "white", outline: "none",
                  transition: "border 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => {
                  e.target.style.border = "1.5px solid rgba(124,58,237,0.7)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
                }}
                onBlur={e => {
                  e.target.style.border = "1.5px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password Row */}
            <div className="flex gap-4">
              {[
                { label: "Password", placeholder: "Min 8 characters", type: "password" },
                { label: "Confirm Password", placeholder: "Repeat password", type: "password" },
              ].map(({ label, placeholder, type },index) => (
                <div key={label} style={{ flex: 1 }}>
                  <label style={{
                    display: "block", fontSize: "11px", fontWeight: "600",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#6d28d9", marginBottom: "8px"
                  }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={index === 0 ? password : confirmPassword}
onChange={(e) =>
  index === 0
    ? setPassword(e.target.value)
    : setConfirmPassword(e.target.value)
}
                    placeholder={placeholder}
                    style={{
                      width: "100%", height: "48px", padding: "0 20px",
                      borderRadius: "14px", fontSize: "15px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      color: "white", outline: "none",
                      transition: "border 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={e => {
                      e.target.style.border = "1.5px solid rgba(124,58,237,0.7)";
                      e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
                    }}
                    onBlur={e => {
                      e.target.style.border = "1.5px solid rgba(255,255,255,0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Role Selector */}
            <div>
              <label style={{
                display: "block", fontSize: "11px", fontWeight: "600",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#6d28d9", marginBottom: "10px"
              }}>
                I am a
              </label>
              <div className="flex gap-4">
                {[
                  { val: "student", icon: "🎓", label: "Student", sub: "Mark & view attendance" },
                  { val: "faculty", icon: "🏫", label: "Faculty", sub: "Manage & track classes" },
                ].map(({ val, icon, label, sub }) => (
                  <div
                    key={val}
                    onClick={() => setRole(val)}
                    style={{
                      flex: 1, padding: "14px 18px", borderRadius: "16px",
                      cursor: "pointer", transition: "all 0.25s",
                      border: role === val
                        ? "1.5px solid rgba(124,58,237,0.8)"
                        : "1.5px solid rgba(255,255,255,0.08)",
                      background: role === val
                        ? "rgba(124,58,237,0.18)"
                        : "rgba(255,255,255,0.03)",
                      boxShadow: role === val
                        ? "0 0 20px rgba(124,58,237,0.2)"
                        : "none",
                    }}
                  >
                    <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
                    <p style={{
                      color: role === val ? "#e9d5ff" : "#d1d5db",
                      fontWeight: "600", fontSize: "15px", marginBottom: "3px"
                    }}>
                      {label}
                    </p>
                    <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "12px" }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
           {/* Face Scan - only for students */}
{role === 'student' && (
  <div>
    <label style={{
      display: "block", fontSize: "11px", fontWeight: "600",
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: "#6d28d9", marginBottom: "10px"
    }}>
      Face Scan
    </label>
    {/* Camera preview */}
    {cameraOn && (
      <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden",
        background: "#060614", aspectRatio: "4/3", marginBottom: "10px" }}>
        <video ref={videoRef} autoPlay muted playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        {faceStatus === "scanning" && (
          <div style={{ position: "absolute", top: "10px", left: "10px",
            display: "flex", alignItems: "center", gap: "5px",
            background: "rgba(0,0,0,0.6)", borderRadius: "99px", padding: "3px 10px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%",
              background: "#f59e0b", animation: "pulse 1.2s ease infinite" }} />
            <span style={{ color: "white", fontSize: "10px" }}>Scanning...</span>
          </div>
        )}
      </div>
    )}
    {/* Captured success */}
    {faceStatus === "captured" && (
      <div style={{ padding: "12px 16px", borderRadius: "12px",
        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
          ✅ Face captured successfully!
        </span>
        <button onClick={() => { setFaceStatus("idle"); setFaceDescriptor(null); }}
          style={{ padding: "4px 10px", borderRadius: "6px", border: "none",
            background: "rgba(16,185,129,0.2)", color: "#10b981", fontSize: "11px", cursor: "pointer" }}>
          Retry
        </button>
      </div>
    )}
    {/* Scan button */}
    {faceStatus !== "captured" && modelsReady && !cameraOn && (
      <button onClick={openCamera}
        style={{ width: "100%", height: "44px", borderRadius: "12px", border: "none",
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
        📷 Scan Face
      </button>
    )}
    {modelsLoading && (
      <p style={{ color: "rgba(156,163,175,0.6)", fontSize: "12px", textAlign: "center" }}>
        Loading face recognition... please wait
      </p>
    )}
  </div>
)}
            {/* Create Account Button */}
            <button
              onClick = {handleCreateAccount}
              style={{
                width: "100%", height: "50px", borderRadius: "14px",
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                color: "white", fontSize: "16px", fontWeight: "700",
                border: "none", cursor: "pointer", marginTop: "4px",
                boxShadow: "0 8px 28px rgba(124,58,237,0.4)",
                transition: "all 0.3s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.target.style.transform = "translateY(0)"}
            >
              Create Account →
            </button>

          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }}/>
            <span style={{ color: "rgba(107,114,128,0.8)", fontSize: "11px", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }}/>
          </div>

          {/* Sign In strip */}
          <div 
          onClick={() => navigate("/login")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "10px", borderRadius: "14px", padding: "12px 20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer", transition: "all 0.3s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(124,58,237,0.1)";
              e.currentTarget.style.border = "1px solid rgba(124,58,237,0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
            }}
          >
            <span style={{ color: "rgba(156,163,175,0.8)", fontSize: "14px" }}>
              Already have an account?
            </span>
            <span style={{ color: "#a78bfa", fontWeight: "600", fontSize: "14px" }}>
              Sign In →
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Signup;