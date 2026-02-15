import { X, CreditCard } from "lucide-react";

interface CreditConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentBalance: number;
}

export default function CreditConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentBalance,
}: CreditConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Ready to Process?
        </h2>

        <p className="text-gray-700 mb-6">
          To proceed with AI-powered data extraction, <strong>1 credit</strong>{" "}
          will be deducted from your balance for this document.
        </p>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">What you get:</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>
                <strong>Precision OCR:</strong> Automated extraction of energy
                and fuel consumption.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>
                <strong>EPA eGRID Integration:</strong> Calculations based on
                the latest regional emission factors.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>
                <strong>Standard Compliance:</strong> Data will be formatted
                according to the{" "}
                <strong>GHG Protocol Corporate Standard</strong>.
              </span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Once processed, you can review the results in the{" "}
          <strong>Calculations</strong> tab and export your audit-ready PDF
          Report.
        </p>

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Current Balance:</span>
            <span className="text-lg font-semibold text-primary-600">
              {currentBalance.toLocaleString("en-US")} credits
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={currentBalance < 1}
            className="flex-1 bg-primary-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm & Process
          </button>
          <button
            onClick={() => (window.location.href = "/billing")}
            className="flex-1 bg-white border-2 border-primary-600 text-primary-600 font-medium py-3 px-4 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            Top Up Balance
          </button>
        </div>

        {currentBalance < 1 && (
          <p className="text-sm text-red-600 mt-3 text-center">
            Insufficient credits. Please top up your balance to continue.
          </p>
        )}
      </div>
    </div>
  );
}
