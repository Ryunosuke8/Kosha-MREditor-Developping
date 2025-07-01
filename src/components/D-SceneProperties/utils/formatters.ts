export const formatNumber = (value: number, decimals: number = 3): string => {
  return value.toFixed(decimals);
};

export const formatRotation = (degrees: number): string => {
  return `${formatNumber(degrees, 1)}°`;
};

export const formatPosition = (value: number): string => {
  return formatNumber(value, 3);
};

export const formatScale = (value: number): string => {
  return formatNumber(value, 3);
}; 