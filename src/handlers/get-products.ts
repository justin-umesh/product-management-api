import { Handler,  } from "aws-cdk-lib/aws-lambda";
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
// import { ProductRepository } from "../services/database/repository/product";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import mysql, { RowDataPacket } from 'mysql2/promise';

export const handler: Handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    const client = new SecretsManagerClient();
    const response = await client.send(
        new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_ARN
        })
    );

    const { password, host, username, dbname, port } = JSON.parse(response.SecretString || '{}');
    interface Product extends RowDataPacket {
        id: string;
        price: number;
        converted_price: number;
        converted_currency: string;
    }

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
        
        const { queryStringParameters } = event as any;
        const { currency="USD", limit="10", sortby="popularity" } = queryStringParameters;
        
        let sortcolumn = 'views';
        if(sortby === 'pricehightolow') {
            sortcolumn = 'price'
        }
        if(sortby === 'newest') {
            sortcolumn = 'created_at'
        }
        let convertedPrice=0;
        if(currency !== 'USD') {
            console.log("Will make the api call");
            const response = await fetch(`${process.env.FAST_FOREX_API_URL}/fetch-one?to=${currency}&api_key=${process.env.FAST_FOREX_API_KEY}`, {
                headers: {
                    "accept": 'application/json'
                }
            });
            const { result } = await response.json() as any;
            console.log(result);
            convertedPrice = result[currency];
        }
        const sql = 'SELECT * FROM `products` WHERE `status` = ? ORDER BY ' + `${sortcolumn}` + ' DESC LIMIT ?';
        const values = ['active', limit];

        const [results] = await connection.execute<Product[]>(sql, values);

        if(currency !== 'USD') {
            results.map(product => {
                product.converted_price = parseFloat((product.price * convertedPrice).toFixed(2));
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: results,
                status_code: 200
            }),
        };

      } catch (err) {
        console.log(err);
      }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'rows',
        }),
    };

};