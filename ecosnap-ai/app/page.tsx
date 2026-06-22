import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-57px)] bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🌿 AI-Powered Pollution Reporting
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Report Pollution with{" "}
          <span className="text-green-600">AI-Powered Analysis</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Snap a photo of environmental pollution, add a location, and let
          EcoSnap AI classify the issue, assess its urgency, and recommend the
          right actions — all in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold text-base px-8 py-3.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
          >
            📷 Report Pollution Now
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border border-green-300 text-green-700 font-semibold text-base px-8 py-3.5 rounded-lg hover:bg-green-50 active:bg-green-100 transition-colors"
          >
            View Past Reports
          </Link>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-5xl mx-auto px-4 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Upload a Photo
            </h3>
            <p className="text-sm text-gray-500">
              Submit a JPEG, PNG, or WebP photo of the pollution as visual
              evidence.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              AI Classification
            </h3>
            <p className="text-sm text-gray-500">
              Get an instant category — plastic waste, illegal dumping, water
              pollution, and more.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Urgency &amp; Actions
            </h3>
            <p className="text-sm text-gray-500">
              Receive a priority level and concrete steps to address the
              situation right away.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
