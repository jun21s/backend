const express = require('express');
const cors = require('cors'); // cors 패키지 불러오기
const path = require('path');
require('dotenv').config();
const app = express();
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');

// CORS 설정 적용
app.use(cors());

// 미들웨어 설정
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/api/auth', authRoutes);

// 메인 페이지로 이동
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/main.html'));
});

// 회원가입 페이지로 이동
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/signup.html'));
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
