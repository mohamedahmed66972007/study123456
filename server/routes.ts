import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  insertFileSchema,
  insertExamWeekSchema,
  insertExamSchema,
  insertQuizSchema,
  insertQuizAttemptSchema,
  insertUserSchema,
  insertFriendRequestSchema
} from "@shared/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // Auth Routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const isValid = await storage.validateAdmin(username, password);

    if (isValid) {
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // File Routes
  app.get("/api/files", async (req: Request, res: Response) => {
    try {
      const subject = req.query.subject as string | undefined;
      const semester = req.query.semester as string | undefined;

      let files = await storage.getFiles();

      if (subject && subject !== "all") {
        files = files.filter(file => file.subject === subject);
      }

      if (semester && semester !== "all") {
        files = files.filter(file => file.semester === semester);
      }

      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(500).json({ message: "Failed to get files" });
    }
  });

  app.get("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json(file);
    } catch (error) {
      console.error("Error getting file:", error);
      res.status(500).json({ message: "Failed to get file" });
    }
  });

  app.post("/api/files", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("File upload request:", {
        title: req.body.title,
        subject: req.body.subject,
        semester: req.body.semester,
        fileName: req.file.originalname
      });

      const fileData = {
        title: req.body.title,
        subject: req.body.subject,
        semester: req.body.semester,
        fileName: req.file.originalname,
        filePath: ""  // Will be set in the storage implementation
      };

      // Create file with proper validation
      const parseResult = insertFileSchema.safeParse({
        title: req.body.title,
        subject: req.body.subject,
        semester: req.body.semester,
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.originalname}`
      });

      if (!parseResult.success) {
        console.error("Validation error:", parseResult.error);
        return res.status(400).json({ 
          message: "Invalid file data", 
          errors: parseResult.error.errors 
        });
      }

      // Create file entry in storage
      const file = await storage.createFile(
        parseResult.data,
        req.file.buffer
      );

      res.status(201).json(file);
    } catch (error) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.delete("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFile(id);

      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }

      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Exam Week Routes
  app.get("/api/exam-weeks", async (_req: Request, res: Response) => {
    try {
      const examWeeks = await storage.getExamWeeks();
      res.json(examWeeks);
    } catch (error) {
      console.error("Error getting exam weeks:", error);
      res.status(500).json({ message: "Failed to get exam weeks" });
    }
  });

  app.post("/api/exam-weeks", async (req: Request, res: Response) => {
    try {
      const parseResult = insertExamWeekSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid exam week data", 
          errors: parseResult.error.errors 
        });
      }

      const examWeek = await storage.createExamWeek(parseResult.data);
      res.status(201).json(examWeek);
    } catch (error) {
      console.error("Error creating exam week:", error);
      res.status(500).json({ message: "Failed to create exam week" });
    }
  });

  app.delete("/api/exam-weeks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteExamWeek(id);

      if (!deleted) {
        return res.status(404).json({ message: "Exam week not found" });
      }

      res.status(200).json({ message: "Exam week deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam week:", error);
      res.status(500).json({ message: "Failed to delete exam week" });
    }
  });

  // Exam Routes
  app.get("/api/exams", async (req: Request, res: Response) => {
    try {
      const weekId = req.query.weekId ? parseInt(req.query.weekId as string) : undefined;

      let exams;
      if (weekId) {
        exams = await storage.getExamsByWeek(weekId);
      } else {
        exams = await storage.getExams();
      }

      res.json(exams);
    } catch (error) {
      console.error("Error getting exams:", error);
      res.status(500).json({ message: "Failed to get exams" });
    }
  });

  app.post("/api/exams", async (req: Request, res: Response) => {
    try {
      const parseResult = insertExamSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid exam data", 
          errors: parseResult.error.errors 
        });
      }

      const exam = await storage.createExam(parseResult.data);
      res.status(201).json(exam);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  app.delete("/api/exams/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteExam(id);

      if (!deleted) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.status(200).json({ message: "Exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // Quiz Routes
  app.get("/api/quizzes", async (_req: Request, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error getting quizzes:", error);
      res.status(500).json({ message: "Failed to get quizzes" });
    }
  });

  app.get("/api/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuiz(id);

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error getting quiz:", error);
      res.status(500).json({ message: "Failed to get quiz" });
    }
  });

  app.get("/api/quizzes/code/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const quiz = await storage.getQuizByCode(code);

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error getting quiz by code:", error);
      res.status(500).json({ message: "Failed to get quiz" });
    }
  });

  app.post("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const parseResult = insertQuizSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid quiz data", 
          errors: parseResult.error.errors 
        });
      }

      const quiz = await storage.createQuiz(parseResult.data);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.delete("/api/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuiz(id);

      if (!deleted) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Quiz Attempts Routes
  app.get("/api/quiz-attempts/:quizId", async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const attempts = await storage.getQuizAttempts(quizId);
      res.json(attempts);
    } catch (error) {
      console.error("Error getting quiz attempts:", error);
      res.status(500).json({ message: "Failed to get quiz attempts" });
    }
  });

  app.post("/api/quiz-attempts", async (req: Request, res: Response) => {
    try {
      const parseResult = insertQuizAttemptSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid quiz attempt data", 
          errors: parseResult.error.errors 
        });
      }

      const attempt = await storage.createQuizAttempt(parseResult.data);
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      res.status(500).json({ message: "Failed to create quiz attempt" });
    }
  });

  // Visitor counter
  let visitorsCount = 0;

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    
    // Only count visits to main pages
    if (path === '/' || path === '/files' || path === '/exams' || path === '/quizzes') {
      visitorsCount++;
    }

    next();
  });

    app.get("/api/visitors", async (_req: Request, res: Response) => {
    try {
      res.json({ visitors: visitorsCount });
    } catch (error) {
      console.error("Error getting visitors:", error);
      res.status(500).json({ message: "Failed to get visitors" });
    }
  });

  // Friends API Routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: parseResult.error.errors 
        });
      }

      const user = await storage.createUser(parseResult.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error && error.message === "User ID already exists") {
        res.status(409).json({ message: "هذا المعرف مستخدم بالفعل، يرجى اختيار معرف آخر" });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/friend-requests", async (req: Request, res: Response) => {
    try {
      const parseResult = insertFriendRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid friend request data", 
          errors: parseResult.error.errors 
        });
      }

      const request = await storage.sendFriendRequest(parseResult.data);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error sending friend request:", error);
      if (error instanceof Error && error.message === "Friend request already exists") {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to send friend request" });
      }
    }
  });

  app.get("/api/friend-requests/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error getting friend requests:", error);
      res.status(500).json({ message: "Failed to get friend requests" });
    }
  });

  app.put("/api/friend-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.updateFriendRequest(id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating friend request:", error);
      res.status(500).json({ message: "Failed to update friend request" });
    }
  });

  app.get("/api/friends/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ message: "Failed to get friends" });
    }
  });

  app.delete("/api/friends/:userId/:friendId", async (req: Request, res: Response) => {
    try {
      const { userId, friendId } = req.params;
      await storage.removeFriend(userId, friendId);
      res.status(200).json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // Get friend's study schedule
  app.get("/api/friends/:friendId/schedule", async (req: Request, res: Response) => {
    try {
      const friendId = req.params.friendId;
      // This would return the friend's study schedule from localStorage equivalent
      // For now, we'll return a placeholder
      res.json({ message: "Friend's schedule endpoint - to be implemented with real-time updates" });
    } catch (error) {
      console.error("Error getting friend's schedule:", error);
      res.status(500).json({ message: "Failed to get friend's schedule" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import express from "express";