/**
 * Lemburin Navigation Types
 */

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
};

export type MainTabParamList = {
  index: undefined;       // Dashboard
  calendar: undefined;
  history: undefined;
  settings: undefined;
};

export type OvertimeStackParamList = {
  add: undefined;
  '[id]': { id: string };
};

export type SetupStackParamList = {
  'company/setup': undefined;
  'pay-period/setup': undefined;
  'formula/select': undefined;
};
