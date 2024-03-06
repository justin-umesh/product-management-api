import connection from "../connection";
import { IProduct } from "../interfaces/product";

export class ProductRepository {
    fetchAll(): Promise<IProduct[]> {
        return new Promise(async (resolve, reject) => {
            const newconnection = await connection();
            newconnection.query<IProduct[]>("SELECT * from products", (err, res) => {
                if (err) {
                    reject(err)
                }
                else resolve(res)
            })
        })
    }
}