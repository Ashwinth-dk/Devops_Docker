import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../utils/supabaseClient.js"; // your supabaseClient.js

const router = express.Router();

// ======================= LOGIN =======================
router.post("/employeelogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: employees, error } = await supabase
      .from("employee")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    if (employees.length > 0) {
      const user = employees[0];
      const storedHashedPassword = user.password;

      const passwordsMatch = await bcrypt.compare(password, storedHashedPassword);

      if (passwordsMatch) {
        const token = jwt.sign(
          { role: "employee", email: user.email, id: user.id },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: 3600000,
          secure: true,
        });

        return res.status(200).json({
          loginStatus: true,
          message: "You are logged in",
          id: user.id,
        });
      } else {
        return res
          .status(401)
          .json({ loginStatus: false, error: "Incorrect Email or Password" });
      }
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ======================= EMPLOYEE DETAIL =======================
router.get("/detail/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase
      .from("employee")
      .select("*")
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, Result: data });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.json({ success: false, message: "Failed to fetch employee" });
  }
});

// ======================= LOGOUT =======================
router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  return res.json({ Status: true });
});

// ======================= CLOCK-IN STATUS =======================
router.get("/employee_is_clocked_in/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("clock_records")
      .select("*")
      .eq("employee_id", id)
      .is("clock_out", null);

    if (error) throw error;

    return res.status(200).json({ clockedIn: data.length > 0 });
  } catch (error) {
    console.error("Error while checking clock-in status:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ======================= CLOCK-IN =======================
router.post("/employee_clockin/:id", async (req, res) => {
  const { id } = req.params;
  const { location, work_from_type } = req.body;

  try {
    const { error } = await supabase.from("clock_records").insert([
      {
        employee_id: id,
        clock_in: new Date(),
        location,
        work_from_type,
      },
    ]);

    if (error) throw error;

    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error while clocking in:", error);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// ======================= CLOCK-OUT =======================
router.post("/employee_clockout/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("clock_records")
      .update({ clock_out: new Date() })
      .eq("employee_id", id)
      .is("clock_out", null);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error while clocking out:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ======================= CALENDAR =======================
router.get("/calendar/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    const { data, error } = await supabase
      .from("clock_records")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) throw error;

    const calendarData = data.map((row) => {
      let date = null;
      let dayName = null;
      if (row.clock_in) {
        const clockInDate = new Date(row.clock_in);
        date = !isNaN(clockInDate) ? clockInDate.toISOString().slice(0, 10) : null;
        dayName = !isNaN(clockInDate) ? clockInDate.toLocaleDateString("en-US", { weekday: "long" }) : null;
      }
      return {
        date,
        dayName,
        clockIn: row.clock_in,
        clockOut: row.clock_out,
        location: row.location,
        workFromType: row.work_from_type,
      };
    });

    res.status(200).json({ success: true, calendarData });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ======================= CATEGORY =======================
router.get("/category/:id", async (req, res) => {
  const categoryId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    if (error) throw error;

    res.status(200).json({ success: true, category: data });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ======================= OFFICE LOCATIONS =======================
router.get("/office_location", async (req, res) => {
  try {
    const { data, error } = await supabase.from("office_locations").select("*");
    if (error) throw error;

    res.status(200).json({ success: true, officeLocations: data });
  } catch (error) {
    console.error("Error fetching office locations:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/office_location", async (req, res) => {
  const { name, latitude, longitude, address } = req.body;

  try {
    const { data, error } = await supabase
      .from("office_locations")
      .insert([{ name, latitude, longitude, address }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, officeLocation: data });
  } catch (error) {
    console.error("Error adding office location:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.delete("/office_location/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const { error } = await supabase.from("office_locations").delete().eq("id", id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Office location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting office location:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ======================= EMPLOYEE LIST =======================
router.get("/employee/list", async (req, res) => {
  try {
    const { data, error } = await supabase.from("employee").select("id, name, role");
    if (error) throw error;

    res.status(200).json({ success: true, employees: data });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
// ======================= PAYROLL =======================
router.get("/payroll/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    // 1. Fetch employee details (daily wage, name)
    const { data: employee, error: empError } = await supabase
      .from("employee")
      .select("id, name, daily_wage")
      .eq("id", employeeId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // 2. Fetch clock records for this employee
    const { data: records, error: recError } = await supabase
      .from("clock_records")
      .select("clock_in, clock_out")
      .eq("employee_id", employeeId);

    if (recError) throw recError;

    // 3. Count unique days where employee clocked in & out
    const uniqueDays = new Set();
    records.forEach((entry) => {
      if (entry.clock_in && entry.clock_out) {
        const day = new Date(entry.clock_in).toDateString();
        uniqueDays.add(day);
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

export { router as employeeRouter };
