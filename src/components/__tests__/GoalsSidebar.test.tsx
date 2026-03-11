import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalsSidebar } from '@/components/GoalsSidebar'

describe('GoalsSidebar', () => {
  it('renders empty state without crashing', () => {
    render(<GoalsSidebar goals={[]} />)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('opens goal details modal', async () => {
    const user = userEvent.setup()
    render(
      <GoalsSidebar
        goals={[
          {
            id: 'g1',
            title: 'Ship',
            goal: 'Finish release',
            logsCount: 1,
            logs: [
              { id: 'l1', content: 'Did work', createdAt: new Date().toISOString() },
            ],
          },
        ]}
      />
    )

    await user.click(screen.getByRole('button', { name: /Ship/ }))
    expect(screen.getByText('Finish release')).toBeInTheDocument()
    expect(screen.getByText('Did work')).toBeInTheDocument()
  })
})
