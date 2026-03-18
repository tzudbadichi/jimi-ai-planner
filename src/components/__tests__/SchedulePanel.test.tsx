import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SchedulePanel from '@/components/SchedulePanel'
import { generateWeeklySchedule } from '@/app/actions'

vi.mock('@/app/actions', () => ({
  generateSchedule: vi.fn().mockResolvedValue({ schedule: '09:00 - 10:00: Test' }),
  generateWeeklySchedule: vi.fn().mockResolvedValue({
    schedule: [
      '| יום | שעה | משימה |',
      '| --- | --- | --- |',
      '| Sunday | 09:00 | Test |',
    ].join('\n'),
  }),
}))

describe('SchedulePanel', () => {
  it('loads weekly schedule and shows results', async () => {
    const user = userEvent.setup()
    render(<SchedulePanel initialSchedule={null} initialWeeklySchedule={null} />)

    await user.click(screen.getByRole('button', { name: 'הצג לוז שבועי' }))

    expect(generateWeeklySchedule).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Sunday')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
