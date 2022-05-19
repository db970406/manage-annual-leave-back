import express from 'express';
import { deleteEmployeeData, getAllEmployeeData, getDetailEmployeeData, getSearchEmployeeData, updateEmployeeData, createEmployeeData } from '../controller/employeeController.js';

const employeeRouter = express.Router();

employeeRouter.get("/all", getAllEmployeeData);
employeeRouter.post("/search", getSearchEmployeeData);
employeeRouter.post("/create", createEmployeeData);
employeeRouter.put("/:id/update", updateEmployeeData);
employeeRouter.delete("/:id/delete", deleteEmployeeData);
employeeRouter.get("/:id", getDetailEmployeeData);

export default employeeRouter;