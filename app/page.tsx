export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-white to-accent-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto">
            <img 
              src="/logo-192.png" 
              alt="Aquivis Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold mb-4 text-gray-900">
          Aquivis
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Professional Pool Service Management
        </p>
        
        <p className="text-sm text-accent-700 mb-12">
          QLD Health Compliant • Real-Time Monitoring • Mobile-First
        </p>
        
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/customer-portal/login"
            className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary-50 transition-colors"
          >
            Customer Portal
          </a>
        </div>
        
        <div className="mt-16 text-sm text-gray-500">
          <p>Building stable, scalable pool service software</p>
          <p className="mt-2">v1.0.0 • Built with Next.js 15 + TypeScript + Supabase</p>
        </div>
      </div>
    </main>
  )
}

