import { Figure } from '@core/api';

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800',
    basic: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    'intermediate-advance': 'bg-orange-100 text-orange-800',
    advance: 'bg-red-100 text-red-800',
  };

  return colors[difficulty] || colors.basic;
};

export const filterFigures = (
  figures: Array<Figure>,
  filters: {
    difficulty?: string;
    type?: string;
    search?: string;
  },
): Array<Figure> => {
  return figures.filter(figure => {
    const matchesDifficulty = !filters.difficulty || figure.difficulty === filters.difficulty;
    const matchesType = !filters.type || figure.type === filters.type;
    const matchesSearch = !filters.search || figure.name.toLowerCase().includes(filters.search.toLowerCase());

    return matchesDifficulty && matchesType && matchesSearch;
  });
};

export const sortFigures = (figures: Array<Figure>, sortBy: 'name' | 'difficulty' = 'name'): Array<Figure> => {
  return [...figures].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }

    const difficultyOrder: Record<string, number> = {
      Beginner: 1,
      Intermediate: 2,
      Advanced: 3,
      basic: 1,
      intermediate: 2,
      'intermediate-advance': 3,
      advance: 4,
    };

    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
};
