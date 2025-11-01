export default function moveElement<T>(
  arr: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const newArr = [...arr]; // clone to avoid mutating original
  const length = newArr.length;

  if (
    fromIndex < 0 ||
    fromIndex >= length ||
    toIndex < 0 ||
    toIndex >= length
  ) {
    throw new Error("Index out of bounds");
  }

  const [element] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, element);

  return newArr;
}


