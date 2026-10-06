import { prerenderToNodeStream } from 'react-dom/static';
import App, { type PageProps } from './App';
export { cases, sections, BASE, SITE, ORIGIN } from './content';
export async function render(props: PageProps) {
  const { prelude } = await prerenderToNodeStream(<App {...props} />);
  const stream = prelude as unknown as AsyncIterable<{ toString(): string }>;
  let html = '';
  for await (const chunk of stream) html += chunk.toString();
  return html;
}
