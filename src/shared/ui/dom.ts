type AttrValue = string | number | boolean | undefined;
type Child = Node | string | null | false | undefined;

/**
 * Safe element builder. String children become text nodes (never parsed as HTML), and
 * inline event-handler attributes are rejected, so untrusted data cannot become markup.
 * Class strings must be constants from shared/ui, never built from user data.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, AttrValue> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (name.toLowerCase().startsWith('on'))
      throw new Error(`Inline handler "${name}" is not allowed`);
    if (name === 'class') el.className = String(value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
}
