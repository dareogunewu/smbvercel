export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-600">Last updated: December 24, 2025</p>
        </div>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using SMB Owner, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Service Description</h2>
          <p className="mb-4">
            SMB Owner provides tools to convert PDF bank statements to CSV format, categorize transactions,
            and generate business reports. The service is provided &quot;as is&quot; without warranties of any kind.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">User Responsibilities</h2>
          <p className="mb-4">You agree to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate information</li>
            <li>Use the service only for lawful purposes</li>
            <li>Not attempt to circumvent security measures</li>
            <li>Not upload malicious files or content</li>
            <li>Respect rate limits and usage guidelines</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Limitations of Liability</h2>
          <p className="mb-4">
            SMB Owner is not responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Accuracy of categorized transactions</li>
            <li>Financial decisions made based on generated reports</li>
            <li>Data loss or corruption</li>
            <li>Service interruptions or downtime</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Intellectual Property</h2>
          <p className="mb-4">
            The SMB Owner software and documentation are licensed under the MIT License.
            You retain all rights to your data and generated reports.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Data Processing</h2>
          <p className="mb-4">
            By using this service, you acknowledge that your bank statements will be processed
            by third-party services (bankstatementconverter.com) for PDF conversion.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Termination</h2>
          <p className="mb-4">
            We reserve the right to terminate or suspend access to our service at any time,
            with or without cause or notice.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Changes to Terms</h2>
          <p className="mb-4">
            We may update these terms at any time. Continued use of the service after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p>
            For questions about these Terms of Service, please visit our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
