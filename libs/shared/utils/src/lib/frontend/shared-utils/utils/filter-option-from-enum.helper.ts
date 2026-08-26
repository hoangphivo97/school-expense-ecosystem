export function createFilterOptionsFromEnum<T extends Record<string, string>>(
  enumObj: T,
  translationPrefix: string,
  allLabelKey = 'shared.filter.all'
): { value: string; labelKey: string }[] {
  const options = Object.values(enumObj).map((val) => ({
    value: val,
    labelKey: `${translationPrefix}.${val.toLowerCase()}`,
  }));

  return [{ value: 'ALL', labelKey: allLabelKey }, ...options];
}