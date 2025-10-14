export default function TestMinimal() {
  return (
    <html>
      <head>
        <title>Minimal Test</title>
      </head>
      <body>
        <h1>Minimal Test Page</h1>
        <p>This page has no dependencies, no imports, no complex logic.</p>
        <p>If this page loads, the basic Next.js routing is working.</p>
        <p>Time: {new Date().toISOString()}</p>
      </body>
    </html>
  )
}
