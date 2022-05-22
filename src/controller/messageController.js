import { client } from '../client.js';

export const createMessage = async (req, res) => {
    try {
        const { employeeId, receivedMessage } = req.body;
        let roomId = null;
        const { rows: selectedRoom } = await client.query(`
            SELECT  id 
            FROM    room 
            WHERE   sender_id=${employeeId}
        `);
        if (selectedRoom.length === 0) {
            const { rows: roomData } = await client.query(`
                INSERT INTO room (
                    sender_id
                )
                VALUES (
                    ${employeeId}
                )
                RETURNING id
            `);
            roomId = roomData[0].id;
        } else {
            roomId = selectedRoom[0].id;
        }
        const { rows: messageData } = await client.query(`
            INSERT INTO message (
                message,
                room_id,
                employee_id
            )
            VALUES (
                '${receivedMessage}',
                ${roomId},
                ${employeeId}
            )
            RETURNING id
        `);
        console.log(messageData);
        return res.status(201).json({ messageData })
    } catch {
        return res.sendStatus(400);
    }
}