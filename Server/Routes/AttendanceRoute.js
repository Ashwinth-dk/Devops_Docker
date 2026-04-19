import express from "express";
import supabase from "../utils/supabaseClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Count present employees (who have clocked in today)
    const { data: presentData, error: presentError } = await supabase
      .from("clock_records")
      .select("id", { count: "exact" })
      .eq("clock_in::date", today);

    if (presentError) throw presentError;

    const presentCount = presentData?.length || 0;

    // Count total employees
    const { data: employeesData, error: employeeError } = await supabase
      .from("employee")
      .select("id", { count: "exact" });

    if (employeeError) throw employeeError;

    const totalEmployees = employeesData?.length || 0;
    const absentCount = totalEmployees - presentCount;

    res.status(200).json({
      success: true,
      attendance: {
        present: presentCount,
        absent: absentCount,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export { router as attendanceRouter };
