import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrackGrid } from '@/components/TrackGrid'

describe('TrackGrid', () => {
  it('shows empty state', () => {
    render(<TrackGrid tracks={[]} />)
    expect(screen.getByText('No tracks yet. Start chatting with Jimi to create your first track.')).toBeInTheDocument()
  })

  it('opens track modal', async () => {
    const user = userEvent.setup()
    render(
      <TrackGrid
        tracks={[
          {
            id: 't1',
            title: 'Track 1',
            goal: 'Goal',
            events: [
              {
                id: 'e1',
                content: 'Did something',
                startTime: '09:00',
                endTime: '10:00',
                date: new Date().toISOString(),
              },
            ],
          },
        ]}
      />
    )

    await user.click(screen.getByRole('button', { name: /Track 1/ }))
    expect(screen.getByText('Did something')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Did something')).not.toBeInTheDocument()
  })
})
