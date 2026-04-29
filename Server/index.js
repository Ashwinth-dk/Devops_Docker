  import express from "express";
  import cors from "cors";
  import { adminRouter } from "./Routes/AdminRoute.js";
  import { employeeRouter } from "./Routes/EmployeeRoute.js";
  import PayrollRoute from "./Routes/PayrollRoute.js";
  import { projectRouter } from "./Routes/ProjectRoute.js";
  import { taskRouter } from "./Routes/TaskRoute.js";
  import { clientsRouter } from "./Routes/ClientsRoute.js";
  import { taskStatusRouter } from "./Routes/TaskStatusRoute.js";
  import { notificationRouter } from "./Routes/NotificationsRoute.js";
  import { attendanceRouter } from "./Routes/AttendanceRoute.js";
  import jwt from "jsonwebtoken";
  import cookieParser from "cookie-parser";
  import http from "http";
  import { Server } from "socket.io";
  import dotenv from "dotenv";
import { collectDefaultMetrics, register, Gauge } from "prom-client";
dotenv.config();

const app = express();

collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
export const employeeCount = new Gauge({ name: 'organizeme_employee_count', help: 'Total number of employees' });
export const projectCount = new Gauge({ name: 'organizeme_project_count', help: 'Total number of projects' });
export const clientCount = new Gauge({ name: 'organizeme_client_count', help: 'Total number of clients' });
export const taskCount = new Gauge({ name: 'organizeme_task_count', help: 'Total number of tasks' });

// Metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

  // Middleware to verify user authentication
  const verifyUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ Status: false, Error: "Not Authenticated" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ Status: false, Error: "Invalid Token" });
      }

      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  };

  // Routes setup
  app.use("/auth", adminRouter);
  app.use("/employee", employeeRouter);
  app.use("/employee", employeeRouter);
  app.use("/employee", PayrollRoute);
  app.use("/projects", projectRouter);
  app.use("/tasks", taskRouter);
  app.use("/clients", clientsRouter);
  app.use("/taskstatus", taskStatusRouter);
  app.use("/notifications", notificationRouter);
  app.use("/attendance", attendanceRouter);

  // Verify route
  app.get("/verify", verifyUser, (req, res) => {
    return res.json({ Status: true, role: req.role, id: req.id });
  });

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  export const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173", // Use env variable for client URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // Socket.io connection handler
  io.on("connection", (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);

    // Listen for a "join" event to place a user in a room
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
    });

    // Add error handling for Socket.io
    socket.on("error", (err) => {
      console.error("Socket Error:", err);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected with socket ID: ${socket.id}`);
    });
  });

  // Start server on port
  const port = process.env.PORT || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
