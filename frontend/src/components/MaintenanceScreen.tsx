import { useState } from "react";
import { Lock } from "lucide-react";

const CORRECT_PIN = "13112010";

export default function MaintenanceScreen({
  onUnlock,
}: {
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      localStorage.setItem("maintenance_unlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-teal-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Under Development
        </h1>

        <p className="text-gray-600 text-center mb-8">
          This project is currently under development. Please come back later or
          enter the PIN code to access.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              PIN Code
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN code"
              maxLength={8}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
              }`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                Incorrect PIN code. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Unlock
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">Carbon Tracker © 2026</p>
        </div>
      </div>
    </div>
  );
}
