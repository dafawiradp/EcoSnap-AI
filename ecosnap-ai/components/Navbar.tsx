import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="text-green-600 font-bold text-lg hover:text-green-700 transition-colors"
        >
          🌿 EcoSnap AI
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-600 text-sm font-medium hover:text-green-600 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-600 text-sm font-medium hover:text-green-600 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/report"
            className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Report Pollution
          </Link>
        </div>
      </div>
    </nav>
  );
}
