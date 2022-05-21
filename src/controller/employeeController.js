import { client } from '../client.js';

// 직책 순서 신중하게 넣어야 된다.
const getPositionId = (position) => {
    const positionIds = [null, "대표", "이사", "수석", "책임", "주임", "사원", "인턴"];
    return positionIds.findIndex((item) => item === position);
}

// 부서 순서 신중하게 넣어야 된다.
const getDepartmentId = (department) => {
    const departmentIds = [null, "경영지원", "공공R&D", "마켓인텔리전스", "백엔드", "프론트엔드", "3D모델링", "경량시뮬", "PM"];
    return departmentIds.findIndex((item) => item === department);
}
export const getAllEmployeeData = async (req, res) => {
    try {
        const { rows: employeesData } = await client.query(`
            SELECT  id, 
                    employee_name 
            FROM    employee 
            ORDER   BY id ASC
        `);

        return res.status(200).json({ employeesData });
    } catch {
        return res.sendStatus(404);
    }
}

export const getDetailEmployeeData = async (req, res) => {
    try {
        const { id } = req.params;

        const { rows: employeeData } = await client.query(`
            SELECT  id, 
                    email,
                    employee_name,
                    phone_number,
                    TRUNC(annual_leave,1) as annual_leave,
                    TO_CHAR(join_date,'YYYY-MM-DD') as join_date,
                    department_id,
                    position_id
            FROM    employee 
            WHERE   id=${id}
        `);
        const { rows: annualLeaveHistoriesData } = await client.query(`
            SELECT  id as annual_leave_id,
                    TO_CHAR(start_date,'YYYY-MM-DD') as start_date, 
                    TO_CHAR(finish_date,'YYYY-MM-DD') as finish_date, 
                    TRUNC(how_long,1) as how_long
            FROM    annual_leave_history 
            WHERE   employee_id=${id} 
            ORDER   BY start_date ASC
        `);

        return res.status(200).json({
            employeeData: employeeData[0],
            annualLeaveHistoriesData
        });
    } catch {
        return res.sendStatus(404);
    }
}

// 한국이름이다보니 파라미터로 보내는 것은 불가
export const getSearchEmployeeData = async (req, res) => {
    try {
        const { name } = req.body;

        const { rows: employeesData } = await client.query(`
            SELECT  id, 
                    email,
                    employee_name,
                    phone_number,
                    TRUNC(annual_leave,1) as annual_leave,
                    TO_CHAR(join_date,'YYYY-MM-DD') as join_date,
                    department_id,
                    position_id
            FROM    employee 
            WHERE   employee_name
                    LIKE '%${name}%'
            ORDER   BY id ASC
        `);

        if (employeesData.length > 1) {
            return res.status(200).json({ employeesData });
        } else {
            const { rows: annualLeaveHistoriesData } = await client.query(`
            SELECT  id,
                    employee_id, 
                    TO_CHAR(start_date,'YYYY-MM-DD') as start_date, 
                    TO_CHAR(finish_date,'YYYY-MM-DD') as finish_date, 
                    TRUNC(how_long,1) as how_long
            FROM    annual_leave_history 
            WHERE   employee_id=${employeesData[0].id} 
            ORDER   BY start_date ASC`
            );
            return res.status(200).json({
                employeesData: employeesData[0],
                annualLeaveHistoriesData
            });
        }
    } catch {
        return res.sendStatus(404);
    }
}

export const deleteEmployeeData = async (req, res) => {
    try {
        const { id } = req.params;
        await client.query(`
            DELETE  FROM employee 
            WHERE   id=${id}
        `);

        return res.sendStatus(200);
    } catch {
        return res.sendStatus(400);
    }
}

export const createEmployeeData = async (req, res) => {
    try {
        const { name, position, email, phone_number, join_date, department } = req.body;

        const positionId = getPositionId(position);
        const departmentId = getDepartmentId(department);
        const { rows: employeeData } = await client.query(`
            INSERT INTO employee (
                employee_name,
                email,
                phone_number,
                join_date,
                position_id,
                department_id
            )
            VALUES (   
                '${name}',
                '${email}',
                '${phone_number}',
                '${join_date}',
                ${positionId},
                ${departmentId}
            )
            RETURNING   id
        `);

        return res.status(201).json({ newEmployeeId: employeeData[0].id });
    } catch {
        // 유니크는 이메일만 걸려있으므로 이메일 에러일 수 밖에 없다
        return res.sendStatus(400);
    }
}

export const updateEmployeeData = async (req, res) => {
    try {
        const {
            body: { name, position, email, phone_number, join_date, department, annual_leave },
            params: { id }
        } = req;

        const positionId = getPositionId(position);
        const departmentId = getDepartmentId(department);
        await client.query(`
            UPDATE  employee
            SET     employee_name='${name}',
                    email='${email}',
                    phone_number='${phone_number}',
                    join_date='${join_date}',
                    position_id=${positionId},
                    department_id=${departmentId},
                    annual_leave=${annual_leave},
                    updated_at=NOW()
            WHERE   id=${id}
        `);
        return res.sendStatus(200);
    } catch (error) {
        // 프론트에서도 한 번 유효성 검사를 거치게 해놨긴함
        return res.sendStatus(400);
    }

}