export interface ActionState {
  errorMessage?: string;
  formData?: FormData;
}

export const initialActionState: ActionState = {};

export function getFormValue(
  formData: FormData | undefined,
  name: string,
): string | undefined {
  const value = formData?.get(name);
  return typeof value === "string" ? value : undefined;
}

export function getFormNumberValue(
  formData: FormData | undefined,
  name: string,
): number | undefined {
  const value = formData?.get(name);
  // Note that the empty-string check matters here: `Number("")` is `0`, but an
  // empty form field should be treated as undefined.
  if (typeof value === "string" && value.trim() !== "") {
    const num = Math.trunc(Number(value));
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}
