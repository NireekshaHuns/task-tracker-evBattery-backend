import { Request, Response } from "express";
import { fetchLogs, fetchSubmitters } from "../services/LogService";

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await fetchLogs(req.query, req.user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

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
    console.error("Error fetching submitters:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
