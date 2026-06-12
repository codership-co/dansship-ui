import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LuX, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { toast } from 'sonner';

import { ProgressButtons, ProgressLevel } from './progress-buttons';

import { Button } from '@components/ui';
import { DansshipAPI, FigureProgress } from '@core/api';
import { formatDate } from '@helpers';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  figureId: number;
}

export function ProgressModal({ isOpen, onClose, figureId }: ProgressModalProps) {
  const { t, i18n } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [currentLevel, setCurrentLevel] = useState<ProgressLevel>('struggling');
  const [isSaving, setIsSaving] = useState(false);
  const [progressHistory, setProgressHistory] = useState<Array<FigureProgress>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProgressHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await DansshipAPI.figures.getFigureProgress(figureId);

      if (data) {
        setProgressHistory(data.items);

        // Set current level from most recent progress entry
        if (data.items.length > 0) {
          const mostRecent = data.items[0];
          setCurrentLevel(mostRecent.level);
        }
      }
    } catch {
      toast.error('Failed to load progress:');
    } finally {
      setIsLoading(false);
    }
  }, [figureId]);

  useEffect(() => {
    if (isOpen && figureId) {
      loadProgressHistory();
    }
  }, [isOpen, figureId, loadProgressHistory]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await DansshipAPI.figures.createFigureProgress(figureId, {
        level: currentLevel,
        notes: currentNote || null,
      });

      // Reload progress history
      await loadProgressHistory();

      // Reset form
      setCurrentNote('');

      onClose();
    } catch {
      toast.error(t('common:error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-gray-900'>{t('figure:progress.title')}</h2>
          <Button
            onClick={onClose}
            variant='ghost'
            size='icon'
            type='button'
            className='text-gray-500 hover:text-gray-700'
          >
            <LuX className='w-6 h-6' />
          </Button>
        </div>

        <div className='p-6 space-y-6'>
          {isLoading ? (
            <div className='text-center py-8 text-gray-500'>{t('common:loading')}</div>
          ) : (
            <>
              <ProgressButtons currentLevel={currentLevel} onLevelChange={setCurrentLevel} />

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('figure:progress.howYouFeelToday')}
                </label>
                <textarea
                  value={currentNote}
                  onChange={e => setCurrentNote(e.target.value)}
                  rows={3}
                  className='w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500'
                  placeholder={t('figure:progress.notePlaceholder')}
                />
              </div>

              {progressHistory.length > 0 && (
                <div>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    type='button'
                    variant='ghost'
                    className='px-0 text-purple-600 hover:text-purple-700'
                  >
                    {showHistory ? <LuChevronUp /> : <LuChevronDown />}
                    {t('figure:progress.history')} ({progressHistory.length})
                  </Button>

                  {showHistory && (
                    <div className='mt-4 border rounded-lg overflow-hidden'>
                      <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='bg-gray-50'>
                          <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                              {t('figure:progress.date')}
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                              {t('figure:progress.level')}
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                              {t('figure:progress.note')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {progressHistory.map(entry => (
                            <tr key={entry.id}>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                {formatDate(entry.updated_at, i18n.language)}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                {t(`figure:progress.levels.${entry.level}`)}
                              </td>
                              <td className='px-6 py-4 text-sm text-gray-900'>{entry.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className='flex justify-end gap-4 pt-4 border-t'>
                <Button onClick={onClose} type='button' variant='outline' disabled={isSaving}>
                  {t('common:cancel')}
                </Button>
                <Button onClick={handleSave} type='button' disabled={isSaving}>
                  {isSaving ? t('common:saving') : t('common:save')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
