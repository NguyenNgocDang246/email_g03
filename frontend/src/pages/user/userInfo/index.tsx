import { useQuery } from "@tanstack/react-query";
import { accessTokenMemory as accessToken } from "../../../api/baseAPI";
import { getUserInfo } from "../../../api/user";
import { useNavigate } from "react-router-dom";

export default function UserInfo() {
  const navigate = useNavigate();

  if (!accessToken) {
    navigate("/login"); // nếu chưa login → redirect
    return null;
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["userInfo"], // đây là bắt buộc
    queryFn: () => getUserInfo(),
    enabled: !!accessToken, // chỉ gọi khi accessToken tồn tại
  });

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">Error loading user info</p>;

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow-lg text-center">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">User Info</h2>
      <p>
        <strong>ID:</strong> {data?._id}
      </p>
      <p>
        <strong>Email:</strong> {data?.email}
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg"
      >
        Back to Home
      </button>
    </div>
  );
}
