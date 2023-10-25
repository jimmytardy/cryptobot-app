export const isNumber = (value: string | number) => {
    if (typeof value === 'number') return true;
    return !Number.isNaN(parseFloat(value));
}