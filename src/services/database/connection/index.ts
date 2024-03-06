import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Connection, createConnection } from "mysql2";

const connection = async () => {
    const client = new SecretsManagerClient();
    const response = await client.send(
        new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_ARN
        })
    );

    const { password, host, username, dbname, port } = JSON.parse(response.SecretString || '{}');

    const connection:Connection = createConnection(
        {
            host: host,
            user: username,
            database: dbname,
            port: port,
            password: password
        }
    );
    connection.connect((err: any) => {
        if (err) {
            return console.error('error: ' + err.message);
        }    
        console.log('Connected to the MySQL server.');
    });

    return connection;
}


export default connection;