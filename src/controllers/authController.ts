import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { validatePassword } from "../utils/passwordValidation";

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, password, role } = req.body;

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).json({ message: passwordError });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    // Create and save new user
    const user = new User({
      name,
      username,
      password,
      role,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Log in an existing user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check if user's role matches
    if (user.role !== role) {
      res.status(403).json({
        message: `You don't have access as ${role}. Your account is registered as a ${user.role}.`,
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
