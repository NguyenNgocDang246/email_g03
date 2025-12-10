import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { GuestHeader } from "../../components/Layout/GuestHeader";
import { useAuthStore } from "../../store/useAuthStore";

export default function Home() {
  const navigate = useNavigate();

  const { user } = useAuthStore((s) => s);
  const logout = useAuthStore((s) => s.logout);
  const isLogged = !!user;

  const handleLogout = async () => {
    await logout();
  };

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");

  return (
    <div className="h-screen flex flex-col bg-gray-50 w-screen">
      {!isLogged && (
        <GuestHeader
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {isLogged && (
        <Header
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
        />
      )}
      <div className="flex flex-col items-center justify-center grow px-4 text-center mt-12">
        <div className="bg-white shadow-xl rounded-2xl p-10 max-w-lg w-full">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to <span className="text-blue-600">MyApp</span>
          </h1>
          <p className="text-gray-600 mb-8">
            Join our community and start exploring amazing features today.
          </p>

          {!isLogged && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NavLink
                to="/signup"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition"
              >
                <UserPlus size={18} />
                Sign Up
              </NavLink>

              <NavLink
                to="/login"
                className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2.5 px-5 rounded-lg transition"
              >
                <LogIn size={18} />
                Log In
              </NavLink>
            </div>
          )}

          {isLogged && (
            <button
              onClick={() => navigate("/mailbox")}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition"
            >
              Go to Mailbox
            </button>
          )}

          {isLogged && (
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>

        <div className="mt-16 text-gray-500 text-sm">
          Built with <span className="text-blue-600 font-semibold">React</span> +{" "}
          <span className="text-sky-600 font-semibold">TailwindCSS</span> 💙
        </div>
      </div>
    </div>
  );
}
