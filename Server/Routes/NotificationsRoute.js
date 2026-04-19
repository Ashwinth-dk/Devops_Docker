import express from "express";
import supabase from "../utils/supabaseClient.js";

const router = express.Router();

// ------------------ Fetch notifications ------------------
router.get("/", async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Create a new notification ------------------
router.post("/", async (req, res) => {
  const { message } = req.body;

  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([{ message, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export { router as notificationRouter };
