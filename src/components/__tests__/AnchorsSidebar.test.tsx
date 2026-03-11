import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnchorsSidebar } from '@/components/AnchorsSidebar'

describe('AnchorsSidebar', () => {
  it('renders empty state and toggles open', async () => {
    const user = userEvent.setup()
    const { container } = render(<AnchorsSidebar anchors={[]} />)

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBeGreaterThan(1)
  })

  it('shows anchor details when open', async () => {
    const user = userEvent.setup()
    render(
      <AnchorsSidebar
        anchors={[
          { id: 'a1', title: 'Morning', startTime: '08:00', endTime: '09:00', day: 'Monday' },
        ]}
      />
    )

    await user.click(screen.getAllByRole('button')[0])
    expect(screen.getByText('Morning')).toBeInTheDocument()
    expect(screen.getByText('08:00 - 09:00')).toBeInTheDocument()
    expect(screen.getByText('Monday')).toBeInTheDocument()
  })
})
