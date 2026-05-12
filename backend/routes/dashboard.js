

const express = require('express');
const router = express.Router();
const pool = require('../db');
const session_middleware = require('../middleware/sessionMiddleware');

// GET /api/session

/* 

This router returns the current user's info and IP addresses so the dashboard
can populate the header and session bar.

It performs:
1.  Query Users to get username, first_name, last_name for req.session.user_id
2.  Query User_Session to get ip_address for that user
3.  Return both as JSON

*/

router.get('/session', session_middleware, async(req, res) => {

    try {

        //  QUERY USERS
        const result = await pool.query(
            'SELECT username, first_name, last_name FROM Users WHERE user_id = ?',
            [req.session.user_id]
        );
        const rows = result[0];

        if (rows.length === 0) {
            return res.status(401).json( {error: 'Session not found.'} );
        }


        // QUERY USER_SESSION
        const result2 = await pool.query(
            'SELECT ip_address FROM User_Session WHERE user_id = ?',
            [req.session.user_id]
        );
        const sessionRows = result2[0];

        if (sessionRows.length === 0) {
            return res.status(401).json( {error: 'Session not found.'} );
        }

        // RETURN RESPONSE AS JSON
        return res.status(200).json({
            username: rows[0].username,
            first_name: rows[0].first_name,
            last_name: rows[0].last_name,
            ip: sessionRows[0].ip_address
        });

    } catch (error) {

        return res.status(500).json( {error: 'Server error'} );

    }
});

// GET /api/audit-log

/*

    This router returns all of the current user's security events from Audit_Log
    so the dashboard table can display them.

    It performs:
    1.  Query Audit_Log for all rows where user_id = req.session.user_id
    2.  Order them newest first
    3.  Return the results as JSON

*/
router.get('/audit-log', session_middleware, async(req, res) => {


    try {

        const [rows] = await pool.query(
            'SELECT * FROM Audit_Log WHERE user_id = ? ORDER BY timestamp DESC',
            [req.session.user_id]
        );
        
        return res.status(200).json(rows);

    }
    catch (error) {

        return res.status(500).json( {error: 'Server error'} );

    }

});


// POST /api/logout

/*

    This router deletes the user's session from User_Session and destroys
    the session cookie so they cannot make authenticated requests anymore.

*/
router.post('/logout', session_middleware, async(req, res) => {


    try {

        await pool.query(
            'DELETE FROM User_Session WHERE user_id = ?',
            [req.session.user_id]
        );
        
        req.session.destroy((error) => {
            if (error) {
                return res.status(500).json({ error: 'Could not log out.' });
            }
            return res.status(200).json({ message: 'Logged out successfully.' });
        });

    }
    catch (error) {

        return res.status(500).json( {error: 'Server error'} );

    }

});


module.exports = router;