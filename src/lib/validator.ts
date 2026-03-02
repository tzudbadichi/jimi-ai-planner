export type AllowedAction = 'CREATE_PROCESS' | 'DELETE_PROCESS' | 'UPDATE_STATUS';

export interface ValidatedCommand {
  action: AllowedAction;
  payload: any;
}

export function validateAICommand(rawOutput: string | object): ValidatedCommand {
  const parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
  
  const validActions: AllowedAction[] = ['CREATE_PROCESS', 'DELETE_PROCESS', 'UPDATE_STATUS'];
  
  if (!parsed.action || !validActions.includes(parsed.action)) {
    throw new Error(`Security Violation: AI attempted unauthorized action '${parsed.action}'`);
  }
  
  return parsed as ValidatedCommand;
}