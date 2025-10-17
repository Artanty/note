type StrOrNum = string | number;

export const swapObject = <K extends StrOrNum, V extends StrOrNum>(
  originalObject: { [key in K]: V },
): { [key in V]: K } => Object.entries(originalObject).reduce((acc, [key, value]) => {
  (acc as Record<StrOrNum, unknown>)[value as StrOrNum] = key;

  return acc;
}, {} as { [key in V]: K });