import { client } from '../client.js';

export const getWeeklyAnnualLeaveData = async (req, res) => {
    try {
        // PostgreSQL의 CURRENT_DATE 타입은 YYYY-MM-DD 포맷으로 날짜 저장하므로 YYYY-MM-DD 포맷 고민
        const nowMilliSec = new Date();
        const nowDate = nowMilliSec.toISOString().substring(0, 10);

        // 오늘 날짜 포함 총 7일 뒤의 Date를 구해준다.
        const after1WeeksDate = new Date(nowMilliSec.setDate(nowMilliSec.getDate() + 6)).toISOString().substring(0, 10);

        const { rows: weeklyAnnualLeaveData } = await client.query(`
            SELECT  annual_leave_history.id as annual_leave_id,
                    employee.id as employee_id,
                    employee_name, 
                    TO_CHAR(start_date,'YYYY-MM-DD') as start_date, 
                    TO_CHAR(finish_date,'YYYY-MM-DD') as finish_date, 
                    TRUNC(how_long,1) as how_long
            FROM    annual_leave_history 
            INNER   JOIN  employee 
                    ON employee.id=annual_leave_history.employee_id 
                    WHERE start_date BETWEEN '${nowDate}' AND '${after1WeeksDate}'
            ORDER   BY start_date DESC
        `);
        return res.status(200).json({ weeklyAnnualLeaveData });
    } catch {
        return res.status(404);
    }
}

export const createAnnualLeaveData = async (req, res) => {
    try {
        const { employeeId, startDate, finishDate, howLong } = req.body;
        const { rows: annualLeaveData } = await client.query(`
            INSERT INTO annual_leave_history (
                employee_id, 
                start_date, 
                finish_date, 
                how_long
            )
            VALUES (
                ${+employeeId}, 
                '${startDate}', 
                '${finishDate}', 
                ${+howLong}
            )
            RETURNING   id as annual_leave_id, 
                        employee_id,
                        TO_CHAR(start_date,'YYYY-MM-DD') as start_date, 
                        TO_CHAR(finish_date,'YYYY-MM-DD') as finish_date, 
                        TRUNC(how_long,1) as how_long
        `);
        await client.query(`
            UPDATE  employee 
            SET     annual_leave=annual_leave-${howLong} 
            WHERE   id=${employeeId}
        `);
        return res.status(201).json({ annualLeaveData: annualLeaveData[0] });
    } catch {
        return res.sendStatus(400);
    }
}

export const updateAnnualLeaveData = async (req, res) => {
    try {
        const {
            params: { id },
            body: { employeeId, startDate, finishDate, beforeHowLong, afterHowLong }
        } = req;

        await client.query(`
            UPDATE  employee
            SET     annual_leave=annual_leave+${beforeHowLong}-${afterHowLong}
            WHERE   id=${employeeId}
        `);
        await client.query(`
            UPDATE  annual_leave_history
            SET     start_date='${startDate}',
                    finish_date='${finishDate}',
                    how_long=${afterHowLong},
                    updated_at=NOW()
            WHERE   id=${id}
        `);

        return res.sendStatus(200);
    } catch {
        return res.sendStatus(400);
    }
}

export const deleteAnnualLeaveData = async (req, res) => {
    try {
        const {
            params: { id },
            body: { employeeId, howLong }
        } = req;

        client.query(`
            DELETE  FROM annual_leave_history
            WHERE   id=${id}
        `);
        client.query(`
            UPDATE  employee
            SET     annual_leave=annual_leave+${howLong}
            WHERE   id=${employeeId}
        `);

        return res.sendStatus(200);
    } catch (error) {
        return res.sendStatus(400);
    }
}