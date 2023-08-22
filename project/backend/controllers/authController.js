const bcrypt = require('bcrypt');
const db = require('../config/database');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

// 테크의 정보를 주기
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

// 회원가입
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
    // bcrypt를 이용한 해싱
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ message: 'Failed to register' });
            return;
        }

        // Users 테이블에 유저 정보 추가
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

    // Users 테이블에서 해당 이메일을 가진 유저 정보 가져오기

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

        // 입력된 비밀번호와 해싱된 비밀번호 비교
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

// 로그아웃
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

// 로그인 확인
exports.checkLogin = (req, res) => {
    if (req.session.email) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
};

// 아이디 찾기
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
            const token = jwt.sign({ email: user.Email }, process.env.SECRET_KEY, { algorithm: "HS256", expiresIn: '3m' });
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
                const resetLink = `localhost:3000/verifyToken/${token}`;
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

exports.verifyToken = (req, res) => {
    try {
        const { token } = req.params;

        // 토큰 검증 로직
        const tokenQuery = 'SELECT token, expiration FROM Auth WHERE token = ?';
        db.query(tokenQuery, [token], (err, [tokenResults]) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(500).json({ message: '토큰 검증 중 에러가 발생했습니다.' });
            }

            if (!tokenResults) {
                return res.status(400).json({ message: '유효하지 않은 토큰입니다.' });
            }

            const tokenData = tokenResults;
            const now = new Date();
            if (now > tokenData.expiration) {
                return res.status(400).json({ message: '토큰이 만료되었습니다.' });
            }

            // 토큰 디코딩하여 이메일 정보 추출
            const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
            const userEmail = decodedToken.email;

            return res.status(200).json({ message: '유효한 토큰입니다.', email: userEmail });
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ message: '토큰 검증 중 에러가 발생했습니다.' });
    }
};


exports.updatePassword = (req, res) => {
    try {
        const { token, password } = req.body;

        // 토큰 디코딩하여 이메일 정보 추출
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userEmail = decodedToken.email;

        // 비밀번호 해싱
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error('Error hashing password:', hashErr);
                return res.status(500).json({ message: '비밀번호 업데이트 중 에러가 발생했습니다.' });
            }

            // 비밀번호 업데이트 쿼리 및 실행
            const updateQuery = 'UPDATE Users SET Password = ? WHERE Email = ?';
            db.query(updateQuery, [hashedPassword, userEmail], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error updating password:', updateErr);
                    return res.status(500).json({ message: '비밀번호 업데이트 중 에러가 발생했습니다.' });
                }

                if (updateResult.affectedRows === 0) {
                    return res.status(400).json({ message: '비밀번호 업데이트 실패' });
                }

                // 비밀번호 업데이트 성공 시 Auth 테이블에서 해당 토큰 삭제
                const deleteAuthQuery = 'DELETE FROM Auth WHERE token = ?';
                db.query(deleteAuthQuery, [token], (deleteErr) => {
                    if (deleteErr) {
                        console.error('Error deleting token:', deleteErr);
                        return res.status(500).json({ message: '비밀번호 업데이트 중 에러가 발생했습니다.' });
                    }

                    return res.redirect('/login');
                });
            });
        });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: '비밀번호 업데이트 중 에러가 발생했습니다.' });
    }
};