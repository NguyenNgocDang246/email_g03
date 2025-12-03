import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { MailIcon } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  // const { setUser } = useAuth();

  const login = useAuthStore((s: any) => s.login);
  const loginGoogle = useAuthStore((s: any) => s.loginGoogle);
  const isLoading = useAuthStore((s: any) => s.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setMessage(null);
    try {
      await login(values);
      navigate("/");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center">
      {/* Left image */}
      <div className="w-3/5 flex flex-col justify-center items-center p-6">
        <MailIcon
          className="w-48 h-48 text-gray-400 hover:text-white"
          onClick={() => navigate("/")}
        />
        <div>
          <h1 className="text-gray-400 font-bold text-6xl">Mail Manage</h1>
        </div>
      </div>

      {/* Right form */}
      <div className="w-2/5 flex justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-6xl text-white font-bold mb-3">Login</h1>
          <h2 className="text-2xl font-medium text-white mb-10">
            Welcome back! Please login to your account.
          </h2>

          {/* Google Login */}
          <button
            className="border cursor-pointer hover:bg-blue-900 text-white w-full mt-4 py-2.5 rounded-lg transition disabled:opacity-70"
            onClick={() => loginGoogle()}
          >
            Login With Google
          </button>
          <div>
            <h1 className="text-xl text-white text-center my-5">OR</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm text-white font-medium mb-2">Email address</label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Invalid email address",
                  },
                })}
                className="w-full px-4 py-3 bg-[#1e293b] text-white rounded-xl border border-[#334155] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                })}
                className="w-full px-4 py-3 bg-[#1e293b] text-white rounded-xl border border-[#334155] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-600 text-white font-medium rounded-xl"
            >
              {isLoading ? "Logging in..." : "Sign in"}
            </button>

            {/* Links */}
            <div className="flex justify-between">
              <Link to="/signup" className="text-sm text-white hover:text-purple-300">
                Don't have account
              </Link>
              <Link to="/forgot-password" className="text-sm text-white hover:text-purple-300">
                Forgot Password
              </Link>
            </div>

            {/* Message */}
            {message && (
              <p
                className={`mt-4 text-center font-medium ${
                  message.startsWith("Error") ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
