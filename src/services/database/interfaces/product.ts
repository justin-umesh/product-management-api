import { RowDataPacket } from "mysql2";

export interface IProduct extends RowDataPacket {
    id?: number,
    name: string,
    description : string,
    price : number,
    status : string,
    views : number,
    created_at : Date,
    updated_at : Date
}