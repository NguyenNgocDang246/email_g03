import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { loginUser, loginWithGoogle } from "../../../api/user";
import { useAuth } from "../../../contexts/authContext";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const { setUser } = useAuth();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser(data.data);
      setMessage(`Welcome back, ${data.data.email}!`);
      navigate("/"); // điều hướng về Home
    },
    onError: (error: any) => {
      setMessage(`Error: ${error.message || "Login failed"}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setMessage(null);
    await mutation.mutateAsync(values);
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 w-[400px] bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl mb-6 text-center font-bold text-blue-700">Welcome back</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Invalid email address",
              },
            })}
            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition disabled:opacity-70"
        >
          {mutation.isPending ? "Logging in..." : "Log In"}
        </button>
      </form>
      <button
        className="border cursor-pointer hover:bg-blue-200 w-full mt-4 py-2.5 rounded-lg transition disabled:opacity-70"
        onClick={loginWithGoogle}
      >
        Login With Google
      </button>

      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{" "}
        <Link to="/signup" className="text-blue-600 hover:underline font-medium">
          Register here
        </Link>
      </p>

      <div className="flex justify-center mt-4">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-gray-600 hover:text-blue-600 underline"
        >
          ← Back to Home
        </button>
      </div>

      {message && (
        <p
          className={`mt-4 text-center font-medium ${
            message.startsWith("Error") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
