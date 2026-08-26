type PropValue =
  string | number | boolean | readonly unknown[] | Record<string, unknown> | undefined

function formatValue(value: Exclude<PropValue, undefined>): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return `{${Number(value.toFixed(3))}}`
  if (typeof value === 'boolean') return value ? '' : '{false}'
  return `{${JSON.stringify(value)}}`
}

/**
 * Build a copy-pasteable JSX usage string reflecting the current prop values.
 *
 * @example usage('ShinyText', { text: 'Hi', speed: 2 }) // <ShinyText text="Hi" speed={2} />
 */
export function usage(
  name: string,
  props: Record<string, PropValue>,
  children?: string,
  importPath = `@/components/react-bits/${name}`,
): string {
  const attrs = Object.entries(props)
    .filter(
      (entry): entry is [string, Exclude<PropValue, undefined>] => entry[1] !== undefined,
    )
    .map(([k, v]) => {
      const formatted = formatValue(v)
      return formatted === '' ? k : `${k}=${formatted}`
    })
  const oneLine = `<${name}${attrs.map((a) => ` ${a}`).join('')}`
  // Long prop lists break onto one prop per line, like Prettier would.
  const multiline = oneLine.length > 72
  const open = multiline
    ? `<${name}\n${attrs.map((a) => `  ${a}`).join('\n')}\n`
    : oneLine
  const tag = children
    ? `${open}>\n  ${children}\n</${name}>`
    : `${open}${multiline ? '' : ' '}/>`
  return `import ${name} from '${importPath}'\n\n${tag}`
}
