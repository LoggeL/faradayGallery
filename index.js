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
app.use(express.json());

// Max entries per page
const pageLimit = 100

app.use(express.static('webview'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webview/index.html');
});

app.post('/data', async (req, res) => {
    const page = req.body.page || 1
    // paginate data from the db
    const data = await db('data').select('*')
        .offset(pageLimit * (page - 1))
        .limit(pageLimit)
        .orderBy('createdAt', 'desc')
    res.status(200).json(data)
})

app.post('/search', async (req, res) => {
    console.log(req.body)
    const { search, page } = req.body
    if (search.length < 2) return res.status(400).json({ error: 'Search term must be at least 2 characters long' })
    const data = await db('data').select('*')
        .where('name', 'like', `%${search.split(' ').join('_')}%`) // replace spaces with underscores
        .offset(pageLimit * (page - 1))
        .limit(pageLimit)
        .orderBy('createdAt', 'desc')
    res.status(200).json(data)
})

app.post('/pageCount', async (req, res) => {
    const { search } = req.body

    // paginate data from the db
    let data
    if (search) data = await db('data').count('* as itemCount').where('name', 'like', `%${search.split(' ').join('_')}%`).first()
    else data = await db('data').count('* as itemCount').first()
    const pageCount = Math.floor(data.itemCount / pageLimit) + 1
    res.status(200).json(pageCount)
})

app.listen(8080, () => {
    console.log('App listening on port 3002!');
});