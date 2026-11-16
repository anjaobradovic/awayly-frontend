// pravi var(--c-ime) od imena tokena, sirovu boju pušta kako jeste

const RAW_COLOR = /^(#|rgb|hsl|var\(|currentcolor|transparent|inherit|none)/i;

export const resolveColor = (color) => {
  const trimmed = color?.trim();

  if (!trimmed) return undefined;

  return RAW_COLOR.test(trimmed) ? trimmed : `var(--c-${trimmed}, ${trimmed})`;
};
