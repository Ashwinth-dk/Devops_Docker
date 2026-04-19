import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import Employee from "./components/Employee";
import Category from "./components/Category";
import ManageAdmin from "./components/ManageAdmin";
import AddCategory from "./components/AddCategory";
import AddEmployee from "./components/AddEmployee";
import EditEmployee from "./components/EditEmployee";
import Start from "./components/Start";
import EmployeeLogin from "./components/EmployeeLogin";
import EmployeeDetail from "./components/EmployeeDetail";
import PrivateRoute from "./components/PrivateRoute";
import Office from "./components/Office";
import AdminProjects from "./components/PMT/AdminProjects";
import AdminTasks from "./components/PMT/AdminTasks";
import Clients from "./components/PMT/Clients";
import Payroll from "./components/Payroll";
import OperatorLogin from "./components/OperatorLogin"
function App() {
  const employeeId = 1; // Replace with actual logged-in employee ID from context or state

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/adminlogin" element={<Login />} />
        <Route path="/operatorlogin" element={<OperatorLogin />} />
        <Route path="/employeelogin" element={<EmployeeLogin />} />
        <Route
          path="/employeedetail/:id"
          element={
            <PrivateRoute>
              <EmployeeDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          {/* Nested Routes under /dashboard */}
          <Route path="" element={<Home />} />
          <Route path="employee" element={<Employee />} />
          <Route path="category" element={<Category />} />
          <Route path="manageadmin" element={<ManageAdmin />} />
          <Route path="add_category" element={<AddCategory />} />
          <Route path="add_employee" element={<AddEmployee />} />
          <Route path="edit_employee/:id" element={<EditEmployee />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="clients" element={<Clients />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="officeaddress" element={<Office />} />
          <Route path="payroll" element={<Payroll employeeId={employeeId} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
