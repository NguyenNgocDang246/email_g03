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

  const login = useAuthStore((s) => s.login);
  const loginGoogle = useAuthStore((s) => s.loginGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center md:justify-start">
      {/* ================= LEFT (HIDDEN ON MOBILE) ================= */}
      <div className="hidden md:flex md:w-3/5 flex-col justify-center items-center md:p-4">
        <MailIcon
          className="md:w-36 md:h-36 xl:w-48 xl:h-48 2xl:w-96 2xl:h-96 text-gray-400 hover:text-white cursor-pointer"
          onClick={() => navigate("/")}
        />
        <h1 className="text-gray-400 font-bold md:text-4xl xl:text-6xl 2xl:text-9xl mt-4">
          Mail Manage
        </h1>
      </div>

      {/* ================= RIGHT FORM ================= */}
      <div className="w-full md:w-2/5 flex justify-center px-6 md:px-0 md:mr-16 xl:mr-24 2xl:mr-48">
        <div className="w-full max-w-md md:max-w-none">
          <h1 className="text-3xl md:text-4xl xl:text-6xl 2xl:text-9xl mb-3 2xl:mb-9 text-white font-bold">
            Login
          </h1>

          <h2 className="text-base md:text-xl xl:text-2xl 2xl:text-4xl font-medium text-white mb-10">
            Welcome back! Please login to your account.
          </h2>

          {/* Google Login */}
          <button
            onClick={() => loginGoogle()}
            className="border cursor-pointer hover:bg-blue-900 text-white w-full mt-4 py-2.5 2xl:mt-8 2xl:py-5 2xl:text-4xl rounded-lg transition disabled:opacity-70"
          >
            Login With Google
          </button>

          <h1 className="text-base md:text-lg xl:text-xl 2xl:text-4xl text-white text-center my-5">
            OR
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm 2xl:text-4xl text-white font-medium mb-2 2xl:mb-8">
                Email address
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Invalid email address",
                  },
                })}
                className="w-full px-4 py-3 2xl:py-6 2xl:text-4xl bg-[#1e293b] text-white rounded-xl border border-[#334155] focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm 2xl:text-4xl text-white font-medium mb-2 2xl:mb-8">
                Password
              </label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                })}
                className="w-full px-4 py-3 2xl:py-6 2xl:text-4xl bg-[#1e293b] text-white rounded-xl border border-[#334155] focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm 2xl:text-4xl mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 2xl:py-6 2xl:text-4xl bg-blue-900 hover:bg-blue-600 text-white font-medium rounded-xl transition disabled:opacity-70"
            >
              {isLoading ? "Logging in..." : "Sign in"}
            </button>

            {/* Links */}
            <div className="flex justify-between">
              <Link
                to="/signup"
                className="text-sm 2xl:text-4xl text-white hover:text-purple-300"
              >
                Don't have account
              </Link>
              <Link
                to="/forgot-password"
                className="text-sm 2xl:text-4xl text-white hover:text-purple-300"
              >
                Forgot Password
              </Link>
            </div>

            {/* Message */}
            {message && (
              <p
                className={`mt-4 text-center font-medium 2xl:text-4xl ${
                  message.startsWith("Error")
                    ? "text-red-600"
                    : "text-green-600"
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
