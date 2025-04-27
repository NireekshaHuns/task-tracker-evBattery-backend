import { Request, Response } from "express";
import { fetchLogs, fetchSubmitters } from "../services/LogService";

// Get all logs based on query parameters
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await fetchLogs(req.query, req.user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get list of submitters (approvers only)
export const getSubmitters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const submitters = await fetchSubmitters(req.user);

    if (submitters === null) {
      res.status(403).json({ message: "Access denied - approvers only" });
      return;
    }

    res.json(submitters);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
