export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: December 24, 2025</p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Data Collection and Processing</h2>
          <p className="mb-4">
            SMB Owner processes your bank statements locally in your browser and on our secure servers. We collect and process:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>PDF bank statement files you upload</li>
            <li>Transaction data extracted from your statements</li>
            <li>Categorization preferences you set</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Data Storage</h2>
          <p className="mb-4">
            Your data is stored locally in your browser using localStorage. We do not permanently store your financial data on our servers.
            Transaction data is processed in memory during PDF conversion and immediately discarded after processing.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
          <p className="mb-4">
            We implement industry-standard security measures including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>HTTPS encryption for all data transmission</li>
            <li>Server-side API key management</li>
            <li>Rate limiting to prevent abuse</li>
            <li>Input validation and sanitization</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
          <p className="mb-4">
            We use bankstatementconverter.com API for PDF to CSV conversion. Please refer to their privacy policy for details on how they handle your data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Clear all locally stored data at any time</li>
            <li>Request deletion of any data processed by our servers</li>
            <li>Export your categorized transactions</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
