import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Effective Date: January 10, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing or using Carbon Tracker AI Assistant (the "Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you do not agree, do not use the Service.
              </p>
              <p className="text-gray-700 mt-2">
                These Terms constitute a legally binding agreement between you ("User," "you," or "your") and 
                Carbon Tracker AI Assistant ("we," "us," or "our").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700">
                Carbon Tracker AI Assistant provides an AI-powered platform for small businesses to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Upload utility bills and receipts (electricity, gas, fuel, supplies)</li>
                <li>Automatically parse document data using AI (OpenAI GPT-4 Vision)</li>
                <li>Calculate estimated carbon emissions (Scope 1, 2, and 3)</li>
                <li>Receive personalized recommendations to reduce emissions</li>
                <li>Track emission trends over time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Subscription and Pricing</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-3">
                <p className="font-semibold text-gray-900">Current Pricing: $150-200 per month</p>
                <p className="text-sm text-gray-700 mt-1">Billed monthly. Prices subject to change with 30 days notice.</p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 Payment Terms</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Subscription fees are billed in advance on a monthly basis</li>
                <li>Payments processed securely via Stripe</li>
                <li>Failure to pay may result in service suspension</li>
                <li>You are responsible for all applicable taxes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-3">3.2 Refund Policy</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>7-Day Money-Back Guarantee:</strong> Full refund if canceled within 7 days of initial purchase</li>
                <li><strong>After 7 days:</strong> No refunds for partial months</li>
                <li>You may cancel anytime; no charges after cancellation effective date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">4. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Account Creation</h3>
              <p className="text-gray-700">You must provide:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-1">
                <li>Accurate and complete information</li>
                <li>Valid email address</li>
                <li>Secure password (minimum 8 characters)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-3">4.2 Account Security</h3>
              <p className="text-gray-700">You are responsible for:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-1">
                <li>Maintaining confidentiality of your password</li>
                <li>All activities under your account</li>
                <li>Notifying us immediately of unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-3">4.3 Account Termination</h3>
              <p className="text-gray-700">We may suspend or terminate your account if you:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-1">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Abuse or misuse the Service</li>
                <li>Fail to pay subscription fees</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">You agree NOT to:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Upload malicious files or viruses</li>
                <li>Attempt to hack, reverse-engineer, or compromise the Service</li>
                <li>Use the Service for illegal purposes</li>
                <li>Share your account with others</li>
                <li>Scrape, copy, or reproduce Service content</li>
                <li>Overload our servers with excessive requests</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </section>

            <section className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-green-900 mb-3">6. METHODOLOGY & ACCURACY STANDARDS</h2>
              
              <div className="space-y-3 text-gray-800">
                <p className="font-semibold">Our calculations comply with internationally recognized standards:</p>
                
                <p><strong>6.1 Emission Calculation Standards</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>GHG Protocol:</strong> World Resources Institute Corporate Accounting Standard</li>
                  <li><strong>EPA Emission Factors:</strong> Official U.S. Environmental Protection Agency data</li>
                  <li><strong>ISO 14064-1:</strong> International standard for GHG quantification and reporting</li>
                  <li><strong>Suitable for:</strong> CDP reporting, SEC Climate Disclosure, GRI Standards, Sustainability reports</li>
                  <li>CO₂e calculation formula: CO₂ + (CH₄ × 25) + (N₂O × 298) per IPCC AR5</li>
                </ul>

                <p><strong>6.2 AI Processing Accuracy</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>OpenAI GPT-4 Vision model with 95%+ accuracy on quality documents</li>
                  <li>Extraction confidence scores provided for verification</li>
                  <li>You should review extracted data before finalizing calculations</li>
                  <li>Poor quality scans may affect accuracy - we recommend uploading clear, high-resolution files</li>
                </ul>

                <p><strong>6.3 Service Reliability</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>We use enterprise-grade infrastructure (OpenAI, Stripe, Supabase)</li>
                  <li>99.9% uptime target (SLA)</li>
                  <li>Encrypted data storage and transmission</li>
                  <li>Not responsible for third-party service outages beyond our control</li>
                </ul>
              </div>
            </section>

            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-3">7. LIMITATION OF LIABILITY</h2>
              
              <div className="space-y-3 text-gray-800">
                <p className="font-semibold">
                  Our liability is limited to the amount paid for the Service during the 12 months preceding any claim.
                </p>
                
                <p><strong>We are NOT liable for:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, or business opportunities</li>
                  <li>Errors arising from incorrect user data input or low-quality document uploads</li>
                  <li>Technical failures of third-party services (OpenAI, Stripe, Supabase, cloud providers)</li>
                  <li>Force majeure events beyond our reasonable control</li>
                </ul>

                <p className="mt-3"><strong>Professional Verification:</strong></p>
                <p className="text-sm ml-4">
                  For mission-critical regulatory submissions (SEC audits, EPA enforcement cases), 
                  we recommend final verification by a certified carbon accounting professional.
                  Our calculations provide professional-grade accuracy suitable for standard corporate reporting.
                </p>

                <p className="mt-3 text-xs">
                  Some jurisdictions do not allow limitation of liability. 
                  In such cases, our liability is limited to the fullest extent permitted by law.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless Carbon Tracker AI Assistant, its affiliates, and employees from any claims, 
                damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Your use of the Service</li>
                <li>Violation of these Terms</li>
                <li>Violation of any law or third-party rights</li>
                <li>Content you upload or submit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">9.1 Our Rights</h3>
              <p className="text-gray-700">
                All Service content, features, and functionality (including software, algorithms, design, text, graphics, logos) 
                are owned by us and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-3">9.2 Your Rights</h3>
              <p className="text-gray-700">
                You retain all rights to documents you upload. By uploading, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-1">
                <li>Process documents through AI (OpenAI)</li>
                <li>Store data for Service delivery</li>
                <li>Use aggregated/anonymized data for service improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Governing Law and Jurisdiction</h2>
              <p className="text-gray-700">
                These Terms are governed by the laws of the State of <strong>Delaware, United States</strong>, 
                without regard to conflict of law principles.
              </p>
              <p className="text-gray-700 mt-2">
                Any disputes shall be resolved in the state or federal courts located in Delaware. 
                You consent to the exclusive jurisdiction of such courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Arbitration Agreement</h2>
              <p className="text-gray-700">
                Any dispute arising from these Terms shall be resolved through binding arbitration in accordance with 
                the American Arbitration Association (AAA) rules, except:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Small claims court disputes (under $10,000)</li>
                <li>Injunctive relief to protect intellectual property</li>
              </ul>
              <p className="text-gray-700 mt-2 font-semibold">
                YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND CLASS ACTION LAWSUITS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these Terms at any time. Changes will be posted on this page with an updated "Effective Date." 
                Continued use after changes constitutes acceptance.
              </p>
              <p className="text-gray-700 mt-2">
                For material changes, we will provide 30 days notice via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">13. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found invalid or unenforceable, the remaining provisions remain in full effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">14. Entire Agreement</h2>
              <p className="text-gray-700">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and us 
                regarding the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">15. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Carbon Tracker AI Assistant</strong></p>
                <p className="text-gray-700">Email: <a href="mailto:legal@carbontracker.ai" className="text-blue-600 hover:underline">legal@carbontracker.ai</a></p>
                <p className="text-gray-700">Support: <a href="mailto:support@carbontracker.ai" className="text-blue-600 hover:underline">support@carbontracker.ai</a></p>
              </div>
            </section>

            <div className="bg-gray-100 border border-gray-300 p-4 mt-8 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold">
                By clicking "Accept & Continue" or using the Service, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
