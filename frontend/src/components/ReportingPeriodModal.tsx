import { useState, useEffect } from "react";
import { X, Calendar, Plus } from "lucide-react";
import api from "../api/axios";

interface ReportingPeriod {
  id: number;
  period_type: "monthly" | "quarterly" | "annual";
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Props {
  onClose: () => void;
  onPeriodCreated: () => void;
}

export default function ReportingPeriodModal({
  onClose,
  onPeriodCreated,
}: Props) {
  const [periodType, setPeriodType] = useState<
    "monthly" | "quarterly" | "annual"
  >("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPeriods, setExistingPeriods] = useState<ReportingPeriod[]>([]);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const response = await api.get("/reporting-periods");
      setExistingPeriods(response.data);
    } catch (err) {
      console.error("Failed to load periods:", err);
    }
  };

  const handlePeriodTypeChange = (type: "monthly" | "quarterly" | "annual") => {
    setPeriodType(type);

    const today = new Date();
    const year = today.getFullYear();

    if (type === "annual") {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    } else if (type === "quarterly") {
      const quarter = Math.floor(today.getMonth() / 3);
      const qStartMonth = quarter * 3;
      const qEndMonth = qStartMonth + 2;
      setStartDate(`${year}-${String(qStartMonth + 1).padStart(2, "0")}-01`);
      const lastDay = new Date(year, qEndMonth + 1, 0).getDate();
      setEndDate(
        `${year}-${String(qEndMonth + 1).padStart(2, "0")}-${lastDay}`,
      );
    } else {
      const month = today.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      setStartDate(`${year}-${String(month + 1).padStart(2, "0")}-01`);
      setEndDate(`${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before end date");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reporting-periods", {
        period_type: periodType,
        start_date: startDate,
        end_date: endDate,
      });

      onPeriodCreated();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create reporting period",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPeriod = async (periodId: number) => {
    try {
      await api.put(`/reporting-periods/${periodId}/activate`);
      onPeriodCreated();
      onClose();
    } catch (err) {
      console.error("Failed to activate period:", err);
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Select Reporting Period
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Periods */}
          {existingPeriods.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Existing Periods
              </h3>
              <div className="space-y-2">
                {existingPeriods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => handleSelectPeriod(period.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      period.is_active
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {getPeriodLabel(period.period_type)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {formatDate(period.start_date)} -{" "}
                          {formatDate(period.end_date)}
                        </div>
                      </div>
                      {period.is_active && (
                        <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Period */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Plus size={20} className="mr-2" />
              Create New Period
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["monthly", "quarterly", "annual"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handlePeriodTypeChange(type)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        periodType === type
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {getPeriodLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus size={20} className="mr-2" />
                    Create & Activate Period
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
