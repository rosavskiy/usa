import { useState, useEffect } from "react";
import { Calculator, TrendingDown, AlertCircle, Zap, Factory } from "lucide-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ManualInput() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "electricity",
    consumption: "",
    unit: "kWh",
    date: new Date().toISOString().split("T")[0],
    provider: "",
    amount: "",
    state: "", // for electricity emission factor
    // F-gases (industrial greenhouse gases)
    hfcs_kg: "",
    pfcs_kg: "",
    sf6_kg: "",
    other_kg: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Create manual document
      const docResponse = await api.post("/upload/manual", {
        type: formData.type,
        provider: formData.provider,
        date: formData.date,
        amount: parseFloat(formData.amount) || 0,
        state: formData.state || null, // for regional electricity factors
        consumption: {
          value: parseFloat(formData.consumption),
          unit: formData.unit,
        },
        period: {
          start: formData.date,
          end: formData.date,
        },
      });

      // Calculate emissions
      await api.post("/carbon/calculate", {
        documentId: docResponse.data.data.id,
        // Include F-gases if provided
        hfcsKg: parseFloat(formData.hfcs_kg) || 0,
        pfcsKg: parseFloat(formData.pfcs_kg) || 0,
        sf6Kg: parseFloat(formData.sf6_kg) || 0,
        otherKg: parseFloat(formData.other_kg) || 0,
      });

      alert("✅ Calculation completed! View results in Calculations page.");
      navigate("/calculations");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to calculate emissions");
    } finally {
      setLoading(false);
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator size={24} className="text-primary-600" strokeWidth={2} />
          <h1 className="text-2xl font-medium text-gray-900">
            Manual Data Entry
          </h1>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <TrendingDown
            className="text-primary-600 mt-0.5"
            size={18}
            strokeWidth={2}
          />
          <div>
            <h3 className="font-medium text-primary-900 mb-1">
              Don't have a bill? Enter data manually
            </h3>
            <p className="text-sm text-primary-700">
              Input your energy consumption directly to calculate carbon
              emissions
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm space-y-6"
      >
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Energy Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value;
              let newUnit = "kWh";

              if (newType === "gas") newUnit = "m³";
              if (newType === "fuel") newUnit = "gallons";

              setFormData({ ...formData, type: newType, unit: newUnit });
            }}
            className="input-field"
            required
          >
            <option value="electricity">Electricity</option>
            <option value="gas">Natural Gas</option>
            <option value="fuel">Fuel (Gasoline/Diesel)</option>
          </select>
        </div>

        {/* Consumption */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consumption *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.consumption}
              onChange={(e) =>
                setFormData({ ...formData, consumption: e.target.value })
              }
              className="input-field"
              placeholder="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              className="input-field"
            >
              {formData.type === "electricity" && (
                <>
                  <option value="kWh">kWh</option>
                  <option value="MWh">MWh</option>
                </>
              )}
              {formData.type === "gas" && (
                <>
                  <option value="m³">m³ (cubic meters)</option>
                  <option value="therms">Therms</option>
                  <option value="MMBtu">MMBtu</option>
                </>
              )}
              {formData.type === "fuel" && (
                <>
                  <option value="gallons">Gallons</option>
                  <option value="liters">Liters</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* State (for electricity only) */}
        {formData.type === "electricity" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State (for accurate emission factor) *
            </label>
            <input
              type="text"
              list="states"
              value={formData.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  state: e.target.value.toUpperCase(),
                })
              }
              className="input-field"
              placeholder="Type or select state (e.g., CA, Texas)"
              required={formData.type === "electricity"}
            />
            <datalist id="states">
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="IL">Illinois</option>
              <option value="PA">Pennsylvania</option>
              <option value="OH">Ohio</option>
              <option value="GA">Georgia</option>
              <option value="NC">North Carolina</option>
              <option value="MI">Michigan</option>
              <option value="MA">Massachusetts</option>
              <option value="OR">Oregon</option>
              <option value="WA">Washington</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="RI">Rhode Island</option>
              <option value="VT">Vermont</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="NJ">New Jersey</option>
              <option value="VA">Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="MN">Minnesota</option>
              <option value="AZ">Arizona</option>
              <option value="NV">Nevada</option>
              <option value="NM">New Mexico</option>
              <option value="WV">West Virginia</option>
            </datalist>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Zap size={14} className="text-primary-600" />
              Each state has different electricity emission factors
              (0.01-0.72 kg CO₂e/kWh). Gas & Fuel are universal.
            </p>
          </div>
        )}

        {/* Provider and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider / Source
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              className="input-field"
              placeholder="e.g., PG&E, Chevron"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Cost (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Cost (USD) - Optional
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="input-field"
            placeholder="150.00"
          />
        </div>

        {/* F-gases (Industrial Greenhouse Gases) */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-base font-medium text-primary-600 mb-2 flex items-center gap-2">
            <Factory size={20} className="text-primary-600" />
            Industrial Greenhouse Gases
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            For refrigeration equipment, air conditioning systems, electrical
            equipment, or industrial processes
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HFCs (kg)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.hfcs_kg}
                onChange={(e) =>
                  setFormData({ ...formData, hfcs_kg: e.target.value })
                }
                className="input-field"
                placeholder="0.000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Refrigerants, AC systems
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PFCs (kg)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.pfcs_kg}
                onChange={(e) =>
                  setFormData({ ...formData, pfcs_kg: e.target.value })
                }
                className="input-field"
                placeholder="0.000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Aluminum, semiconductors
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SF₆ (kg)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.sf6_kg}
                onChange={(e) =>
                  setFormData({ ...formData, sf6_kg: e.target.value })
                }
                className="input-field"
                placeholder="0.000"
              />
              <p className="text-xs text-gray-500 mt-1">Electrical equipment</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other F-gases (kg)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.other_kg}
                onChange={(e) =>
                  setFormData({ ...formData, other_kg: e.target.value })
                }
                className="input-field"
                placeholder="0.000"
              />
              <p className="text-xs text-gray-500 mt-1">NF₃, other gases</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
        >
          <Calculator size={18} strokeWidth={2} />
          {loading ? "Calculating..." : "Calculate Emissions"}
        </button>
      </form>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-5">
        <h3 className="font-medium text-primary-900 mb-3 flex items-center gap-2">
          <AlertCircle size={18} strokeWidth={2} className="text-primary-600" />
          Common Conversions
        </h3>
        <ul className="text-sm text-primary-800 space-y-2">
          <li>• 1 therm = 29.3 kWh (for natural gas)</li>
          <li>• 1 gallon = 3.785 liters</li>
          <li>• 1 MWh = 1,000 kWh</li>
          <li>• Average US home: ~900 kWh/month electricity</li>
        </ul>
      </div>
    </div>
  );
}
