import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import StudentDashboard from "./pages/student/StudentDashboard";
import MarkAttendance from "./pages/student/MarkAttendance";
import Analytics from "./pages/student/Analytics";
import ChangePassword from "./pages/student/ChangePassword";
import FaceRecognition from "./pages/student/FaceRecognition";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import TakeAttendance from "./pages/faculty/TakeAttendance";
import FacultyChangePassword from "./pages/faculty/ChangePasswordcopy";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<h1>Home</h1>} />
       <Route path="/login" element={<Login />} />
       <Route path="/signup" element={<Signup />} />

   <Route path="/student/dashboard" element={<StudentDashboard />} />
   <Route path="/student/mark-attendance" element={<MarkAttendance />} />
   <Route path="/student/analytics" element={<Analytics />} />
   <Route path="/student/change-password"element={<ChangePassword />} />
  <Route path="/student/face-recognition"element={<FaceRecognition />} />

    <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
       <Route path="/faculty/Take-attendance" element={<TakeAttendance />} />
  <Route path="/faculty/change-password" element={<FacultyChangePassword/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App; 