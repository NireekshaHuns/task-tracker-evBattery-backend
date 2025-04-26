import Log from "../models/Log";
import User from "../models/User";

export const fetchLogs = async (queryParams: any, currentUser: any) => {
  const {
    taskId,
    userId,
    action,
    fromStatus,
    toStatus,
    submitterId,
    startDate,
    endDate,
    limit = 100,
    page = 1,
  } = queryParams;

  const query: any = {};

  if (currentUser.role === "submitter") {
    query.userId = currentUser.id;
  } else if (currentUser.role === "approver" && submitterId) {
    query.userId = submitterId;
  }

  if (taskId) query.taskId = taskId;
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (fromStatus) query.fromStatus = fromStatus;
  if (toStatus) query.toStatus = toStatus;

  // Date range filter
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  // Get total count for pagination
  const total = await Log.countDocuments(query);

  // Get all logs matching the query
  let logs = await Log.find(query);

  // Sort by timestamp (most recent first)
  logs = Log.sort(logs, { timestamp: -1 });

  // Apply pagination manually
  const skip = (Number(page) - 1) * Number(limit);
  const paginatedLogs = logs.slice(skip, skip + Number(limit));

  return {
    logs: paginatedLogs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const fetchSubmitters = async (currentUser: any) => {
  // Validate user role
  if (currentUser.role !== "approver") {
    return null;
  }

  // Get all users with submitter role
  const submitters = await User.find({ role: "submitter" });

  // Map to include only _id and name fields
  const mappedSubmitters = submitters.map((submitter) => ({
    _id: submitter._id,
    name: submitter.name,
  }));

  // Sort by name
  mappedSubmitters.sort((a, b) => a.name.localeCompare(b.name));

  return mappedSubmitters;
};
