import { render, screen, waitFor } from '@testing-library/react'
import ServiceHistory from '@/components/ServiceHistory'

describe('ServiceHistory', () => {
  it('shows service list for a unit', async () => {
    render(<ServiceHistory unitId="unit-123" />)

    // Loading
    expect(screen.getByText(/loading service history/i)).toBeInTheDocument()

    // Renders item from MSW handler
    await waitFor(() => {
      expect(screen.getByText(/Full Service/i)).toBeInTheDocument()
    })
  })
})
