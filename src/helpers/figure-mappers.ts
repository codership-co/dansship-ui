import { DifficultyType } from '@core/api';

export type DisplayDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

/**
 * Maps API difficulty values to display-friendly difficulty labels
 */
export const mapDifficultyToDisplay = (difficulty: DifficultyType): DisplayDifficulty => {
  switch (difficulty) {
    case 'basic':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'intermediate-advance':
    case 'advance':
      return 'Advanced';
    default:
      return 'Beginner';
  }
};

/**
 * Maps display difficulty labels back to API difficulty values
 */
export const mapDisplayToDifficulty = (display: DisplayDifficulty): DifficultyType => {
  switch (display) {
    case 'Beginner':
      return 'basic';
    case 'Intermediate':
      return 'intermediate';
    case 'Advanced':
      return 'advance';
    default:
      return 'basic';
  }
};
