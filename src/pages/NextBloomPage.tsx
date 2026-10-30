import { NextBloom } from '../components/home/NextBloom';
import { usePageMeta } from '../hooks/dom';

/** /next-bloom: homepage moment 5 at page scale. The page variant carries the h1 and its own spacing. */
export function NextBloomPage() {
  usePageMeta('Next bloom', 'Which colour should bloom next? Vote from the colours Whimy Babes asked for, and join the list.');
  return <NextBloom variant="page" />;
}
