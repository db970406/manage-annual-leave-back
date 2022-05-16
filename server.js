import express from "express";
import { client } from './client.js';
import annualLeaveRouter from './router/annualLeaveRouter.js';
import employeeRouter from './router/employeeRouter.js';

const app = express();

const PORT = 21012;

app.use("/static", express.static(process.cwd() + "/src/front/assets"));
app.use(express.json());

// CORS 설정
app.all('/*', (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:20012");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Content-Type");
    next();
});

app.use("/employee", employeeRouter);
app.use("/annual-leave", annualLeaveRouter);

client.connect((error) => console.log(error ? error : "DB Connected!"));
app.listen(PORT, () => console.log(`API Server on ${PORT}`));