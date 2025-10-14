export default function TestSimple() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>This is a simple test page with no middleware, no auth, no complex logic.</p>
      <p>If this page loads, the basic routing is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}
