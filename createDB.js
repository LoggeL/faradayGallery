// Connect to the Database file
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.sqlite',
    },
    useNullAsDefault: true
})

;(async () => {    
    if (!await db.schema.hasTable('data')) {
        await db.schema.createTable('data', (table) => {
            table.increments('id').primary()
            table.string('imgKey')
            table.string('vidKey')
            table.string('name')
            table.timestamp('createdAt')
        })
    }
    
    if (!await db.schema.hasTable('vote')) {
        await db.schema.createTable('vote', (table) => {
            table.increments('id').primary()
            table.integer('data_id')
            table.foreign('data_id').references('data.id')
            table.string('hash')
            table.timestamp('timestamp')
        })
    }

    // Close Database
    db.destroy()
})();