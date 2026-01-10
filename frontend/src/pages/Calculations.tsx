import { useState, useEffect } from "react";
import { BarChart3, Calendar, TrendingUp, Download } from "lucide-react";
import api from "../api/axios";
import { format } from "date-fns";

export default function Calculations() {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "quarter" | "year" | "all">(
    "all"
  );
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const response = await api.get("/carbon/calculations");
      setCalculations(response.data.data);
    } catch (error) {
      console.error("Failed to load calculations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case "scope1":
        return "bg-red-100 text-red-700";
      case "scope2":
        return "bg-yellow-100 text-yellow-700";
      case "scope3":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const params = period !== "all" ? `?period=${period}` : "";

      const response = await api.get(`/carbon/export${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `carbon-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading calculations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Carbon Calculations
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 size={20} />
            <span>{calculations.length} total calculations</span>
          </div>
        </div>
      </div>

      {/* Export controls */}
      {calculations.length > 0 && (
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">
                📄 Export Official Report
              </h3>
              <p className="text-sm text-gray-600">
                Generate PDF report compliant with GHG Protocol, EPA & ISO
                14064-1
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>

              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Download size={20} />
                {downloading ? "Generating..." : "Download Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {calculations.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No calculations yet
          </h3>
          <p className="text-gray-500">
            Upload your first bill to see carbon calculations here
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold capitalize">
                      {calc.category}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(
                        calc.emission_type
                      )}`}
                    >
                      {calc.emission_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">CO₂</p>
                      <p className="font-bold text-gray-900">
                        {(Number(calc.co2_kg) || 0).toFixed(2)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CH₄</p>
                      <p className="font-bold text-gray-900">
                        {(Number(calc.ch4_kg) || 0).toFixed(3)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">N₂O</p>
                      <p className="font-bold text-gray-900">
                        {(Number(calc.n2o_kg) || 0).toFixed(3)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total CO₂e</p>
                      <p className="font-bold text-primary-600 text-lg">
                        {(Number(calc.total_co2e_kg) || 0).toFixed(2)} kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>
                      {calc.period_start &&
                        format(new Date(calc.period_start), "MMM dd, yyyy")}
                      {calc.period_end &&
                        ` - ${format(
                          new Date(calc.period_end),
                          "MMM dd, yyyy"
                        )}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {calculations.length > 0 && (
        <div className="card bg-green-50 border-green-200">
          <h3 className="font-bold text-green-900 mb-2">
            📊 Understanding your emissions:
          </h3>
          <ul className="space-y-1 text-sm text-green-800">
            <li>
              • <strong>Scope 1:</strong> Direct emissions (natural gas, company
              vehicles)
            </li>
            <li>
              • <strong>Scope 2:</strong> Indirect emissions from purchased
              electricity
            </li>
            <li>
              • <strong>Scope 3:</strong> Other indirect emissions (supply
              chain, business travel)
            </li>
            <li>
              • <strong>CO₂e:</strong> Carbon dioxide equivalent (includes CH₄
              and N₂O impact)
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
