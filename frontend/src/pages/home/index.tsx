import { NavLink, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Home as HomeIcon, LogOut } from "lucide-react";
import { setAccessToken, accessTokenMemory as accessToken } from "../../api/baseAPI";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    navigate("/"); // quay về home
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-linear-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav className="w-full bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xl">
            <HomeIcon size={22} />
            <span>MyApp</span>
          </div>

          <div className="flex gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? "text-blue-700 underline underline-offset-4"
                    : "text-gray-600 hover:text-blue-600"
                }`
              }
            >
              Home
            </NavLink>
            {!accessToken && (
              <>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `text-sm font-medium transition ${
                      isActive
                        ? "text-blue-700 underline underline-offset-4"
                        : "text-gray-600 hover:text-blue-600"
                    }`
                  }
                >
                  Sign Up
                </NavLink>

                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `text-sm font-medium transition ${
                      isActive
                        ? "text-blue-700 underline underline-offset-4"
                        : "text-gray-600 hover:text-blue-600"
                    }`
                  }
                >
                  Login
                </NavLink>
              </>
            )}

            {accessToken && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center grow px-4 text-center mt-12">
        <div className="bg-white shadow-xl rounded-2xl p-10 max-w-lg w-full">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to <span className="text-blue-600">MyApp</span>
          </h1>
          <p className="text-gray-600 mb-8">
            Join our community and start exploring amazing features today.
          </p>

          {!accessToken && (
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

          {accessToken && (
            <button
              onClick={() => navigate("/user-info")}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition"
            >
              Go to User Info
            </button>
          )}

          {accessToken && (
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
