import express from 'express';
import { createAnnualLeaveData, updateAnnualLeaveData, deleteAnnualLeaveData, getWeeklyAnnualLeaveData } from '../controller/annualLeaveController.js';

const annualLeaveRouter = express.Router();

annualLeaveRouter.get("/all", getWeeklyAnnualLeaveData);
annualLeaveRouter.post("/create", createAnnualLeaveData);
annualLeaveRouter.put("/:id/update", updateAnnualLeaveData);
annualLeaveRouter.delete("/:id/delete", deleteAnnualLeaveData);

export default annualLeaveRouter;