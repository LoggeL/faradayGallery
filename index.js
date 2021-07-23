const express = require('express');

// Connect to the Database file
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.sqlite',
    },
    useNullAsDefault: true
})

// a simple express server
const app = express();

const pageLimit = 100

app.use(express.static('webview'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webview/index.html');
});

app.get('/data', async (req, res) => {
    const page = req.query.page || 1
    // paginate data from the db
    const data = await db('data').select('*').offset(pageLimit * (page - 1)).limit(pageLimit).orderBy('createdAt', 'desc')
    res.status(200).json(data)
})

app.get('/pageCount', async (req, res) => {
    // paginate data from the db
    const data = await db('data').count('* as itemCount')
    const pageCount = Math.floor(data[0].itemCount / pageLimit) + 1
    res.status(200).json(pageCount)
})

app.listen(3002, () => {
    console.log('App listening on port 3002!');
});