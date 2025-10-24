import { render, screen, waitFor } from '@testing-library/react'
import WaterQualityChart from '@/components/WaterQualityChart'

describe('WaterQualityChart', () => {
  it('renders pH chart with latest value and compliance using MSW data', async () => {
    render(<WaterQualityChart unitId="unit-123" parameter="ph" />)

    // shows loading first
    expect(screen.getByText(/loading chart data/i)).toBeInTheDocument()

    // renders chart title and recent tests once loaded
    await waitFor(() => {
      expect(screen.getByText(/pH Level/i)).toBeInTheDocument()
      expect(screen.getByText(/Recent Tests/i)).toBeInTheDocument()
    })

    // latest value from MSW handler
    expect(screen.getAllByText(/7\.4/)[0]).toBeInTheDocument()

    // compliance label (exact match)
    expect(screen.getByText(/^Compliant$/i)).toBeInTheDocument()
  })
})
