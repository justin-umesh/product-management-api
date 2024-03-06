import { Handler,  } from "aws-cdk-lib/aws-lambda";
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
// import { ProductRepository } from "../services/database/repository/product";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import mysql from 'mysql2/promise';

export const handler: Handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    // const productsRepo = new ProductRepository();
    // const products = await productsRepo.fetchAll();
    // console.log("products", products);

    const client = new SecretsManagerClient();
    const response = await client.send(
        new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_ARN
        })
    );

    const { password, host, username, dbname, port } = JSON.parse(response.SecretString || '{}');
    
    try {
        const connection = await mysql.createConnection(
            {
                host: host,
                user: username,
                database: dbname,
                port: port,
                password: password
            }
        );
        const { body } = event as any;
        const { name, price, description=''} = JSON.parse(body);
        console.log("name, price, description", name, price, description);
        const sql = 'INSERT INTO `products`(`name`, `price`, `description`) VALUES (?, ?, ?)';
        const values = [name, price, description];

        const [results] = await connection.execute(sql, values);

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: results,
            }),
        };

      } catch (err) {
        console.log(err);
      }

    return {
        statusCode: 500,
        body: JSON.stringify({
            message: new Error('Interal server error'),
        }),
    };

};