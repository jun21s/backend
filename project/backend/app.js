const express = require('express');
const session = require('express-session');
const cors = require('cors'); // cors 패키지 불러오기
const path = require('path');
require('dotenv').config();
const app = express();
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');

// CORS 설정 적용
app.use(cors());

// 미들웨어 설정
app.use(express.urlencoded());
app.use(session({
    secret: 'your-secret-key', // 세션 데이터를 암호화하기 위한 시크릿 키
    resave: false,
    saveUninitialized: true
}));
app.use('/api/auth', authRoutes);
app.use(express.static(path.join(__dirname, '../frontend/dist')));



// 메인 페이지로 이동
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/main.html'));
    if (req.session.email) {
        // 세션에 사용자 이메일 정보가 있으면 로그인된 상태라고 간주
        console.log('Welcome to the main page (Logged in)');
    } else {
        console.log('Welcome to the main page (Not logged in)');
    }
});

// 회원가입 페이지로 이동
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/login.html'));
})
// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
