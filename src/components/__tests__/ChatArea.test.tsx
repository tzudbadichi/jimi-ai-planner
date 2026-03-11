import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatArea from '@/components/ChatArea'

const submitMessage = vi.fn().mockResolvedValue({ success: true })
const refresh = vi.fn()

vi.mock('@/app/actions', () => ({
  submitMessage: (...args: unknown[]) => submitMessage(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('ChatArea', () => {
  it('sends a message and refreshes', async () => {
    const user = userEvent.setup()
    render(
      <ChatArea
        initialMessages={[{ id: 'm1', role: 'assistant', content: 'Hello' }]}
      />
    )

    await user.type(screen.getByPlaceholderText(/Write a message/), 'Hi')
    await user.click(screen.getByRole('button', { name: /Send message/ }))

    await waitFor(() => {
      expect(submitMessage).toHaveBeenCalledWith('Hi')
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })
})
