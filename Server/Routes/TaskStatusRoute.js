import express from "express";
import supabase from "../utils/supabaseClient.js";
import { io } from "../index.js";

const router = express.Router();

/**
 * PUT /taskstatus/:taskId
 * Update the status of a task.
 */
router.put("/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  try {
    // 1. Fetch the task from Supabase
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // 2. Update the task status
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date() })
      .eq("task_id", taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Fetch assigned employees
    const { data: assignedEmployees } = await supabase
      .from("task_assignments")
      .select("employee_id")
      .eq("task_id", taskId);

    // 4. Notify all assigned employees via Socket.IO
    assignedEmployees?.forEach(({ employee_id }) => {
      io.to(`user_${employee_id}`).emit("taskUpdated", {
        taskId,
        status,
        message: `Task #${taskId} has been updated`,
      });
    });

    return res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

export { router as taskStatusRouter };
