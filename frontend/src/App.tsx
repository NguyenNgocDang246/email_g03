import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import SignUp from "./pages/auth/register";
import Login from "./pages/auth/login";
import UserInfo from "./pages/user/userInfo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/user-info" element={<UserInfo />} />
    </Routes>
  );
}