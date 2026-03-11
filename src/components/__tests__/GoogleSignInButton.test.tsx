import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoogleSignInButton from '@/components/GoogleSignInButton'

const signIn = vi.fn()

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}))

describe('GoogleSignInButton', () => {
  it('calls signIn on click', async () => {
    const user = userEvent.setup()
    render(<GoogleSignInButton />)

    await user.click(screen.getByRole('button', { name: /Google/ }))
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' })
  })
})
