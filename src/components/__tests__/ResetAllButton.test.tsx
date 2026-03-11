import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetAllButton from '@/components/ResetAllButton'

const resetAllData = vi.fn().mockResolvedValue({ success: true })
const refresh = vi.fn()

vi.mock('@/app/actions', () => ({
  resetAllData: (...args: unknown[]) => resetAllData(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('ResetAllButton', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('confirms and calls reset', async () => {
    const user = userEvent.setup()
    render(<ResetAllButton />)

    await user.click(screen.getByRole('button', { name: /Reset All/ }))

    await waitFor(() => {
      expect(resetAllData).toHaveBeenCalledTimes(1)
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })
})
