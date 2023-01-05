const { MongoClient } = require('mongodb');
require('dotenv').config()

// Connection URL
const url = process.env.dbURL;
const client = new MongoClient(url);
// Database Name
const dbName = 'Messages';

const connectToDB = async () => {
   try {
      console.log('Connecting to database...');
      // Use connect method to connect to the server
      await client.connect();
      console.log('Connected successfully to database');
      const db = client.db(dbName);
   
      return {
         db,
         client
      };
   } catch (error) {
      console.error(error);
      return;
   }
}

module.exports.connectToDB = connectToDB;