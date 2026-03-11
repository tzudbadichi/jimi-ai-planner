import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignOutButton from '@/components/SignOutButton'

const signOut = vi.fn()

vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}))

describe('SignOutButton', () => {
  it('calls signOut with callbackUrl', async () => {
    const user = userEvent.setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button'))
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })
})
