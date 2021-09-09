export function roundDown(number, decimals) {
  decimals = decimals || 0;
  let factor = Math.pow(10, decimals);

  let num = Math.floor(number * factor) / factor;
  return num.toFixed(decimals || 2);
}
