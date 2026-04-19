import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import supabase from "../utils/supabaseClient.js";

dotenv.config();
const router = express.Router();

// ---------------- Multer setup for employee images ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images"),
  filename: (req, file, cb) =>
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ---------------- Login Admin ----------------
router.post("/adminlogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("admin")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ loginStatus: false, error: "Incorrect Email or Password" });

    const token = jwt.sign({ role: "admin", email: user.email, id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000, secure: true });
    return res.status(200).json({ loginStatus: true, message: "Logged in" ,role: "admin"});
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Logout ----------------
router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  return res.json({ Status: true });
});

// ---------------- Admin CRUD ----------------
router.get("/admin_records", async (req, res) => {
  try {
    const { data, error } = await supabase.from("admin").select("*");
    if (error) throw error;
    res.json({ Status: true, Result: data });
  } catch (error) {
    console.error(error);
    res.json({ Status: false, Error: "Failed to fetch admin records" });
  }
});

router.post("/add_admin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from("admin").insert([{ email, password: hashedPassword }]).select().single();
    if (error) throw error;
    res.status(200).json({ success: true, message: "Admin added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add admin" });
  }
});

router.put("/edit_admin/:id", async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  try {
    const { data, error } = await supabase.from("admin").update({ email }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, message: "Admin updated successfully", admin: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update admin" });
  }
});

router.delete("/delete_admin/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("admin").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete admin" });
  }
});

// ---------------- Employee CRUD ----------------
router.post("/add_employee", upload.single("image"), async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const { data, error } = await supabase.from("employee").insert([{
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      address: req.body.address,
      salary: req.body.salary,
      image: req.file.filename,
      category_id: req.body.category_id
    }]).select().single();

    if (error) throw error;
    res.status(200).json({ success: true, message: "Employee added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add employee" });
  }
});

router.get("/employee", async (req, res) => {
  try {
    const { data, error } = await supabase.from("employee").select("*");
    if (error) throw error;
    res.json({ success: true, Result: data });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to fetch employees" });
  }
});

router.get("/employee/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("employee").select("*").eq("id", id).single();
    if (error) throw error;
    res.json({ success: true, Result: data });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to fetch employee" });
  }
});

router.put("/edit_employee/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, salary, address, category_id } = req.body;
  try {
    const { data, error } = await supabase.from("employee").update({ name, email, salary, address, category_id }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, message: "Employee updated successfully", employee: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update employee" });
  }
});

router.delete("/delete_employee/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: emp, error: empError } = await supabase.from("employee").select("image").eq("id", id).single();
    if (empError) throw empError;

    if (emp?.image) fs.unlinkSync(`public/images/${emp.image}`);

    const { error } = await supabase.from("employee").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete employee" });
  }
});

// ---------------- Category CRUD ----------------
router.get("/category", async (req, res) => {
  try {
    const { data, error } = await supabase.from("category").select("*");
    if (error) throw error;
    res.json({ success: true, categories: data });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to load category" });
  }
});

router.post("/add_category", async (req, res) => {
  const { name } = req.body;
  try {
    const { data, error } = await supabase.from("category").insert([{ name }]).select().single();
    if (error) throw error;
    res.json({ success: true, message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add category" });
  }
});

// ---------------- Counts for Dashboard ----------------
router.get("/admin_count", async (req, res) => {
  try {
    const { data, error } = await supabase.from("admin").select("id", { count: "exact" });
    if (error) throw error;
    res.json({ Status: true, Result: [{ admin: data.length }] });
  } catch (error) {
    console.error(error);
    res.json({ Status: false, Error: "Failed to fetch admin count" });
  }
});

router.get("/employee_count", async (req, res) => {
  try {
    const { data, error } = await supabase.from("employee").select("id", { count: "exact" });
    if (error) throw error;
    res.json({ Status: true, Result: [{ employee: data.length }] });
  } catch (error) {
    console.error(error);
    res.json({ Status: false, Error: "Failed to fetch employee count" });
  }
});

router.get("/salary_count", async (req, res) => {
  try {
    const { data, error } = await supabase.from("employee").select("salary");
    if (error) throw error;
    const totalSalary = data.reduce((acc, emp) => acc + (emp.salary || 0), 0);
    res.json({ Status: true, Result: [{ salaryOFEmp: totalSalary }] });
  } catch (error) {
    console.error(error);
    res.json({ Status: false, Error: "Failed to fetch salary count" });
  }
});


router.post("/operatorlogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("data_operator")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.password !== password) {
      return res.status(401).json({
        loginStatus: false,
        error: "Incorrect Email or Password",
      });
    }

    const token = jwt.sign(
      { role: "data_operator", email: user.email, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000, secure: true });

    return res.status(200).json({ loginStatus: true, message: "Logged in", role: "data_operator" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export { router as adminRouter };
