import type { ReactNode } from 'react';

import type { PromotionTermsPreview } from '@core/api';

interface PromotionTermsLinkProps {
  terms: PromotionTermsPreview;
  children?: ReactNode;
}

/**
 * Link that opens the promotion terms PDF in a new tab. Meant to sit inside a checkbox label (through `Trans`):
 * an anchor inside a label does not tick the checkbox, so reading the terms never accepts them.
 */
export function PromotionTermsLink({ terms, children }: PromotionTermsLinkProps) {
  return (
    <a href={terms.file_url} target='_blank' rel='noopener noreferrer' className='text-info underline'>
      {children}
    </a>
  );
}
