import { useTranslation } from 'react-i18next';
import { LuThumbsDown, LuClock, LuActivity, LuCheck } from 'react-icons/lu';

export type ProgressLevel = 'struggling' | 'holding' | 'consistent' | 'mastered';

interface ProgressButtonsProps {
  currentLevel: ProgressLevel;
  onLevelChange: (level: ProgressLevel) => void;
}

export function ProgressButtons({ currentLevel, onLevelChange }: ProgressButtonsProps) {
  const { t } = useTranslation();

  const buttons = [
    {
      level: 'struggling' as const,
      icon: LuThumbsDown,
      label: t('figure:progress.levels.struggling'),
      description: t('figure:progress.descriptions.struggling'),
      color: 'border-red-200 hover:bg-red-50',
      activeColor: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      level: 'holding' as const,
      icon: LuClock,
      label: t('figure:progress.levels.holding'),
      description: t('figure:progress.descriptions.holding'),
      color: 'border-yellow-200 hover:bg-yellow-50',
      activeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    {
      level: 'consistent' as const,
      icon: LuActivity,
      label: t('figure:progress.levels.consistent'),
      description: t('figure:progress.descriptions.consistent'),
      color: 'border-blue-200 hover:bg-blue-50',
      activeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      level: 'mastered' as const,
      icon: LuCheck,
      label: t('figure:progress.levels.mastered'),
      description: t('figure:progress.descriptions.mastered'),
      color: 'border-green-200 hover:bg-green-50',
      activeColor: 'bg-green-100 text-green-800 border-green-200',
    },
  ];

  return (
    <div className='space-y-3'>
      {buttons.map(({ level, icon: Icon, label, description, color, activeColor }) => (
        <button
          key={level}
          onClick={() => onLevelChange(level)}
          className={`w-full p-4 border-2 rounded-lg transition-colors flex items-center gap-4 ${
            currentLevel === level ? activeColor : color
          }`}
        >
          <Icon className='w-6 h-6 flex-shrink-0' />
          <div className='text-left'>
            <div className='font-medium'>{label}</div>
            <div className='text-sm opacity-75'>{description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
