export const ACCOUNT_FOCUS_HIGHLIGHT_CLASS = "account-focus-highlight";

export function getAccountFocusHighlightClass(isFocused: boolean): string {
  return isFocused ? ACCOUNT_FOCUS_HIGHLIGHT_CLASS : "";
}
