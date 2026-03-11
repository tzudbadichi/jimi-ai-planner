import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleButton } from '@/components/ScheduleButton'

const generateSchedule = vi.fn().mockResolvedValue({ schedule: '09:00 - 10:00: Test' })

vi.mock('@/app/actions', () => ({
  generateSchedule: (...args: unknown[]) => generateSchedule(...args),
}))

describe('ScheduleButton', () => {
  it('generates schedule and shows modal', async () => {
    const user = userEvent.setup()
    render(<ScheduleButton />)

    await user.click(screen.getByRole('button', { name: /Build Daily Schedule/ }))
    expect(await screen.findByText(/09:00/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText(/09:00/)).not.toBeInTheDocument()
  })
})
