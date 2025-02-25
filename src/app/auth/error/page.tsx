export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            There was an error with the authentication process. Please try again or contact support if the problem persists.
          </p>
        </div>
        <div className="mt-4 text-center">
          <a
            href="/auth/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Return to login
          </a>
        </div>
      </div>
    </div>
  )
}
