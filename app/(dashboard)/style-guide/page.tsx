import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { StyleGuideDemo } from '@/components/common/style-guide-demo';

export const metadata: Metadata = { title: 'Style Guide' };

export default function StyleGuidePage() {
  return (
    <>
      <PageHeader
        title="Style Guide"
        description="UI shell components and states introduced in Phase 1.5."
      />
      <StyleGuideDemo />
    </>
  );
}
