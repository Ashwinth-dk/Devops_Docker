import express from "express";
import supabase from "../utils/supabaseClient.js";

const router = express.Router();

// GET /clients - Fetch all clients
router.get("/", async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .order("client_id", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// POST /clients - Add a new client
router.post("/", async (req, res) => {
  const { name, contact_person, email, phone, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Name and email are required",
    });
  }

  try {
    const { data: client, error } = await supabase
      .from("clients")
      .insert([
        {
          name,
          contact_person,
          email,
          phone,
          address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, client });
  } catch (error) {
    console.error("Error adding client:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// DELETE /clients/:clientId - Delete a client
router.delete("/:clientId", async (req, res) => {
  const { clientId } = req.params;

  try {
    const { data: deletedClient, error } = await supabase
      .from("clients")
      .delete()
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;

    if (!deletedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export { router as clientsRouter };
