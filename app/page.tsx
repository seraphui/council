import CouncilApp from '@/components/CouncilApp';
import { InfiniteGridBackground } from '@/components/ui/the-infinite-grid';

export default function Home() {
  return (
    <InfiniteGridBackground>
      <CouncilApp />
    </InfiniteGridBackground>
  );
}
