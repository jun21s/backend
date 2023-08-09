const db = require('../config/database');

exports.getTechStack = (req, res) => {
    db.query('SELECT tech FROM Tech', (err, techStackData) => {
        if (err) {
            console.error('Error fetching tech stack:', err);
            res.status(500).json({ message: 'Failed to fetch tech stack' });
        } else {
            console.log('Fetched tech stack:', techStackData);

            const techStack = techStackData.map(item => item.tech);

            res.status(200).json({ techStack });
        }
    });
};