import { submitOnboarding } from "./actions";

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Jimi</h1>
        <p className="text-gray-600 mb-6">Tell me about yourself to generate your life tracks.</p>
        
        <form action={submitOnboarding} className="space-y-4">
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Your Bio / Current Status
            </label>
            <textarea
              name="bio"
              id="bio"
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="I'm a software developer, married with 3 kids. I want to get back in shape..."
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Generate My Tracks
          </button>
        </form>
      </div>
    </main>
  );
}