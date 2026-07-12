import {
  FigureCatalogMobileFilters,
  FigureCatalogResults,
  FigureCatalogSidebarFilters,
  FiguresHeader,
} from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { useFigures } from '@hooks';

function FiguresPage() {
  const { filters, setFilters, figures, isLoading, hasMore, total, loadNextPage } = useFigures();

  return (
    <main className='min-h-dvh mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 pt-20'>
      <FiguresHeader />
      <FigureCatalogMobileFilters filters={filters} setFilters={setFilters} />
      <section className='flex flex-col gap-6 lg:flex-row lg:gap-10'>
        <FigureCatalogSidebarFilters filters={filters} setFilters={setFilters} />
        <FigureCatalogResults
          filters={filters}
          setFilters={setFilters}
          figures={figures}
          isLoading={isLoading}
          hasMore={hasMore}
          total={total || figures.length}
          loadNextPage={loadNextPage}
        />
      </section>
    </main>
  );
}

export const SecureFiguresPage = SecurityGuard(FiguresPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isFiguresPageEnabled],
});
