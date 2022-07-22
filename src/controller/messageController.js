import { client } from '../client.js';

const HR_MANAGER_ID = 891274;
export const createMessage = async (req, res) => {
    try {
        const { employeeId, receivedMessage, managerId } = req.body;
        const { rows: selectedRoom } = await client.query(`
            SELECT  id 
            FROM    room 
            WHERE   sender_id=${employeeId}
        `);
        const roomId = selectedRoom[0].id;
        const { rows: messageData } = await client.query(`
            INSERT  INTO message (
                message,
                room_id,
                employee_id
            )
            VALUES  (
                '${receivedMessage}',
                ${roomId},
                ${managerId || employeeId}
            )
            RETURNING   id as message_id,
                        room_id,
                        (
                            SELECT  employee_name
                            FROM    employee
                            WHERE   id=employee_id
                        ) as employee_name
        `);
        return res.status(201).json({ messageData: messageData[0] })
    } catch {
        return res.sendStatus(400);
    }
}

export const getRooms = async (req, res) => {
    const { rows: roomsData } = await client.query(`
        SELECT  room.id as room_id,
                employee.id as employee_id,
                employee.employee_name,
                (
                    SELECT  CAST(COUNT(CASE WHEN read='f' THEN 1 END) AS INTEGER)
                    FROM    message
                    WHERE   room.id = room_id
                            AND employee_id != 891274
                ) as unreadcount
        FROM    room
        INNER   JOIN employee
                ON   employee.id=room.sender_id
        ORDER   BY unreadcount DESC;
    `);
    return res.status(200).json({ roomsData });
}

export const getRoom = async (req, res) => {
    const { employeeId } = req.params;

    const { rows: checkExistRoom } = await client.query(`
        SELECT  id as room_id,
                sender_id as employee_id
        FROM    room
        WHERE   sender_id=${employeeId}
    `);

    const findRoomId = checkExistRoom[0].room_id;
    const findEmployeeId = checkExistRoom[0].employee_id;

    const { rows: messagesData } = await client.query(`
        SELECT  employee.id as employee_id,
                employee.employee_name,
                message.message,
                message.created_at
        FROM    message
        INNER   JOIN employee
                ON message.employee_id=employee.id
        WHERE   room_id=${findRoomId}
        ORDER   BY message.created_at ASC
    `);
    return res.status(200).json({
        messagesData,
        roomId: findRoomId,
        employeeId: findEmployeeId,
    });
}

export const getRoomInfo = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (+employeeId === HR_MANAGER_ID) {
            const { rows: roomId } = await client.query(`
                SELECT  id as room_id
                FROM    room
                WHERE   hr_manager_id=${employeeId}
            `);
            const { rows: roomData } = await client.query(`
                SELECT  COUNT(CASE WHEN read='f' THEN 1 END) as unreadcount
                FROM    message
                WHERE   employee_id != ${employeeId}
            `);

            const roomsIdArray = roomId.map(room => room.room_id)
            return res.status(200).json({
                roomData: {
                    unreadcount: roomData[0].unreadcount,
                    roomId: roomsIdArray
                }
            });
        } else {
            const { rows: checkExistRoom } = await client.query(`
                SELECT  id as room_id,
                        sender_id as employee_id
                FROM    room
                WHERE   sender_id=${employeeId}
            `);
            if (checkExistRoom.length === 0) {
                await client.query(`
                    INSERT INTO room (
                        sender_id
                    )
                    VALUES  (
                        ${employeeId}
                    )
                `);
            }
            const { rows: roomId } = await client.query(`
                SELECT  id as room_id
                FROM    room
                WHERE   sender_id=${employeeId}
            `);

            const { rows: roomData } = await client.query(`
                SELECT  COUNT(CASE WHEN read='f' THEN 1 END) as unreadcount
                FROM    message
                WHERE   room_id = ${roomId[0].room_id}
                        AND employee_id != ${employeeId}
            `);
            return res.status(200).json({
                roomData: {
                    unreadcount: roomData[0].unreadcount,
                    roomId: roomId[0].room_id
                }
            });
        }
    } catch (error) {
        return res.sendStatus(404)
    }
}

export const updateRead = async (req, res) => {
    const { employeeId, roomId } = req.body;
    await client.query(`
        UPDATE  message
        SET     read='t'
        WHERE   room_id = ${roomId}
                AND employee_id != ${employeeId}
    `);

    if (+employeeId === HR_MANAGER_ID) {
        const { rows: getUnReadCount } = await client.query(`
            SELECT  COUNT(CASE WHEN read='f' THEN 1 END) as unreadcount
            FROM    message
            WHERE   employee_id != ${employeeId}
        `);
        return res.status(200).json({ unreadcount: getUnReadCount[0].unreadcount });
    } else {
        const { rows: getUnReadCount } = await client.query(`
            SELECT  COUNT(CASE WHEN read='f' THEN 1 END) as unreadcount
            FROM    message
            WHERE   room_id = ${roomId}
                    AND employee_id != ${employeeId}
        `);
        return res.status(200).json({ unreadcount: getUnReadCount[0].unreadcount });
    }
}