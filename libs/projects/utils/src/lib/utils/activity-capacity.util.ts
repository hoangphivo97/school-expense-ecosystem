import { ActivityCapacityMetrics, BaseActivityItem } from "@school-expense-ecosystem/projects/types";

export function calculateActivityCapacity(
  item: Pick<BaseActivityItem<any, any>, 'joinedStudentIds' | 'joinConfig'>
): ActivityCapacityMetrics {
  const participantCount = item.joinedStudentIds?.length ?? 0;
  const maxParticipants = item.joinConfig?.maxUses;
  const enrollmentPercentage = maxParticipants
    ? Math.min(Math.round((participantCount / maxParticipants) * 100), 100)
    : undefined;

  return {
    participantCount,
    maxParticipants,
    enrollmentPercentage,
    isCapacityFull: maxParticipants ? participantCount >= maxParticipants : false,
  };
}