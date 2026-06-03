import type { AdminFigure, Figure } from './figures.models';

export function transformFigure(apiFigure: Figure): Figure {
  return {
    ...apiFigure,
    image: apiFigure.image_url || '',
    tips: apiFigure.tips || [],
    prerequisites: [],
    duration: '',
  };
}

export function transformAdminFigure(apiFigure: AdminFigure): AdminFigure {
  return {
    ...apiFigure,
    image: apiFigure.image_url || '',
    tips: apiFigure.tips || [],
    prerequisites: [],
    duration: '',
  };
}
