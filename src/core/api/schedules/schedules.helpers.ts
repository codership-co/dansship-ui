import type { AgendaEvent } from './schedules.models';

export interface AgendaConflict {
  id: string;
  roomId: string;
  overlapStart: string;
  overlapEnd: string;
  events: [AgendaEvent, AgendaEvent];
  severity: 'high' | 'medium' | 'low';
}

function isOverlapping(first: AgendaEvent, second: AgendaEvent): boolean {
  const firstStart = new Date(first.start_time).getTime();
  const firstEnd = new Date(first.end_time).getTime();
  const secondStart = new Date(second.start_time).getTime();
  const secondEnd = new Date(second.end_time).getTime();

  return firstStart < secondEnd && secondStart < firstEnd;
}

function buildConflictSeverity(first: AgendaEvent, second: AgendaEvent): 'high' | 'medium' | 'low' {
  if (first.event_type === 'blocked_space' || second.event_type === 'blocked_space') {
    return 'high';
  }

  if (first.event_type === 'studio_class' || second.event_type === 'studio_class') {
    return 'medium';
  }

  return 'low';
}

export function buildAgendaConflicts(events: Array<AgendaEvent>): Array<AgendaConflict> {
  const byRoom = new Map<string, Array<AgendaEvent>>();

  events.forEach(event => {
    const current = byRoom.get(event.room_id);

    if (current) {
      current.push(event);

      return;
    }

    byRoom.set(event.room_id, [event]);
  });

  const conflicts: Array<AgendaConflict> = [];

  byRoom.forEach((roomEvents, roomId) => {
    const orderedEvents = [...roomEvents].sort(
      (left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime(),
    );

    for (let index = 0; index < orderedEvents.length; index += 1) {
      const current = orderedEvents[index];

      for (let compareIndex = index + 1; compareIndex < orderedEvents.length; compareIndex += 1) {
        const candidate = orderedEvents[compareIndex];

        if (!isOverlapping(current, candidate)) {
          const currentEnd = new Date(current.end_time).getTime();
          const candidateStart = new Date(candidate.start_time).getTime();

          if (candidateStart >= currentEnd) {
            break;
          }

          continue;
        }

        const overlapStart = new Date(
          Math.max(new Date(current.start_time).getTime(), new Date(candidate.start_time).getTime()),
        ).toISOString();
        const overlapEnd = new Date(
          Math.min(new Date(current.end_time).getTime(), new Date(candidate.end_time).getTime()),
        ).toISOString();

        conflicts.push({
          id: `${roomId}:${current.source_id}:${candidate.source_id}:${overlapStart}`,
          roomId,
          overlapStart,
          overlapEnd,
          events: [current, candidate],
          severity: buildConflictSeverity(current, candidate),
        });
      }
    }
  });

  return conflicts.sort(
    (left, right) => new Date(left.overlapStart).getTime() - new Date(right.overlapStart).getTime(),
  );
}
