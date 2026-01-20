import { CreditCard, Check, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Billing() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await api.get("/settings/profile");
        setCredits(response.data.credits || 0);
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCredits();
    }
  }, [user]);

  const plans = [
    {
      id: "trial",
      name: "Free Trial",
      credits: 5,
      price: 0,
      pricePerCredit: 0,
      badge: "New Users",
      features: [
        "5 document credits",
        "AI-powered parsing",
        "Basic emissions reports",
        "Email support",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      credits: 10,
      price: 149,
      pricePerCredit: 14.9,
      features: [
        "10 document credits",
        "AI-powered parsing",
        "Full emissions reports",
        "GHG Protocol compliance",
        "Priority email support",
      ],
    },
    {
      id: "business",
      name: "Business",
      credits: 50,
      price: 699,
      pricePerCredit: 13.98,
      badge: "Popular",
      features: [
        "50 document credits",
        "AI-powered parsing",
        "Full emissions reports",
        "GHG Protocol compliance",
        "Annual reports",
        "Priority support",
        "CSV exports",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      credits: 150,
      price: 1929,
      pricePerCredit: 12.86,
      features: [
        "150 document credits",
        "AI-powered parsing",
        "Full emissions reports",
        "GHG Protocol compliance",
        "Annual reports",
        "Dedicated support",
        "CSV exports",
        "API access",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          Credits & Billing
        </h1>
        <p className="text-gray-600">
          Purchase credits to analyze your utility bills and calculate carbon
          emissions
        </p>
      </div>

      {/* Current Credits */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-primary-900 mb-1">
              Current Balance
            </h3>
            <p className="text-sm text-gray-600">
              1 credit = 1 successfully parsed document
            </p>
          </div>
          <div className="text-right">
            {loading ? (
              <div className="text-2xl text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="text-4xl font-semibold text-primary-600">{credits}</div>
                <div className="text-sm text-gray-500">credits remaining</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* How Credits Work */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={20} className="text-primary-600" />
          How Credits Work
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <Check
              size={16}
              className="text-primary-600 mt-0.5 flex-shrink-0"
            />
            <span>
              <strong>1 credit</strong> is used when a document is successfully
              parsed and analyzed
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check
              size={16}
              className="text-primary-600 mt-0.5 flex-shrink-0"
            />
            <span>
              <strong>No credits charged</strong> if document parsing fails or
              has errors
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check
              size={16}
              className="text-primary-600 mt-0.5 flex-shrink-0"
            />
            <span>Credits never expire and can be used anytime</span>
          </li>
        </ul>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Purchase Credit Packages
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Buy credits anytime you need them. You can purchase packages multiple
          times.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white border-2 rounded-lg p-6 transition-all ${
                selectedPlan === plan.id
                  ? "border-primary-500 shadow-lg"
                  : "border-gray-200 hover:border-primary-300"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {plan.credits} credits
                </div>
                {plan.price > 0 && (
                  <div className="text-xs text-gray-400">
                    ${plan.pricePerCredit.toFixed(2)} per credit
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <Check
                      size={16}
                      className="text-primary-600 mt-0.5 flex-shrink-0"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedPlan(plan.id)}
                disabled={plan.id === "trial"}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.id === "trial"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : selectedPlan === plan.id
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                }`}
              >
                {plan.id === "trial" ? "Already Active" : "Purchase Credits"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      {selectedPlan && selectedPlan !== "trial" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            Payment Method
          </h2>

          <div className="max-w-md space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Selected:{" "}
              <strong className="text-gray-900">
                {plans.find((p) => p.id === selectedPlan)?.name} - $
                {plans.find((p) => p.id === selectedPlan)?.price}
              </strong>
            </div>

            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-md">
              <CreditCard size={20} />
              Pay with Card (Visa, Mastercard, Amex)
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg transition-colors border-2 border-gray-300 flex items-center justify-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852a.932.932 0 0 1 .924-.788h.588c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.778-4.467z"
                  fill="#003087"
                />
              </svg>
              Pay with PayPal
            </button>

            <div className="text-xs text-gray-500 text-center mt-4">
              🔒 Secure payment processing. Your payment information is
              encrypted and secure.
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">
              What happens if document parsing fails?
            </p>
            <p className="text-gray-600">
              No credits are charged if a document cannot be parsed or if
              there's an error during analysis.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Do credits expire?</p>
            <p className="text-gray-600">
              No, credits never expire. Use them whenever you need to analyze
              documents.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">
              Can I purchase more credits later?
            </p>
            <p className="text-gray-600">
              Yes! You can purchase any credit package as many times as you
              need. There are no limits on purchases.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">
              Can I buy the same package multiple times?
            </p>
            <p className="text-gray-600">
              Absolutely. Each purchase adds credits to your balance. Buy the
              same package or different ones - it's up to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
