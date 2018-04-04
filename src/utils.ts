export function objectToList<T>(object: Map<string, T>): T[] {
  return Object.keys(object).map(key => object[key]);
}

export function makeDropdownOption<T>(x: T) {
  return { key: x, value: x, text: x };
}