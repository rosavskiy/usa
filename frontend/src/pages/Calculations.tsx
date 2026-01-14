import { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Download,
  Trash2,
  FileDown,
  Edit,
  Upload,
} from "lucide-react";
import api from "../api/axios";
import { format } from "date-fns";

export default function Calculations() {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [allCalculations, setAllCalculations] = useState<any[]>([]); // Store all for filtering
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "quarter" | "year" | "all">(
    "all"
  );
  const [downloading, setDownloading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    calcId: number | null;
  }>({ show: false, calcId: null });
  const [deleting, setDeleting] = useState(false);
  const [editModal, setEditModal] = useState<{
    show: boolean;
    calculation: any | null;
  }>({ show: false, calculation: null });
  const [editForm, setEditForm] = useState({
    category: "",
    total_co2e_kg: "",
    period_start: "",
    period_end: "",
  });
  const [saving, setSaving] = useState(false);
  const [replaceModal, setReplaceModal] = useState<{
    show: boolean;
    calcId: number | null;
    docId: number | null;
  }>({ show: false, calcId: null, docId: null });
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all"); // Archive filter

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const response = await api.get("/carbon/calculations");
      const data = response.data.data;
      setAllCalculations(data); // Store all
      setCalculations(data); // Initially show all
      setSelectedIds(data.map((c: any) => c.id));
    } catch (error) {
      console.error("Failed to load calculations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by year when selectedYear changes
  useEffect(() => {
    if (selectedYear === "all") {
      setCalculations(allCalculations);
      setSelectedIds(allCalculations.map((c) => c.id));
    } else {
      const filtered = allCalculations.filter((c) => {
        const year = new Date(c.calculation_date).getFullYear();
        return year === selectedYear;
      });
      setCalculations(filtered);
      setSelectedIds(filtered.map((c) => c.id));
    }
  }, [selectedYear, allCalculations]);

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

  // Group calculations by date
  const groupByDate = (calcs: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: any[][] } = {
      today: [],
      yesterday: [],
    };

    calcs.forEach((calc) => {
      const calcDate = new Date(calc.calculation_date || calc.created_at);
      calcDate.setHours(0, 0, 0, 0);

      if (calcDate.getTime() === today.getTime()) {
        groups.today.push([calc]);
      } else if (calcDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push([calc]);
      } else {
        const dateKey = format(calcDate, "dd.MM.yyyy");
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push([calc]);
      }
    });

    // Group into batches (files uploaded together within 30 seconds)
    Object.keys(groups).forEach((dateKey) => {
      const items = groups[dateKey].flat();
      if (items.length === 0) return;

      items.sort(
        (a, b) =>
          new Date(b.created_at || b.calculation_date).getTime() -
          new Date(a.created_at || a.calculation_date).getTime()
      );

      const batches: any[][] = [];
      let currentBatch: any[] = [items[0]];

      for (let i = 1; i < items.length; i++) {
        const prevTime = new Date(
          items[i - 1].created_at || items[i - 1].calculation_date
        ).getTime();
        const currTime = new Date(
          items[i].created_at || items[i].calculation_date
        ).getTime();

        // If less than 30 seconds apart, same batch
        if (prevTime - currTime < 30000) {
          currentBatch.push(items[i]);
        } else {
          batches.push(currentBatch);
          currentBatch = [items[i]];
        }
      }
      batches.push(currentBatch);

      groups[dateKey] = batches;
    });

    return groups;
  };

  const grouped = groupByDate(calculations);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === calculations.length ? [] : calculations.map((c) => c.id)
    );
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

  const handleDelete = async () => {
    if (!deleteModal.calcId) return;

    try {
      setDeleting(true);
      await api.delete(`/carbon/calculations/${deleteModal.calcId}`);
      setDeleteModal({ show: false, calcId: null });
      // Remove from list and deselect
      setCalculations((prev) =>
        prev.filter((c) => c.id !== deleteModal.calcId)
      );
      setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.calcId));
    } catch (error) {
      console.error("Failed to delete calculation:", error);
      alert("Failed to delete calculation. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async (calcId: number) => {
    try {
      const response = await api.get(`/carbon/calculations/${calcId}/report`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `carbon-report-${calcId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleEditClick = (calc: any) => {
    setEditForm({
      category: calc.category || "",
      total_co2e_kg: calc.total_co2e_kg?.toString() || "",
      period_start: calc.period_start
        ? new Date(calc.period_start).toISOString().split("T")[0]
        : "",
      period_end: calc.period_end
        ? new Date(calc.period_end).toISOString().split("T")[0]
        : "",
    });
    setEditModal({ show: true, calculation: calc });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.calculation) return;

    try {
      setSaving(true);
      await api.put(`/carbon/calculations/${editModal.calculation.id}`, {
        category: editForm.category,
        total_co2e_kg: parseFloat(editForm.total_co2e_kg),
        period_start: editForm.period_start || null,
        period_end: editForm.period_end || null,
      });

      // Reload calculations
      await loadCalculations();
      setEditModal({ show: false, calculation: null });
    } catch (error: any) {
      console.error("Failed to update calculation:", error);
      alert(
        error.response?.data?.error || "Failed to update. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAnnualReport = async (year: number) => {
    try {
      const response = await api.get(`/carbon/annual-report/${year}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `annual-carbon-report-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to download annual report:", error);
      alert(
        error.response?.data?.error ||
          "Failed to download annual report. Please try again."
      );
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/carbon/export-csv", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `carbon-calculations-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export CSV:", error);
      alert(
        error.response?.data?.error || "Failed to export CSV. Please try again."
      );
    }
  };

  const handleReplaceClick = (calc: any) => {
    setReplaceModal({
      show: true,
      calcId: calc.id,
      docId: calc.document?.id || null,
    });
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceModal.docId) return;

    setReplacing(true);

    try {
      // Step 1: Upload new file
      const formData = new FormData();
      formData.append("document", file);

      const uploadResponse = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newDocId = uploadResponse.data.data.id;

      // Step 2: Wait for OCR processing
      let processed = false;
      const maxWait = 30000;
      const interval = 2000;
      let elapsed = 0;

      while (!processed && elapsed < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, interval));
        elapsed += interval;

        const statusResponse = await api.get(`/upload/${newDocId}`);
        if (
          statusResponse.data.data.status === "completed" ||
          statusResponse.data.data.status === "failed"
        ) {
          processed = true;
        }
      }

      // Step 3: Replace document in calculation
      await api.put(`/carbon/calculations/${replaceModal.calcId}/replace`, {
        newDocumentId: newDocId,
      });

      // Step 4: Recalculate emissions
      await api.post("/carbon/calculate", {
        documentId: newDocId,
      });

      // Reload calculations
      await loadCalculations();
      setReplaceModal({ show: false, calcId: null, docId: null });
      alert("✅ Bill replaced successfully!");
    } catch (error: any) {
      console.error("Failed to replace bill:", error);
      alert(
        error.response?.data?.message ||
          "Failed to replace bill. Please try again."
      );
    } finally {
      setReplacing(false);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = "";
      }
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
            <span>{calculations.length} calculations</span>
            {selectedYear !== "all" && (
              <span className="text-blue-600 font-medium">
                (Year {selectedYear})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Archive Filter */}
      {allCalculations.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
            <Calendar size={20} />
            📂 Archive - Filter by Fiscal Year
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedYear("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedYear === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-purple-600 hover:bg-purple-100"
              }`}
            >
              All Years ({allCalculations.length})
            </button>
            {Array.from(
              new Set(
                allCalculations.map((c) =>
                  new Date(c.calculation_date).getFullYear()
                )
              )
            )
              .sort((a, b) => b - a)
              .map((year) => {
                const count = allCalculations.filter(
                  (c) => new Date(c.calculation_date).getFullYear() === year
                ).length;
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedYear === year
                        ? "bg-purple-600 text-white"
                        : "bg-white text-purple-600 hover:bg-purple-100"
                    }`}
                  >
                    {year} ({count})
                  </button>
                );
              })}
          </div>
          <p className="text-xs text-purple-700 mt-3">
            💡 Use this to review past fiscal years for compliance audits and
            historical trend analysis
          </p>
        </div>
      )}

      {/* Download Instructions */}
      {calculations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
            <Download size={20} />
            Download Individual Reports
          </h3>
          <p className="text-sm text-green-800">
            To download an official GHG Protocol report for any calculation,
            click the{" "}
            <span className="font-semibold text-green-600">
              green download button
            </span>{" "}
            (📄) next to that calculation.
          </p>
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
        <div className="space-y-6">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedIds.length === calculations.length}
              onChange={toggleAll}
              className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="font-medium text-gray-700">
              {selectedIds.length === calculations.length
                ? "Deselect All"
                : "Select All"}{" "}
              ({selectedIds.length} selected for report)
            </span>
          </div>

          {/* Render groups */}
          {Object.entries(grouped).map(([dateKey, batches]) => {
            if (batches.length === 0) return null;

            const displayDate =
              dateKey === "today"
                ? "📅 Today"
                : dateKey === "yesterday"
                ? "📅 Yesterday"
                : `📅 ${dateKey}`;

            return (
              <div key={dateKey} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
                  {displayDate}
                </h2>

                {/* Render batches */}
                {batches.map((batch: any[], batchIdx: number) => (
                  <div
                    key={`${dateKey}-batch-${batchIdx}`}
                    className="space-y-3"
                  >
                    {/* Batch separator if not first batch */}
                    {batchIdx > 0 && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        <span className="text-xs text-gray-500 font-medium">
                          Upload Session
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {batch.map((calc) => (
                        <div
                          key={calc.id}
                          className={`card hover:shadow-md transition-shadow ${
                            selectedIds.includes(calc.id)
                              ? "ring-2 ring-primary-500 bg-primary-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(calc.id)}
                              onChange={() => toggleSelection(calc.id)}
                              className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />

                            <div className="flex-1">
                              {/* OCR Warnings */}
                              {calc.document?.parsed_data?.warning && (
                                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 text-xl">
                                      ⚠️
                                    </span>
                                    <div className="text-sm text-yellow-800">
                                      <p>{calc.document.parsed_data.warning}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

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
                                  <p className="text-sm text-gray-600">
                                    Total CO₂e
                                  </p>
                                  <p className="font-bold text-primary-600 text-lg">
                                    {(Number(calc.total_co2e_kg) || 0).toFixed(
                                      2
                                    )}{" "}
                                    kg
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                                <Calendar size={16} />
                                <span>
                                  {calc.period_start &&
                                    format(
                                      new Date(calc.period_start),
                                      "MMM dd, yyyy"
                                    )}
                                  {calc.period_end &&
                                    ` - ${format(
                                      new Date(calc.period_end),
                                      "MMM dd, yyyy"
                                    )}`}
                                </span>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              {/* Replace Bill Button */}
                              <button
                                onClick={() => handleReplaceClick(calc)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Replace with new bill"
                              >
                                <Upload size={20} />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditClick(calc)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit calculation"
                              >
                                <Edit size={20} />
                              </button>

                              {/* Download PDF Button */}
                              <button
                                onClick={() => handleDownloadPDF(calc.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download PDF Report"
                              >
                                <FileDown size={20} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    show: true,
                                    calcId: calc.id,
                                  })
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete calculation"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
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

      {/* Edit Modal */}
      {editModal.show && editModal.calculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ✏️ Edit Calculation
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Natural Gas">Natural Gas</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Propane">Propane</option>
                  <option value="Water">Water</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Total CO2e */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total CO₂e (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.total_co2e_kg}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      total_co2e_kg: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {editModal.calculation.total_co2e_kg} kg CO₂e
                </p>
              </div>

              {/* Period Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Start
                </label>
                <input
                  type="date"
                  value={editForm.period_start}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      period_start: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Period End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period End
                </label>
                <input
                  type="date"
                  value={editForm.period_end}
                  onChange={(e) =>
                    setEditForm({ ...editForm, period_end: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Editing will update the total
                  emissions. Individual gas breakdowns (CO₂, CH₄, N₂O) will be
                  recalculated proportionally.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditModal({ show: false, calculation: null })
                  }
                  disabled={saving}
                  className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              ⚠️ Delete Calculation?
            </h3>
            <p className="text-gray-700 mb-6">
              This will permanently delete this carbon calculation. This action{" "}
              <strong>cannot be undone</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, calcId: null })}
                disabled={deleting}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Bill Modal */}
      {replaceModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              🔄 Replace Bill
            </h3>
            <p className="text-gray-700 mb-4">
              Upload a new bill file to replace the current one. The calculation
              will be automatically recalculated.
            </p>
            <div className="mb-6">
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleReplaceFile}
                disabled={replacing}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PNG, JPG, PDF (up to 10MB)
              </p>
            </div>
            {replacing && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>
                  ⏳ Processing new bill... This may take 10-30 seconds.
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setReplaceModal({ show: false, calcId: null, docId: null })
                }
                disabled={replacing}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
