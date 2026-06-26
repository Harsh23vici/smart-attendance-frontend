import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = async () => {
  if (!email || !password) return;
  try {
    const res = await API.post("/auth/login", { email, password });

    // Pehle clear karo — phir set karo
    localStorage.clear();
    
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role);
    localStorage.setItem("name", res.data.user.name);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    if (res.data.user.role === "faculty") {
      navigate("/faculty/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
  }
};

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #312e81 100%)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl shadow-2xl border border-white/20"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "48px 40px",
        }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Smart Attendance
          </h1>
          <p className="text-gray-400 text-base">
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm ml-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-13 px-5 rounded-xl text-white placeholder-gray-500 border border-white/15 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              style={{
                background: "rgba(15, 23, 42, 0.75)",
                height: "52px",
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm ml-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 rounded-xl text-white placeholder-gray-500 border border-white/15 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              style={{
                background: "rgba(15, 23, 42, 0.75)",
                height: "52px",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <span className="text-violet-400 text-sm cursor-pointer hover:text-violet-300 transition">
              Forgot Password?
            </span>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full text-white text-lg font-semibold rounded-xl transition duration-300 hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            height: "52px",
          }}
        >
          Login
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        {/* Sign Up */}
        <p className="text-center text-gray-400 text-sm">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-violet-400 font-medium cursor-pointer hover:text-violet-300 transition"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;