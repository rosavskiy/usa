import { useState, useEffect } from "react";
import { Users, Shield, Search, LogIn } from "lucide-react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  email: string;
  company_name: string;
  created_at: string;
  last_login: string;
  last_active: string;
  uploads_count: number;
  downloads_count: number;
  credits: number;
  credits_spent: number;
  credits_purchased: number;
  is_admin: boolean;
  is_super: boolean;
  is_blocked: boolean;
}

interface ActivityLog {
  id: number;
  user_email: string;
  action: string;
  timestamp: string;
  details: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/admin/users", {
        params: { search: searchQuery },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get("/admin/activities");
      setActivities(response.data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const toggleAdmin = async (userId: number, currentValue: boolean) => {
    try {
      await axios.patch(`/admin/users/${userId}`, { is_admin: !currentValue });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update admin status:", error);
    }
  };

  const toggleSuper = async (userId: number, currentValue: boolean) => {
    try {
      await axios.patch(`/admin/users/${userId}`, { is_super: !currentValue });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update super status:", error);
    }
  };

  const updateCredits = async (userId: number, credits: number) => {
    try {
      await axios.patch(`/admin/users/${userId}`, { credits });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update credits:", error);
    }
  };

  const blockUser = async (userId: number, permanent: boolean) => {
    try {
      await axios.post(`/admin/users/${userId}/block`, { permanent });
      fetchUsers();
    } catch (error) {
      console.error("Failed to block user:", error);
    }
  };

  const loginAsUser = async (userId: number) => {
    try {
      const response = await axios.post(`/admin/login-as/${userId}`);
      const { token } = response.data;
      await setToken(token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to login as user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Users ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Registration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Uploads
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Downloads
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Spent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Purchased
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Super
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={user.is_blocked ? "bg-red-50" : ""}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.company_name || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.uploads_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.downloads_count}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={user.credits}
                        onChange={(e) =>
                          updateCredits(user.id, parseInt(e.target.value))
                        }
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.credits_spent || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.credits_purchased || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.is_admin}
                        onChange={() => toggleAdmin(user.id, user.is_admin)}
                        className="w-4 h-4 text-primary-500 accent-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.is_super}
                        onChange={() => toggleSuper(user.id, user.is_super)}
                        className="w-4 h-4 text-primary-500 accent-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => blockUser(user.id, false)}
                          className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                          title="Temporary Block"
                        >
                          Temp
                        </button>
                        <button
                          onClick={() => blockUser(user.id, true)}
                          className="px-3 py-1 text-xs bg-primary-200 text-gray-800 rounded hover:bg-primary-300"
                          title="Permanent Block"
                        >
                          Perm
                        </button>
                        <button
                          onClick={() => loginAsUser(user.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-primary-400 text-white rounded hover:bg-primary-500"
                          title="Login as this user"
                        >
                          <LogIn className="w-3 h-3" />
                          Login As
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity Log
            </h2>
          </div>
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <span className="text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                  {" — "}
                  <span className="font-medium">{activity.user_email}</span>
                  {" — "}
                  <span className="text-gray-700">{activity.action}</span>
                  {activity.details && (
                    <>
                      {" - "}
                      <span className="text-gray-600">{activity.details}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
