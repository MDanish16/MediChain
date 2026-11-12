'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, query, run } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'medichain_secure_jwt_secret_token_faculty_demo_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Login user and issue JWT
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required.'
            });
        }

        const user = await get('SELECT * FROM users WHERE username = ?', [username.trim().toLowerCase()]);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            organization: user.organization,
            mspId: user.mspId
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Record in audit log
        await run(
            'INSERT INTO audit_logs (action, performed_by, role, details) VALUES (?, ?, ?, ?)',
            ['USER_LOGIN', user.username, user.role, `Successful login by ${user.username} (${user.organization})`]
        );

        return res.json({
            success: true,
            message: 'Authentication successful.',
            token: token,
            user: payload
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
}

/**
 * Get current authenticated user profile
 */
async function getCurrentUser(req, res) {
    try {
        const user = await get(
            'SELECT id, username, email, role, organization, mspId, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        return res.json({
            success: true,
            user: user
        });
    } catch (err) {
        console.error('Profile fetch error:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user profile.'
        });
    }
}

/**
 * List all users (Super Admin only)
 */
async function listUsers(req, res) {
    try {
        const users = await query('SELECT id, username, email, role, organization, mspId, created_at FROM users ORDER BY id ASC');
        return res.json({
            success: true,
            users: users
        });
    } catch (err) {
        console.error('List users error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve user directory.'
        });
    }
}

/**
 * Logout
 */
async function logout(req, res) {
    if (req.user) {
        await run(
            'INSERT INTO audit_logs (action, performed_by, role, details) VALUES (?, ?, ?, ?)',
            ['USER_LOGOUT', req.user.username, req.user.role, `Logged out`]
        );
    }
    return res.json({
        success: true,
        message: 'Successfully logged out.'
    });
}

module.exports = {
    login,
    getCurrentUser,
    listUsers,
    logout
};

