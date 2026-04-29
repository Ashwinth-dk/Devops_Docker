import express from "express";
import supabase from "../utils/supabaseClient.js";
import { io, taskCount } from "../index.js";

const router = express.Router();

// ------------------ Create a new task ------------------
router.post("/", async (req, res) => {
  const { description, deadline, status, employee_ids, project_id } = req.body;

  if (!description || !deadline || !status || !project_id) {
    return res.status(400).json({
      success: false,
      message: "Description, deadline, status, and project ID are required",
    });
  }

  try {
    const { data: newTask, error: taskError } = await supabase
      .from("tasks")
      .insert([
        { description, deadline, status, project_id, created_at: new Date(), updated_at: new Date() },
      ])
      .select()
      .single();

    if (taskError) throw taskError;

    // Assign employees
    if (employee_ids && employee_ids.length > 0) {
      const assignments = employee_ids.map((employee_id) => ({
        task_id: newTask.task_id,
        employee_id,
      }));
      const { error: assignError } = await supabase.from("task_assignments").insert(assignments);
      if (assignError) throw assignError;

      // Real-time notifications
      employee_ids.forEach((employee_id) => {
        io.to(`user_${employee_id}`).emit("taskAssigned", {
          taskId: newTask.task_id,
          status,
          message: `Task #${newTask.task_id} has been assigned to you`,
        });
      });
    }

    // Fetch assigned employees with names
    const { data: assignedEmployees } = await supabase
      .from("task_assignments")
      .select("employee_id, employee(name)")
      .eq("task_id", newTask.task_id);

    newTask.employee_ids = assignedEmployees?.map(e => e.employee_id) || [];
    newTask.employee_names = assignedEmployees?.map(e => e.employee.name) || [];

    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Update a task ------------------
router.put("/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { description, deadline, status, employee_ids, project_id } = req.body;

  try {
    // Update task details
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ description, deadline, status, project_id, updated_at: new Date() })
      .eq("task_id", taskId)
      .select()
      .single();

    if (updateError) return res.status(404).json({ success: false, message: "Task not found" });

    // Update assignments if provided
    if (employee_ids && employee_ids.length > 0) {
      await supabase.from("task_assignments").delete().eq("task_id", taskId);
      const assignments = employee_ids.map((employee_id) => ({ task_id: taskId, employee_id }));
      await supabase.from("task_assignments").insert(assignments);

      // Notify assigned employees
      employee_ids.forEach((employee_id) => {
        io.to(`user_${employee_id}`).emit("taskUpdated", {
          taskId,
          status,
          message: `Task #${taskId} has been updated`,
        });
      });
    }

    // Fetch assigned employees
    const { data: assignedEmployees } = await supabase
      .from("task_assignments")
      .select("employee_id, employee(name)")
      .eq("task_id", taskId);

    updatedTask.employee_ids = assignedEmployees?.map(e => e.employee_id) || [];
    updatedTask.employee_names = assignedEmployees?.map(e => e.employee.name) || [];

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Delete a task ------------------
router.delete("/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    const { data: deletedTask, error } = await supabase
      .from("tasks")
      .delete()
      .eq("task_id", taskId)
      .select()
      .single();

    if (error || !deletedTask) return res.status(404).json({ success: false, message: "Task not found" });

    // Notify assigned employees
    const { data: assignedEmployees } = await supabase
      .from("task_assignments")
      .select("employee_id")
      .eq("task_id", taskId);

    assignedEmployees?.forEach(({ employee_id }) => {
      io.to(`user_${employee_id}`).emit("taskDeleted", {
        taskId,
        message: `Task #${taskId} has been deleted`,
      });
    });

    // Clean up assignments
    await supabase.from("task_assignments").delete().eq("task_id", taskId);

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Get tasks ------------------
router.get("/", async (req, res) => {
  const { project_id } = req.query;

  try {
    let query = supabase.from("tasks").select("*");
    if (project_id) query = query.eq("project_id", project_id);

    const { data: tasks, error } = await query.order("deadline", { ascending: true });
    if (error) throw error;

    // Fetch assignments for each task
    const { data: assignments } = await supabase
      .from("task_assignments")
      .select("task_id, employee_id, employee(name)");

    const assignmentsByTask = {};
    assignments?.forEach((row) => {
      if (!assignmentsByTask[row.task_id]) assignmentsByTask[row.task_id] = { employee_ids: [], employee_names: [] };
      assignmentsByTask[row.task_id].employee_ids.push(row.employee_id);
      assignmentsByTask[row.task_id].employee_names.push(row.employee.name);
    });

    const finalTasks = tasks.map((task) => ({
      ...task,
      ...assignmentsByTask[task.task_id],
    }));

    taskCount.set(tasks.length);
    res.json({ success: true, tasks: finalTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Get ongoing tasks ------------------
router.get("/ongoing", async (req, res) => {
  try {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .neq("status", "Completed")
      .order("deadline", { ascending: true });

    const { data: assignments } = await supabase
      .from("task_assignments")
      .select("task_id, employee_id, employee(name)");

    const assignmentsByTask = {};
    assignments?.forEach((row) => {
      if (!assignmentsByTask[row.task_id]) assignmentsByTask[row.task_id] = { employee_ids: [], employee_names: [] };
      assignmentsByTask[row.task_id].employee_ids.push(row.employee_id);
      assignmentsByTask[row.task_id].employee_names.push(row.employee.name);
    });

    const finalTasks = tasks.map((task) => ({
      ...task,
      ...assignmentsByTask[task.task_id],
    }));

    res.json({ success: true, tasks: finalTasks });
  } catch (error) {
    console.error("Error fetching ongoing tasks:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Get tasks by employee ------------------
router.get("/employee/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    const { data: taskAssignments, error } = await supabase
      .from("task_assignments")
      .select(`
        task_id,
        tasks (
          description,
          deadline,
          status,
          project_id,
          created_at,
          updated_at,
          projects (
            title
          )
        )
      `)
      .eq("employee_id", employeeId);

    if (error) throw error;

    // Format tasks properly
    const formattedTasks = taskAssignments.map((row) => ({
      task_id: row.task_id,
      description: row.tasks?.description || "",
      deadline: row.tasks?.deadline || null,
      status: row.tasks?.status || "pending",
      project_id: row.tasks?.project_id,
      created_at: row.tasks?.created_at,
      updated_at: row.tasks?.updated_at,
      project_title: row.tasks?.projects?.title || "N/A",
    }));

    res.json({ success: true, tasks: formattedTasks });
  } catch (error) {
    console.error("Error fetching tasks for employee:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export { router as taskRouter };
