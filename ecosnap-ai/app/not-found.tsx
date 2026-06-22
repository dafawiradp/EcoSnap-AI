import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-57px)] bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="text-6xl mb-6">🌿</div>

        {/* 404 heading */}
        <h1 className="text-7xl font-bold text-green-600 mb-4">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist. It may have been
          moved or removed.
        </p>

        {/* Back to home link */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold text-base px-8 py-3.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
