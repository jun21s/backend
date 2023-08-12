const bcrypt = require('bcrypt');
const db = require('../config/database');
const session = require('express-session');

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

exports.findId = (req, res) => {
    const { name, phone } = req.body;
    console.log(name, phone);
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




exports.findPassword = (req, res) => {
    const { email, password } = req.body;
    
}


