import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { registerUser } from "../../../api/user";
import { MailIcon } from "lucide-react";

interface RegisterFormValues {
  email: string;
  password: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setMessage(`Registered successfully, ${data.data.email}!`);
      navigate("/login");
    },
    onError: (error: any) => {
      setMessage(`Error: ${error.message || "Registration failed"}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormValues>({
    mode: "onChange", // validate ngay khi người dùng nhập
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setMessage(null);
    await mutation.mutateAsync(values);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center">
      {/* Left icon */}
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
          <h1 className="text-6xl text-white font-bold mb-3">Sign Up</h1>
          <h2 className="text-2xl font-medium text-white mb-10">
            Create your account to get started.
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm text-white font-medium mb-2">
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
                className="w-full px-4 py-3 bg-[#1e293b] text-white rounded-xl border border-[#334155] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
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
              <label className="block text-sm text-white font-medium mb-2">
                Password
              </label>
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
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting || mutation.isPending} // disable nếu form chưa hợp lệ
              className="w-full py-3 bg-blue-900 hover:bg-blue-600 text-white font-medium rounded-xl transition disabled:opacity-70"
            >
              {mutation.isPending ? "Registering..." : "Sign Up"}
            </button>

            {/* Links */}
            <div className="flex justify-between">
              <Link
                to="/login"
                className="text-sm text-white hover:text-purple-300"
              >
                Already have account
              </Link>
              <button
                onClick={() => navigate("/")}
                className="text-sm text-white hover:text-purple-300 underline"
                type="button"
              >
                ← Back to Home
              </button>
            </div>

            {/* Message */}
            {message && (
              <p
                className={`mt-4 text-center font-medium ${
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
