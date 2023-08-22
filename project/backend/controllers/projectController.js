const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = require('../config/database');
// Make sure to provide the correct path
// projectController.js

exports.postsboard = (req, res) => {
    // 시작 페이지 숫자
    const page = req.query.page || 1;
    const itemsPerPage = 25; // 한 페이지에 출력할 개수

    // Get total number of posts
    function getTotalPosts(callback) {
        // 페이지 개수 설정을 위하여 게시물 개수 확인
        // 게시물들의 개수 확인
        function getTotalPosts(callback) {
            const getTotalPostsQuery = 'SELECT COUNT(*) AS total FROM posts';
            db.query(getTotalPostsQuery, (err, totalResult) => {
                if (err) {
                    return callback(err, null);
                }
                const totalPosts = totalResult[0].total;
                callback(null, totalPosts);
            });
        }

        // Get posts for a specific page
        function getPostsForPage(page, itemsPerPage, callback) {
            const offset = (page - 1) * itemsPerPage;
            // 게시물을 id가 큰 순서대로=최근에 만든 순서대로 출력
            // offset 형식이 밑에 페이지 번호가 나오는 형식
            // 특정 페이지의 게시물들 가져오기
            function getPostsForPage(page, itemsPerPage, callback) {
                const offset = (page - 1) * itemsPerPage;
                // 게시물을 id가 큰 순서대로=최근에 만든 순서대로 출력
                const query = `SELECT * FROM posts ORDER BY id DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
                db.query(query, (err, results) => {
                    if (err) {
                        return callback(err, null);
                    }
                    callback(null, results);
                });
            }

            getTotalPosts((err, totalPosts) => {
                if (err) {
                    console.error('Error fetching total posts:', err);
                    return res.status(500).json({ error: 'An error occurred while fetching data' });
                }

                const totalPages = Math.ceil(totalPosts / itemsPerPage);

                getPostsForPage(page, itemsPerPage, (err, posts) => {
                    if (err) {
                        console.error('Error fetching posts:', err);
                        return res.status(500).json({ error: 'An error occurred while fetching data' });
                    }

                    res.json({ totalPages, posts }); // Return JSON response instead of rendering view
                });
            });
        };
        res.json({ totalPages, posts });
    });
});
};
