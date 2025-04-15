export default function PrivacyPolicyPage() {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="mb-2">
            This Privacy Policy describes how we collect, use, and protect your information
            when you use our website.
          </p>
          <p className="mb-2">
            We use your email and social login information only to authenticate you and
            provide access to features of the site. We do not sell or share your information
            with third parties.
          </p>
          <p className="mb-2">
            If you have any questions or would like your data removed, please email us at{' '}
            <a href="mailto:support@yourdomain.com" className="text-blue-600 hover:underline">
              support@yourdomain.com
            </a>.
          </p>
        </div>
      </main>
    );
  }
  