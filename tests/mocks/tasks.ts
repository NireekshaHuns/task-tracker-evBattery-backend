// Mock task data for testing
export const mockTasks = {
  pendingTask: {
    title: "Pending Test Task",
    description: "This is a pending test task",
    status: "pending" as const,
  },
  approvedTask: {
    title: "Approved Test Task",
    description: "This is an approved test task",
    status: "approved" as const,
  },
  rejectedTask: {
    title: "Rejected Test Task",
    description: "This is a rejected test task",
    status: "rejected" as const,
  },
  doneTask: {
    title: "Done Test Task",
    description: "This is a completed test task",
    status: "done" as const,
  },
};
