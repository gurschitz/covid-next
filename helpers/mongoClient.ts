import { MongoClient } from "mongodb";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ttfir.mongodb.net?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true });

export default client;
