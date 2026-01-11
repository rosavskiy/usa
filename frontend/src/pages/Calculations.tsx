import { useState, useEffect } from "react";
import { BarChart3, Calendar, TrendingUp, Download, Trash2 } from "lucide-react";
import api from "../api/axios";
import { format } from "date-fns";

export default function Calculations() {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "quarter" | "year" | "all">(
    "all"
  );
  const [downloading, setDownloading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; calcId: number | null }>({ show: false, calcId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const response = await api.get("/carbon/calculations");
      setCalculations(response.data.data);
      // Select all by default
      setSelectedIds(response.data.data.map((c: any) => c.id));
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
      
      items.sort((a, b) => new Date(b.created_at || b.calculation_date).getTime() - new Date(a.created_at || a.calculation_date).getTime());
      
      const batches: any[][] = [];
      let currentBatch: any[] = [items[0]];
      
      for (let i = 1; i < items.length; i++) {
        const prevTime = new Date(items[i - 1].created_at || items[i - 1].calculation_date).getTime();
        const currTime = new Date(items[i].created_at || items[i].calculation_date).getTime();
        
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(prev =>
      prev.length === calculations.length ? [] : calculations.map(c => c.id)
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
      setCalculations(prev => prev.filter(c => c.id !== deleteModal.calcId));
      setSelectedIds(prev => prev.filter(id => id !== deleteModal.calcId));
    } catch (error) {
      console.error("Failed to delete calculation:", error);
      alert("Failed to delete calculation. Please try again.");
    } finally {
      setDeleting(false);
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
              {selectedIds.length === calculations.length ? 'Deselect All' : 'Select All'} ({selectedIds.length} selected for report)
            </span>
          </div>

          {/* Render groups */}
          {Object.entries(grouped).map(([dateKey, batches]) => {
            if (batches.length === 0) return null;
            
            const displayDate = 
              dateKey === 'today' ? '📅 Today' :
              dateKey === 'yesterday' ? '📅 Yesterday' :
              `📅 ${dateKey}`;

            return (
              <div key={dateKey} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
                  {displayDate}
                </h2>
                
                {/* Render batches */}
                {batches.map((batch: any[], batchIdx: number) => (
                  <div key={`${dateKey}-batch-${batchIdx}`} className="space-y-3">
                    {/* Batch separator if not first batch */}
                    {batchIdx > 0 && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        <span className="text-xs text-gray-500 font-medium">Upload Session</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      </div>
                    )}
                    
                    <div className="grid gap-4">
                      {batch.map((calc) => (
                    <div
                      key={calc.id}
                      className={`card hover:shadow-md transition-shadow ${
                        selectedIds.includes(calc.id) ? 'ring-2 ring-primary-500 bg-primary-50' : ''
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
                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteModal({ show: true, calcId: calc.id })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete calculation"
                        >
                          <Trash2 size={20} />
                        </button>              </div>
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              ⚠️ Delete Calculation?
            </h3>
            <p className="text-gray-700 mb-6">
              This will permanently delete this carbon calculation. This action <strong>cannot be undone</strong>.
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
    </div>
  );
}
