'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medichain_secure_jwt_secret_token_faculty_demo_2026';

/**
 * Verify JWT Token Middleware
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access Denied: Missing authentication token.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Access Forbidden: Invalid or expired authentication token.'
        });
    }
}

/**
 * Role-Based Access Control Middleware
 */
function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User authentication required.'
            });
        }

        // Super Admin has access to all routes
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Role "${req.user.role}" does not have permission to access this resource. Required roles: ${allowedRoles.join(', ')}.`
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};

