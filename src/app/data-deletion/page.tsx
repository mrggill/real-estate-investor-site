export default function DataDeletionPage() {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-xl text-center space-y-4">
          <h1 className="text-3xl font-bold">User Data Deletion</h1>
          <p className="text-gray-700">
            If you wish to delete your account and associated data from our system,
            please send an email to:
          </p>
          <p className="text-blue-600 font-medium">
            <a href="mailto:support@yourdomain.com">support@yourdomain.com</a>
          </p>
          <p className="text-gray-600">
            Use the subject line <strong>&quot;Data Deletion Request&quot;</strong> and we will
            process your request within 7 business days.
          </p>
        </div>
      </main>
    );
  }
  