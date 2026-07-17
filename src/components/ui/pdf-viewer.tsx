import { PDFViewer as EmbedPDFViewer, ScrollStrategy, ZoomMode } from '@embedpdf/react-pdf-viewer';

interface PdfViewerProps {
  url: string;
}

export function PDFViewer({ url }: PdfViewerProps) {
  return (
    <section className=' grid'>
      <section className='w-full aspect-75/100 rounded-2xl shadow-2xl overflow-hidden'>
        <EmbedPDFViewer
          style={{ width: '100%', height: '100%' }}
          config={{
            src: url,
            i18n: {
              defaultLocale: 'es',
              fallbackLocale: 'en',
            },
            zoom: {
              defaultZoomLevel: ZoomMode.FitWidth,
            },
            theme: {
              preference: 'light',
              light: {
                accent: {
                  primary: '#FFFFFF',
                },
                background: {
                  app: 'var(--color-secondary-100)',
                  surface: 'var(--color-primary-200)',
                  surfaceAlt: 'var(--color-primary-200)',
                },
                interactive: {
                  hover: 'var(--color-primary-400)',
                  active: 'blue',
                  selected: 'var(--color-primary-400)',
                  focus: 'yellow',
                },
                foreground: {
                  primary: '#ffffff',
                  secondary: '#ffffff',
                  muted: 'var(--color-primary)',
                  disabled: 'blue',
                  onAccent: 'var(--color-primary-700)',
                },
              },
            },
            scroll: {
              defaultStrategy: ScrollStrategy.Vertical,
              defaultPageGap: 1,
            },
            disabledCategories: [
              'annotation',
              'form',
              'redaction',
              'insert',
              'panel',
              'settings',
              'page',
              'document-open',
              'document-close',
              'document-fullscreen',
              'security',
            ],
          }}
        />
      </section>
    </section>
  );
}
