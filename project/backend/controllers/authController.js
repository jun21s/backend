const bcrypt = require('bcrypt');
const db = require('../config/database');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

exports.getTechStack = (req, res) => {
    db.query('SELECT tech FROM Tech', (err, techStackData) => {
        if (err) {
            console.error('Error fetching tech stack:', err);
            res.status(500).json({ message: 'Failed to fetch tech stack' });
        } else {
            const techStack = techStackData.map(item => item.tech);
            res.status(200).json({ techStack });
        }
    });
};

exports.register = (req, res) => {
    const { name, email, password, type, phone, techs, onOffline } = req.body;
    switch (onOffline) {
        case 'online':
            onOffValue = 'ON';
            break;
        case 'offline':
            onOffValue = 'OFF';
            break;
        default:
            onOffValue = null;
            break;
    }
    // 비밀번호 암호화
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ message: 'Failed to register' });
            return;
        }

        // Users 테이블에 회원 정보 추가
        db.query('INSERT INTO Users (Name, Email, Password, CooperationType, Phone, OnOff) VALUES (?, ?, ?, ?, ?, ?);', [name, email, hashedPassword, type, phone, onOffValue], (err, result) => {
            if (err) {
                console.error('Error adding user:', err);
                res.status(500).json({ message: 'Failed to register' });
                return;
            }

            techs.forEach(tech => {
                db.query('SELECT id FROM Tech WHERE tech = ?;', [tech], (err, dbTechId) => {
                    if (err) {
                        console.error('Error getting tech ID:', err);
                        res.status(500).json({ message: 'Failed to register' });
                        return;
                    }

                    if (dbTechId.length > 0) {
                        const techID = dbTechId[0].id;
                        db.query('INSERT INTO UsersTech (UserID, TechID) VALUES (?, ?);', [email, techID], (err, result) => {
                            if (err) {
                                console.error('Error adding user tech:', err);
                            }
                        });
                    }
                });
            });

            res.redirect('/login');
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    // Users 테이블에서 해당 이메일을 가진 사용자 정보 가져오기

    db.query('SELECT Email, Password FROM Users WHERE Email = ?;', [email], (err, userData) => {
        if (err) {
            console.error('Error fetching user data:', err);
            res.status(500).json({ message: 'Failed to login' });
            return;
        }

        if (userData.length === 0) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        const hashedPassword = userData[0].Password;

        // 입력된 비밀번호와 저장된 해시된 비밀번호 비교
        bcrypt.compare(password, hashedPassword, (err, result) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).json({ message: 'Failed to login' });
                return;
            }

            if (result) {
                // 로그인 성공 시 세션에 사용자 정보 저장
                req.session.email = email;
                res.redirect('/');
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        });
    });
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ message: 'Failed to log out' });
        } else {
            res.clearCookie('connect.sid'); // 세션 쿠키 삭제
            res.status(200).json({ message: 'Logged out successfully' });
        }
    });
};


exports.checkLogin = (req, res) => {
    if (req.session.email) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
};

exports.searchId = (req, res) => {
    const { name, phone } = req.body;
    console.log(req);
    const query = 'SELECT Email FROM Users WHERE Name = ? AND Phone = ?';
    db.query(query, [name, phone], (err, results) => {
        console.log(results);
        if (err) {
            console.error('Error executing query:', err);
            res.json({ error: 'An error occurred while fetching data' });
            return;
        }
        if (results.length === 0) {
            res.json({ email: null });
        } else {
            const email = results[0].Email;
            res.json({ email });
        }
    });
};

exports.searchPassword = (req, res) => {
    const { email, phone } = req.body;
    const query = 'SELECT Email FROM Users WHERE Email = ? AND Phone = ?';
    db.query(query, [email, phone], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.json({ error: 'An error occurred while fetching data' });
            return;
        }
        if (results.length === 0) {
            res.json({ email: null });
        } else if (results.length === 1) {
            const user = results[0];
            const token = jwt.sign({ email: user.Email }, process.env.SECRET_KEY, { expiresIn: '3m' });

            // Auth 테이블에 토큰 정보 저장
            const expiration = new Date(Date.now() + 3 * 60 * 1000); // 3분 후
            const authQuery = 'INSERT INTO Auth (token, expiration) VALUES (?, ?)';
            db.query(authQuery, [token, expiration], (authErr, authResult) => {
                if (authErr) {
                    console.error('Error saving token to Auth table:', authErr);
                    res.status(500).json({ message: 'Failed to initiate password reset' });
                    return;
                }

                // 이메일 전송 및 응답 처리
                const resetLink = `localhost:3000/updatePassword/${token}`;
                const emailSubject = 'Password Reset';
                const emailHtml = `Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a>`;
                authService.sendEmail(user.Email, emailSubject, emailHtml);
                res.json({ email: user.Email });
            });
        } else {
            res.json({ email: null });
        }
    });
};

exports.updatePassword = (req, res) => {
    const { token } = req.params;

    // 토큰 검증 로직이 필요합니다.
    const updateQuery = 'UPDATE Users SET Password = ? WHERE Email = ?';

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

        // 토큰 검증이 성공하면 비밀번호 업데이트를 진행합니다.
        const { email } = decodedToken;
        const { password } = req.body;

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                res.status(500).json({ message: 'Failed to update password' });
                return;
            }

            // Update the password in the Users table
            db.query(updateQuery, [hashedPassword, email], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error updating password:', updateErr);
                    res.status(500).json({ message: 'Failed to update password' });
                    return;
                }

                // 비밀번호 업데이트 성공 시 Auth 테이블에서 해당 토큰 삭제
                const deleteAuthQuery = 'DELETE FROM Auth WHERE token = ?';
                db.query(deleteAuthQuery, [token], (deleteErr, deleteResult) => {
                    if (deleteErr) {
                        console.error('Error deleting token from Auth table:', deleteErr);
                    }

                    res.redirect('/login'); // Redirect to login page after password update
                });
            });
        });
    } catch (error) {
        // 토큰이 유효하지 않을 경우에 대한 처리를 여기에 작성합니다.
        res.status(400).send('Invalid token');
    }
};
