export type AllowedAction = 'CREATE_PROCESS' | 'DELETE_PROCESS' | 'UPDATE_STATUS';

export interface ValidatedCommand {
  action: AllowedAction
  payload: unknown
}

export function validateAICommand(rawOutput: string | object): ValidatedCommand {
  const parsed: unknown = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput

  const validActions: AllowedAction[] = ['CREATE_PROCESS', 'DELETE_PROCESS', 'UPDATE_STATUS']
  if (!parsed || typeof parsed !== 'object' || !('action' in parsed)) {
    throw new Error('Security Violation: AI output is missing an action field')
  }

  const candidate = parsed as { action?: unknown; payload?: unknown }
  if (typeof candidate.action !== 'string' || !validActions.includes(candidate.action as AllowedAction)) {
    throw new Error(`Security Violation: AI attempted unauthorized action '${String(candidate.action)}'`)
  }

  return {
    action: candidate.action as AllowedAction,
    payload: candidate.payload,
  }
}
