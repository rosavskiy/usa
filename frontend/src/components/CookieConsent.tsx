import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowConsent(false);
  };

  const rejectAll = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Privacy & Cookie Notice
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                We care about your privacy
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Carbon Tracker AI Assistant</strong> uses cookies and
              processes personal data in accordance with US privacy laws,
              including CCPA (California), CPRA, and other state regulations.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <h3 className="font-bold text-gray-900 text-base">
              What Data We Collect:
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Email address and company name (for registration)</li>
              <li>Uploaded bills and documents (for analysis)</li>
              <li>CO₂ emission calculation results</li>
              <li>Cookies for authentication and site functionality</li>
              <li>IP address and browser data (security logging)</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base mt-4">
              How We Use Data:
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Process bills through AI (OpenAI API)</li>
              <li>Calculate your company's carbon footprint</li>
              <li>Generate personalized recommendations</li>
              <li>Improve service functionality</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base mt-4">
              Your Rights (CCPA/CPRA):
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Right to know:</strong> what data we collect
              </li>
              <li>
                <strong>Right to delete:</strong> request deletion of your data
              </li>
              <li>
                <strong>Right to opt-out:</strong> of data sales (we do NOT sell
                data)
              </li>
              <li>
                <strong>Right to access:</strong> get a copy of your data
              </li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base mt-4">
              Legal Compliance:
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>CCPA:</strong> California Consumer Privacy Act
              </li>
              <li>
                <strong>CPRA:</strong> California Privacy Rights Act
              </li>
              <li>
                <strong>Virginia CDPA:</strong> Virginia Consumer Data
                Protection Act
              </li>
              <li>
                <strong>Colorado CPA:</strong> Colorado Privacy Act
              </li>
              <li>
                <strong>Connecticut CTDPA:</strong> Connecticut Data Privacy Act
              </li>
              <li>
                <strong>Utah UCPA:</strong> Utah Consumer Privacy Act
              </li>
            </ul>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
              <p className="text-sm text-green-900">
                <strong>✓ PROFESSIONAL STANDARDS:</strong> Our calculations
                comply with GHG Protocol, EPA Emission Factors, ISO 14064-1.
                Suitable for official reporting to CDP, SEC Climate Disclosure,
                GRI Standards. AI parsing with 95%+ accuracy on quality
                documents.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded mt-4">
              <p className="text-xs text-gray-600">
                By using our service, you agree to data processing as described
                above. We implement encryption, secure storage, and regular
                security audits. Data is not shared with third parties, except
                OpenAI for AI processing (per their
                <a
                  href="https://openai.com/privacy"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  {" "}
                  Privacy Policy
                </a>
                ).
              </p>
              <p className="text-xs text-gray-600 mt-2">
                For privacy questions: <strong>privacy@carbontracker.ai</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={rejectAll}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={acceptAll}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Accept & Continue
          </button>
        </div>

        <div className="px-6 pb-4 text-center">
          <a
            href="/privacy-policy"
            target="_blank"
            className="text-xs text-blue-600 hover:underline"
          >
            Read Full Privacy Policy
          </a>
          {" | "}
          <a
            href="/terms-of-service"
            target="_blank"
            className="text-xs text-blue-600 hover:underline"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
