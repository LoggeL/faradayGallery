const express = require('express');
const crypto = require('crypto');

const { salt, complexity} = require('./config.json');

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
    const search = req.body.search || ''
    const page = req.body.page || 1
    const likedDays = req.body.likedDays || 0

    let baseQuery = db('data')
    if (search) {
        baseQuery = baseQuery.where('name', 'like', `%${search.split(' ').join('_')}%`) // replace spaces with underscores
    } 
     
    baseQuery = baseQuery.leftJoin('vote', 'data.id', '=', 'vote.data_id')
        .count('vote.data_id', { as: 'votes' })
        .groupBy('data.id')
        .select('data.*')

    if (likedDays > 0) {
        baseQuery = baseQuery.orderBy('votes', 'desc').where('vote.timestamp', '>', Date.now() - likedDays * 24 * 60 * 60 * 1000)

    } else {
        baseQuery = baseQuery.orderBy('createdAt', 'desc')
    }

    const data = await baseQuery.offset(pageLimit * (page - 1))
        .limit(pageLimit)
        
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


// Proof of work
app.post('/challenge', async (req, res) => {
    // generate a challenge for the user
    const IP = req.headers['x-forwarded-for'] || req.headers['CF-Connecting-IP'] || req.connection.remoteAddress
    const { id } = req.body

    // Hash the ip
    const hashedIP = crypto.createHash('sha256').update(IP).digest('hex')

    // check if the IP has already voted
    const IPExists = await db('vote').where('data_id', id).where('hash', hashedIP).first()
    if (IPExists) return res.status(400).json({ error: 'You have already voted' })

    const hash = crypto.createHash('sha256').update(id.toString('16')).update(hashedIP).update(salt).digest('hex')
    res.status(200).json({ hash, complexity, id })
})

app.post('/vote', async (req, res) => {
    const IP = req.headers['x-forwarded-for'] || req.headers['CF-Connecting-IP'] || req.connection.remoteAddress
    const { id, captchaToken } = req.body

    // Hash the ip
    const hashedIP = crypto.createHash('sha256').update(IP).digest('hex')

    // check if the captcha token is valid
    // validate Token
    const baseHash = crypto.createHash('sha256').update(id.toString('16')).update(hashedIP).update(salt).digest('hex')
    const finalHash = crypto.createHash('sha256').update(baseHash + captchaToken).digest('hex')
    if (!finalHash.endsWith('0'.repeat(complexity))) return res.status(400).json({ error: 'Captcha token is invalid' })


    // check if the IP has already voted
    const IPExists = await db('vote').where('data_id', id).where('hash', hashedIP).first()
    if (IPExists) return res.status(400).json({ error: 'You have already voted' })

    // check if the id exists
    const data = await db('data').where('id', id).first()
    if (!data) return res.status(400).json({ error: 'Invalid ID' })

    // add the vote to the database
    await db('vote').insert({
        data_id: id,
        hash: hashedIP,
        timestamp: Date.now()
    })      
})

app.listen(3002, () => {
    console.log('App listening on port 3002!');
});