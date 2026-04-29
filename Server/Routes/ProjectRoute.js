import express from "express";
import supabase from "../utils/supabaseClient.js";
import { projectCount } from "../index.js";

const router = express.Router();

// ------------------ Get ongoing projects (last 7 days) ------------------
router.get("/ongoing", async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .gte("created_at", oneWeekAgo.toISOString())
      .order("start_date", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching ongoing projects:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Get all projects ------------------
router.get("/", async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .order("project_id", { ascending: true });

    if (error) throw error;

    projectCount.set(projects.length);
    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Get single project by ID ------------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("project_id", id)
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Create a new project ------------------
router.post("/", async (req, res) => {
  console.log("Received project payload:", req.body);
  try {
    const { data: project, error } = await supabase
      .from("projects")
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Update a project by ID ------------------
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    status,
    completion_date,
    start_date,
    priority,
    client_id,
  } = req.body;

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .update({
        title,
        description,
        status,
        completion_date,
        start_date,
        priority,
        client_id,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ------------------ Delete a project by ID ------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .delete()
      .eq("project_id", id)
      .select()
      .single();

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export { router as projectRouter };
