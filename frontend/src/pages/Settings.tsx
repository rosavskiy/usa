import { useState, useEffect } from "react";
import api from "../api/axios";
import { Upload, X } from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  company_name: string;
  state: string | null;
  industry: string | null;
  currency: string | null;
  unit_system: string | null;
  address: string | null;
  phone: string | null;
  logo_path: string | null;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
    address: "",
    phone: "",
    logoPath: "",
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
        address: response.data.address || "",
        phone: response.data.phone || "",
        logoPath: response.data.logo_path || "",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(png|jpg|jpeg|svg\+xml)/)) {
      setMessage({
        type: "error",
        text: "Please upload a PNG, JPG, JPEG, or SVG file",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Logo file size must be less than 2MB",
      });
      return;
    }

    setUploadingLogo(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post("/settings/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({ type: "success", text: "Logo uploaded successfully" });
      fetchProfile();
    } catch (error: any) {
      console.error("Failed to upload logo:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to upload logo",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm("Are you sure you want to delete the company logo?")) return;

    try {
      await api.delete("/settings/logo");
      setMessage({ type: "success", text: "Logo deleted successfully" });
      fetchProfile();
    } catch (error: any) {
      console.error("Failed to delete logo:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to delete logo",
      });
    }
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
      <h1 className="text-2xl font-medium text-gray-900 mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-success-50 text-success-800 border-success-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-8">
        <h2 className="text-lg font-medium text-gray-900 mb-8">
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

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>

            {profile?.logo_path ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <img
                    src={`http://localhost:3000${profile.logo_path}`}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Current Logo
                    </p>
                    <p className="text-xs text-gray-500">
                      Displayed on GHG Protocol reports
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete logo"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span>{" "}
                      company logo
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, JPEG, or SVG (max 2MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                {uploadingLogo && (
                  <p className="text-sm text-gray-500 text-center">
                    Uploading...
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Logo will be displayed on GHG Protocol reports. Recommended size:
              180x60px
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Address
              <span className="text-orange-600 ml-1">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, City, State, ZIP"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for complete GHG Protocol reports
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
              <span className="text-orange-600 ml-1">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for complete GHG Protocol reports
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-primary-600 text-white font-semibold text-lg rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
