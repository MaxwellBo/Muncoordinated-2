export function objectToList<T>(object: Map<string, T>): T[] {
  return Object.keys(object).map(key => object[key]);
}

export const makeDropdownOption = (x: any) => {
  return { key: x, value: x, text: x };
};