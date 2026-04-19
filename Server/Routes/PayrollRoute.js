// Server/Routes/PayrollRoute.js
import express from "express";
import supabase from "../utils/supabaseClient.js";

const router = express.Router();

router.get("/payroll/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    // 1️⃣ Fetch employee info
    const { data: employee, error: empError } = await supabase
      .from("employee")
      .select("id, name, daily_wage")
      .eq("id", employeeId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // 2️⃣ Fetch clock records
    const { data: records, error: recError } = await supabase
      .from("clock_records")
      .select("clock_in, clock_out")
      .eq("employee_id", employeeId);

    if (recError) throw recError;

    // 3️⃣ Count unique days worked
    const uniqueDays = new Set();
    records.forEach(entry => {
      if (entry.clock_in && entry.clock_out) {
        uniqueDays.add(new Date(entry.clock_in).toDateString());
      }
    });

    const daysWorked = uniqueDays.size;
    const totalSalary = daysWorked * employee.daily_wage;

    return res.status(200).json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        dailyWage: employee.daily_wage,
      },
      daysWorked,
      totalSalary,
    });
  } catch (error) {
    console.error("Error calculating payroll:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
