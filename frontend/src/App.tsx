import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import SignUp from "./pages/auth/register";
import Login from "./pages/auth/login";
import UserInfo from "./pages/user/userInfo";
import InboxPage from "./pages/inbox";
import InboxLayout from "./pages/inbox/layout";
import { useAuth } from "./contexts/authContext";
import { useEffect } from "react";
import API from "./api/baseAPI";

export default function App() {
  const { setUser } = useAuth();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/user/info");
        console.log("Fetched user info:", res.data);
        setUser(res.data);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/user-info" element={<UserInfo />} />
      {/* redirect /inbox sang /mailbox/inbox */}
      <Route path="/mailbox" element={<Navigate to="/mailbox/inbox" replace />} />

      {/* mailbox route */}
      <Route
        path="/mailbox/:id"
        element={
          <InboxLayout>
            <InboxPage />
          </InboxLayout>
        }
      />
    </Routes>
  );
}