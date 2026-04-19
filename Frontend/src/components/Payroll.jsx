import React, { useEffect, useState } from "react";
import "./Payroll.css";
import axios from "axios";

function Payroll() {
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch employee list for dropdown
  useEffect(() => {
    axios
      .get(`${apiUrl}/auth/employee`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setEmployeeList(res.data.Result);
          if (res.data.Result.length > 0) {
            setSelectedEmployeeId(res.data.Result[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching employee list:", err));
  }, []);

  // Fetch selected employee info and attendance
  useEffect(() => {
    if (!selectedEmployeeId) return;

    // Employee info
    axios
      .get(`${apiUrl}/employee/detail/${selectedEmployeeId}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success && res.data.Result.length > 0) {
          setEmployee(res.data.Result[0]);
        }
      })
      .catch((err) => console.error("Error fetching employee:", err));

    // Attendance data
    axios
      .get(`${apiUrl}/employee/calendar/${selectedEmployeeId}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) setAttendance(res.data.calendarData);
      })
      .catch((err) => console.error("Error fetching attendance:", err));
  }, [selectedEmployeeId]);

  // Payroll calculation
  const monthlySalary = employee?.salary || 0;
  const dailyWage = monthlySalary / 30; // Calculate daily wage from monthly salary
  const daysWorked = attendance.filter((record) => record.clockIn && record.clockOut).length;
  const totalSalary = dailyWage * daysWorked;

  return (
    <div className="payroll-container">
      <h2>Payroll for {employee?.name || "Employee"}</h2>

      {/* Employee selector */}
      <div className="employee-select">
        <label htmlFor="employeeSelect">Select Employee:</label>
        <select
          id="employeeSelect"
          value={selectedEmployeeId || ""}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
        >
          {employeeList.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} 
            </option>
          ))}
        </select>
      </div>

      {/* Payroll Summary */}
      <div className="payroll-summary">
        <p>Days Worked: {daysWorked}</p>
        <p>Daily Wage: {dailyWage.toFixed(2)}</p>
        <p>Total Salary: {totalSalary.toFixed(2)}</p>
      </div>

      {/* Attendance Table */}
      <h3>Attendance Details:</h3>
      {attendance.length === 0 ? (
        <p className="no-attendance">No attendance records available.</p>
      ) : (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Location</th>
              <th>Work From Type</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record, index) => (
              <tr key={index}>
                <td>{record.date || "-"}</td>
                <td>{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : "-"}</td>
                <td>{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : "-"}</td>
                <td>{record.location || "-"}</td>
                <td>{record.workFromType || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Payroll;
