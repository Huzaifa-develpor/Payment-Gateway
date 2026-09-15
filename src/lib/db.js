import mongoose from "mongoose";
const MONGODB_URL = process.env.MONGODB_URL;

let cached = global.mongoose || { conn: null, promise: null };

export async function connectToDB() {
    if(cached.conn)
        return cached.conn;

        if(!cached.promise){
            cached.promise = mongoose.connect(MONGODB_URL, {bufferCommands: false});
        }
        cached.conn = await cached.promise;
        return cached.conn;
    }
