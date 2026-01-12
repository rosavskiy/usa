import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/login?error=" + error);
      return;
    }

    if (token) {
      // Save token and redirect to dashboard
      localStorage.setItem("token", token);
      setToken(token);
      navigate("/");
    } else {
      navigate("/login?error=no_token");
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
