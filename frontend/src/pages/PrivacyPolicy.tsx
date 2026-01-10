import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: January 10, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700">
                Carbon Tracker AI Assistant ("we," "our," or "us") respects your privacy and is committed to protecting 
                your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our service at carbontracker.ai and related services (collectively, the "Service").
              </p>
              <p className="text-gray-700 mt-2">
                This Privacy Policy complies with the California Consumer Privacy Act (CCPA), California Privacy Rights Act (CPRA), 
                Virginia Consumer Data Protection Act (CDPA), Colorado Privacy Act (CPA), Connecticut Data Privacy Act (CTDPA), 
                Utah Consumer Privacy Act (UCPA), and other applicable U.S. state privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>Account Information:</strong> Email address, company name, password (encrypted)</li>
                <li><strong>Uploaded Documents:</strong> Utility bills, receipts, invoices (electricity, gas, fuel, supplies)</li>
                <li><strong>Payment Information:</strong> Processed by Stripe (we do not store card details)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Cookies:</strong> Authentication tokens, preferences (see Section 7)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.3 AI Processing Data</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Uploaded documents are processed by OpenAI's GPT-4 Vision API</li>
                <li>Extracted data: consumption values, dates, provider names</li>
                <li>Carbon emission calculations based on EPA emission factors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Service Delivery:</strong> Process bills, calculate emissions, generate recommendations</li>
                <li><strong>Account Management:</strong> Authentication, customer support, billing</li>
                <li><strong>Service Improvement:</strong> Analyze usage patterns, improve AI accuracy</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
                <li><strong>Security:</strong> Detect fraud, prevent abuse, protect user data</li>
              </ul>
              <p className="text-gray-700 mt-3 font-semibold">
                We do NOT sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">We share data with:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>OpenAI:</strong> For AI processing of uploaded documents (subject to OpenAI's Privacy Policy)</li>
                <li><strong>Stripe:</strong> For payment processing (subject to Stripe's Privacy Policy)</li>
                <li><strong>Supabase:</strong> For database hosting (encrypted storage)</li>
                <li><strong>Hosting Providers:</strong> Vercel (frontend), Railway (backend)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">We may disclose data when:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Required by law, court order, or government request</li>
                <li>To protect our rights, property, or safety</li>
                <li>In connection with a merger, acquisition, or sale of assets (with notice)</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Your Privacy Rights (U.S. State Laws)</h2>
              
              <p className="text-gray-700 mb-3">
                Under CCPA, CPRA, and other state privacy laws, you have the following rights:
              </p>

              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Know</h4>
                  <p className="text-sm text-gray-700">Request disclosure of personal data we collect, use, and share</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Delete</h4>
                  <p className="text-sm text-gray-700">Request deletion of your personal data (with certain exceptions)</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Correct</h4>
                  <p className="text-sm text-gray-700">Request correction of inaccurate personal data</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Opt-Out</h4>
                  <p className="text-sm text-gray-700">Opt-out of sale/sharing of personal data (we don't sell data)</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Limit Use</h4>
                  <p className="text-sm text-gray-700">Limit use of sensitive personal information</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Non-Discrimination</h4>
                  <p className="text-sm text-gray-700">Exercise rights without discriminatory treatment</p>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                <strong>To exercise your rights:</strong> Email us at <a href="mailto:privacy@carbontracker.ai" className="text-blue-600 hover:underline">privacy@carbontracker.ai</a> with subject "Privacy Rights Request"
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your data for as long as your account is active or as needed to provide services. 
                After account deletion, we may retain certain data for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Legal compliance (e.g., tax records): up to 7 years</li>
                <li>Dispute resolution: up to 6 years</li>
                <li>Fraud prevention: up to 5 years</li>
                <li>Aggregated/anonymized data: indefinitely for analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-2">We use the following cookies:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>Essential Cookies:</strong> Authentication (JWT tokens), session management</li>
                <li><strong>Functional Cookies:</strong> User preferences, language settings</li>
                <li><strong>Analytics Cookies:</strong> Usage statistics (opt-in)</li>
              </ul>
              <p className="text-gray-700 mt-2">
                You can control cookies through your browser settings. Disabling essential cookies may affect functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Data Security</h2>
              <p className="text-gray-700">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                <li>Encryption in transit (HTTPS/TLS 1.3)</li>
                <li>Encryption at rest (AES-256)</li>
                <li>Password hashing (bcrypt)</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>No system is 100% secure.</strong> We cannot guarantee absolute security, but we continuously work to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
              <p className="text-gray-700">
                Our Service is not directed to individuals under 18. We do not knowingly collect data from children. 
                If you believe we have collected data from a child, contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">10. International Data Transfers</h2>
              <p className="text-gray-700">
                Your data may be transferred to and processed in the United States and other countries. 
                By using our Service, you consent to such transfers. We ensure appropriate safeguards are in place.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 
                "Effective Date." Continued use of the Service after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Contact Us</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Carbon Tracker AI Assistant</strong></p>
                <p className="text-gray-700">Email: <a href="mailto:privacy@carbontracker.ai" className="text-blue-600 hover:underline">privacy@carbontracker.ai</a></p>
                <p className="text-gray-700">Support: <a href="mailto:support@carbontracker.ai" className="text-blue-600 hover:underline">support@carbontracker.ai</a></p>
                <p className="text-gray-700 mt-2">
                  For privacy-related questions or to exercise your rights under CCPA/CPRA and other state laws, 
                  please email us with "Privacy Request" in the subject line.
                </p>
              </div>
            </section>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-8">
              <p className="text-sm text-green-900">
                <strong>✓ METHODOLOGY:</strong> Our carbon emission calculations comply with GHG Protocol, EPA Emission Factors, 
                and ISO 14064-1 standards. Results are suitable for official reporting in CDP, SEC Climate Disclosure, 
                GRI Standards, and corporate sustainability reports. We update emission factors annually per EPA and DEFRA publications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
