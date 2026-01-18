import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingDown,
  Leaf,
  FileText,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadStats();
    loadProfile();

    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      loadStats();
      loadProfile();
      loadActivePeriod();
    }, 3000);

    // Refresh when window gets focus
    const handleFocus = () => {
      loadStats();
      loadProfile();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get("/settings/profile");
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadActivePeriod = async () => {
    try {
      const response = await api.get("/reporting-periods/active");
      setActivePeriod(response.data);
    } catch (error) {
      console.error("Failed to load active period:", error);
    }
  };

  const loadStats = async () => {
    try {
      const [calcsRes, docsRes] = await Promise.all([
        api.get("/carbon/calculations"),
        api.get("/upload"),
      ]);

      const calculations = calcsRes.data.data || [];
      const documents = docsRes.data.data || [];

      console.log("📊 Dashboard Data:");
      console.log("Calculations:", calculations);
      console.log("First calc:", calculations[0]);
      console.log("Documents:", documents);

      // Calculate totals
      const totalEmissions = calculations.reduce((sum: number, c: any) => {
        const emission = Number(
          c.total_co2e_kg || c.totalCo2eKg || c.total_co2_kg || 0,
        );
        console.log("Adding emission:", emission, "from", c);
        return sum + emission;
      }, 0);
      console.log("Total Emissions calculated:", totalEmissions);

      // Calculate average emissions per document
      const avgEmissions =
        calculations.length > 0 ? totalEmissions / calculations.length : 0;

      // Group by category
      const byCategory = calculations.reduce((acc: any, c: any) => {
        const category = c.category || "other";
        const emission = Number(
          c.total_co2e_kg || c.totalCo2eKg || c.total_co2_kg || 0,
        );
        acc[category] = (acc[category] || 0) + emission;
        return acc;
      }, {});

      console.log("By Category Raw:", byCategory);
      const byCategoryArray = Object.entries(byCategory).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );
      console.log("By Category Array:", byCategoryArray);

      setStats({
        totalEmissions,
        avgEmissions,
        totalDocuments: documents.length,
        byCategory: byCategoryArray,
        recentCalculations: calculations.slice(0, 5),
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      // Set empty stats on error
      setStats({
        totalEmissions: 0,
        avgEmissions: 0,
        totalDocuments: 0,
        byCategory: [],
        recentCalculations: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Check if profile is incomplete
  const isProfileIncomplete = profile && (!profile.address || !profile.phone);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPeriodLabel = (type: string) => {
    switch (type) {
      case "annual":
        return "Annual";
      case "quarterly":
        return "Quarterly";
      case "monthly":
        return "Monthly";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Warning for incomplete profile */}
      {isProfileIncomplete && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle
              className="text-orange-400 mt-0.5 mr-3 flex-shrink-0"
              size={24}
            />
            <div>
              <h3 className="text-orange-800 font-semibold mb-1">
                Complete Your Profile for Full GHG Reports
              </h3>
              <p className="text-orange-700 text-sm mb-2">
                To generate complete GHG Protocol reports, please add your
                company address and phone number in Settings.
              </p>
              <Link
                to="/settings"
                className="inline-block text-sm font-medium text-orange-800 hover:text-orange-900 underline"
              >
                Go to Settings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Emissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {(Number(stats?.avgEmissions) || 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">kg CO₂e per document</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Leaf className="text-primary-600" size={32} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents Processed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalDocuments || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">uploaded & parsed</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Emissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {(Number(stats?.totalEmissions) || 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">kg CO₂e total</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <BarChart3 className="text-green-600" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions by Category */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={24} />
            Emissions by Category
          </h2>
          {stats?.byCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) =>
                    `${name}: ${(Number(value) || 0).toFixed(1)} kg`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byCategory.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No data yet. Upload your first bill!
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Calculations</h2>
          {stats?.recentCalculations?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentCalculations.map((calc: any) => (
                <div
                  key={calc.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{calc.category}</p>
                    <p className="text-sm text-gray-500">
                      {calc.emission_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">
                      {(Number(calc.total_co2e_kg) || 0).toFixed(2)} kg
                    </p>
                    <p className="text-xs text-gray-500">CO₂e</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No calculations yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
