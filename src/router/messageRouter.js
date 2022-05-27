import express from 'express';
import { createMessage, getRoom, getRoomInfo, getRooms, updateRead } from '../controller/messageController.js';

const messageRouter = express.Router();

messageRouter.post("/create", createMessage);
messageRouter.get("/rooms", getRooms);
messageRouter.get("/rooms/employee/:employeeId", getRoomInfo);
messageRouter.get("/rooms/:employeeId", getRoom);
messageRouter.put("/read", updateRead);


export default messageRouter;