require('dotenv').config();
const { Client } = require('pg');

console.log(' Tentative de connexion à la base de données...');

const client = new Client({
  connectionString: process.env.POSTGRES_URI,
  ssl: {
    rejectUnauthorized: false
  },
  keepAlive: true,
  connectionTimeoutMillis: 60000 // 60 secondes de timeout
});

client.connect()
  .then(() => {
    console.log(' Connexion à la base de données établie avec succès');
    process.exit(1);
  })
  .catch((err) => {
    console.error(' Erreur de connexion à la base de données:', err);
    process.exit(1);
  });