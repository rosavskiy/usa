import { useState, useEffect } from "react";
import api from "../api/axios";

interface UserProfile {
  id: number;
  email: string;
  company_name: string;
  state: string | null;
  industry: string | null;
  currency: string | null;
  unit_system: string | null;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    state: "",
    industry: "",
    currency: "USD",
    unitSystem: "Imperial",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/settings/profile");
      setProfile(response.data);
      setFormData({
        companyName: response.data.company_name || "",
        state: response.data.state || "",
        industry: response.data.industry || "",
        currency: response.data.currency || "USD",
        unitSystem: response.data.unit_system || "Imperial",
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.put("/settings/profile", formData);
      setMessage({ type: "success", text: "Profile updated successfully" });
      fetchProfile();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Company Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select State</option>
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
                <option value="NJ">New Jersey</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="AZ">Arizona</option>
                <option value="MA">Massachusetts</option>
                <option value="TN">Tennessee</option>
                <option value="IN">Indiana</option>
                <option value="MO">Missouri</option>
                <option value="MD">Maryland</option>
                <option value="WI">Wisconsin</option>
                <option value="CO">Colorado</option>
                <option value="MN">Minnesota</option>
                <option value="SC">South Carolina</option>
                <option value="AL">Alabama</option>
                <option value="LA">Louisiana</option>
                <option value="KY">Kentucky</option>
                <option value="OR">Oregon</option>
                <option value="OK">Oklahoma</option>
                <option value="CT">Connecticut</option>
                <option value="UT">Utah</option>
                <option value="IA">Iowa</option>
                <option value="NV">Nevada</option>
                <option value="AR">Arkansas</option>
                <option value="MS">Mississippi</option>
                <option value="KS">Kansas</option>
                <option value="NM">New Mexico</option>
                <option value="NE">Nebraska</option>
                <option value="WV">West Virginia</option>
                <option value="ID">Idaho</option>
                <option value="HI">Hawaii</option>
                <option value="NH">New Hampshire</option>
                <option value="ME">Maine</option>
                <option value="RI">Rhode Island</option>
                <option value="MT">Montana</option>
                <option value="DE">Delaware</option>
                <option value="SD">South Dakota</option>
                <option value="ND">North Dakota</option>
                <option value="AK">Alaska</option>
                <option value="VT">Vermont</option>
                <option value="WY">Wyoming</option>
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Industry</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
                <option value="Construction">Construction</option>
                <option value="Transportation">Transportation</option>
                <option value="Energy">Energy</option>
                <option value="Education">Education</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Professional Services">
                  Professional Services
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            {/* Unit System */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit System
              </label>
              <select
                name="unitSystem"
                value={formData.unitSystem}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Imperial">
                  Imperial (kWh, therms, gallons)
                </option>
                <option value="Metric">Metric (kWh, m³, liters)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}