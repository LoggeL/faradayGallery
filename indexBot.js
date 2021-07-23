const Discord = require('discord.js')
const fetch = require('node-fetch')

const prefix = 'https://cdn.discordapp.com/attachments/838682121975234571/'

// Connect to the Database file
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.sqlite',
    },
    useNullAsDefault: true
})

const config = require('./config.json')
const client = new Discord.Client()

client.on('ready', async () => {
    console.log('Logged in as ' + client.user.tag)

    if (!await db.schema.hasTable('data')) {
        await db.schema.createTable('data', (table) => {
            table.increments('id').primary()
            table.string('imgKey')
            table.string('vidKey')
            table.string('name')
            table.timestamp('createdAt')
        })
    }
})

let tempStorage = {};
client.on('messageUpdate', (oldMessage, newMessage) => {
    if (!newMessage.author.bot) return;
    if (newMessage.author.id != config.user) return;
    if (oldMessage.content === newMessage.content) return;

    // Collect Videos
    if (newMessage.content.includes(' (100%) ')) {
        const videoURL = newMessage.content.split('\n').filter(line => line.includes('.mp4')).pop();
        if (!videoURL) return;
        const fileName = videoURL.split('/').pop()
        const fileEnding = fileName.split('.').pop()
        const fileWithoutEnding = fileName.replace('.' + fileEnding, '')
        if (!fileWithoutEnding || !tempStorage[fileWithoutEnding]) return
        const vidKey = videoURL.replace(prefix, '').split('/')[0];
        tempStorage[fileWithoutEnding].vidKey = vidKey;
        tempStorage[fileWithoutEnding].name = fileWithoutEnding;
        tempStorage[fileWithoutEnding].createdAt = Date.now()
        console.log('Vid', fileWithoutEnding, vidKey)
        setTimeout(async () => {
            const duplicate = await db('data').where('vidKey', vidKey).select('*')

            const imgResponse = await fetch(`${prefix}${tempStorage[fileWithoutEnding].imgKey}/${tempStorage[fileWithoutEnding].name}.jpg`, { method: 'HEAD' })
            if (imgResponse.status == 403) return delete tempStorage[fileWithoutEnding];

            const vidResponse = await fetch(`${prefix}${tempStorage[fileWithoutEnding].vidKey}/${tempStorage[fileWithoutEnding].name}.mp4`, { method: 'HEAD' })
            if (vidResponse.status == 403) return delete tempStorage[fileWithoutEnding];

            if (duplicate.length == 0) await db('data').insert(tempStorage[fileWithoutEnding])
            delete tempStorage[fileWithoutEnding];

            // Garbage collection
            for (key in tempStorage) {
                if (!tempStorage[key].createdAt || Date.now() - tempStorage[key].createdAt > 3600000) {
                    delete tempStorage[key]
                    console.log('garbage', key)
                }
            }
            // Give it 10 seconds to post the final picture
        }, 10000)

        // Collect Images
    } else if (newMessage.content.includes('.jpg')) {
        const fileUrl = newMessage.content.split('\n').filter(line => line.includes('.jpg')).pop();
        if (!fileUrl) return;
        const fileName = fileUrl.split('/').pop();
        const fileEnding = fileName.split('.').pop()
        const fileWithoutEnding = fileName.replace('.' + fileEnding, '')
        if (!fileWithoutEnding) return
        const imgKey = fileUrl.replace(prefix, '').split('/')[0];
        if (!tempStorage[fileWithoutEnding]) tempStorage[fileWithoutEnding] = {}
        tempStorage[fileWithoutEnding].imgKey = imgKey;
        tempStorage[fileWithoutEnding].createdAt = Date.now()
        // console.log('Img', fileWithoutEnding, imgKey)
    }
})

client.login(config.token);