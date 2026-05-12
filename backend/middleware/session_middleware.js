/* 

The logic of this file should:
1.  Check if req.session.user_id exists
2.  Query user_session to find a session that belongs to that user where
    expires_at is in the future and is_mfa_verified = TRUE
3.  If nothing is found => respont with 401 unauthorized
4.  If found => call next() to let the request continue

*/

const pool = require('./db');

// req  := the incoming requests
// res  := the outgoing requests
// next := function to call the next middleware/route
const session_middleware = async (req, res, next) => {

    try {

        if (req.session.user_id) {

            const result = await pool.query(
                'SELECT * FROM User_Session WHERE user_id = ? AND expires_at > NOW() AND is_mfa_verified = TRUE',
                [req.session.user_id]
            );

            const rows = result[0];

            if (rows.length === 0) {
                return res.status(401).json( {error: 'Session not found'} );
            }

            next();



        } else {
            return res.status(401).json( {error: 'Not authenticated'} );
        }
    }

    catch (error) {
        return res.status(500).json( {error: 'Server error'} );
    }
};

module.exports = session_middleware;

/*

For further references check out:

- https://www.w3schools.com/js/js_promise.asp
- https://www.w3schools.com/js/js_json.asp

*/