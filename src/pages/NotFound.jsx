import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl font-black text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-full text-white text-sm font-semibold transition"
        style={{ backgroundColor: '#E91E8C' }}
      >
        Go to Home
      </Link>
    </div>
  )
}
