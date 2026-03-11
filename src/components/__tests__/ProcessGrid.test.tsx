import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProcessGrid from '@/components/ProcessGrid'

const updateProcess = vi.fn().mockResolvedValue({ success: true })
const deleteProcessById = vi.fn().mockResolvedValue({ success: true })
const addProcessLog = vi.fn().mockResolvedValue({
  success: true,
  log: { id: 'log2', content: 'New log', createdAt: new Date().toISOString() },
})
const deleteProcessLog = vi.fn().mockResolvedValue({ success: true })

vi.mock('@/app/actions', () => ({
  updateProcess: (...args: unknown[]) => updateProcess(...args),
  deleteProcessById: (...args: unknown[]) => deleteProcessById(...args),
  addProcessLog: (...args: unknown[]) => addProcessLog(...args),
  deleteProcessLog: (...args: unknown[]) => deleteProcessLog(...args),
}))

describe('ProcessGrid', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders process and list cards', () => {
    render(
      <ProcessGrid
        processes={[
          { id: 'p1', title: 'Goal 1', goal: 'Do it', type: 'PROCESS', logs: [] },
          { id: 'l1', title: 'List 1', goal: '[ ] Task', type: 'LIST', logs: [] },
        ]}
      />
    )

    expect(screen.getByText('Goal 1')).toBeInTheDocument()
    expect(screen.getByText('List 1')).toBeInTheDocument()
  })

  it('adds a checklist item', async () => {
    const user = userEvent.setup()
    render(
      <ProcessGrid
        processes={[{ id: 'l1', title: 'List 1', goal: null, type: 'LIST', logs: [] }]}
        mode="listsOnly"
      />
    )

    const input = screen.getByRole('textbox')
    const addButton = input.parentElement?.querySelector('button') as HTMLButtonElement

    await user.type(input, 'Milk')
    await user.click(addButton)

    await waitFor(() => {
      expect(updateProcess).toHaveBeenCalled()
    })
  })

  it('adds a process log', async () => {
    const user = userEvent.setup()
    render(
      <ProcessGrid
        processes={[{ id: 'p1', title: 'Goal 1', goal: 'Do it', type: 'PROCESS', logs: [] }]}
      />
    )

    const card = screen.getByText('Goal 1').closest('div')?.parentElement?.parentElement
    const logButton = card?.querySelector('button') as HTMLButtonElement
    await user.click(logButton)

    const logInput = screen.getByRole('textbox')
    const addLogButton = logInput.parentElement?.querySelector('button') as HTMLButtonElement

    await user.type(logInput, 'New log')
    await user.click(addLogButton)

    await waitFor(() => {
      expect(addProcessLog).toHaveBeenCalledWith('p1', 'New log')
    })
  })
})
