const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.sqlite',
    },
    useNullAsDefault: true
});
const fetch = require('node-fetch');

const prefix = 'https://cdn.discordapp.com/attachments/838682121975234571';

let purged = 0;
(async () => {

    const data = await db('data').select('*')
    for (let i = 0; i < data.length; i++) {
        const imgResponse = await fetch(`${prefix}/${data[i].imgKey}/${data[i].name}.jpg`, { method: 'HEAD' })
        if (imgResponse.status === 403) {
            await db('data').where('imgKey', data[i].imgKey).del()
            console.log('ImgPurge', imgResponse.status, data[i].name)
            purged++
            continue
        }

        const vidResponse = await fetch(`${prefix}/${data[i].vidKey}/${data[i].name}.mp4`, { method: 'HEAD' })
        if (vidResponse.status === 403) {
            await db('data').where('vidKey', data[i].vidKey).del()
            console.log('VidPurge', vidResponse.status, data[i].name)
            purged++
            continue
        }
    }

    console.log('Purged', purged, 'out of', data.length, 'entries.')
    db.destroy()
})()