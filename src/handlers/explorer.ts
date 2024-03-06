import { Handler,  } from "aws-cdk-lib/aws-lambda";
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import openapi from "./openapi.json";

export const handler: Handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="SwaggerUI" />
      <title>SwaggerUI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    </head>
    <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          dom_id: '#swagger-ui',
          spec: ${JSON.stringify(openapi)}
        });
      };
    </script>
    </body>
    </html>`;

    return {
        statusCode: 200,
        body: html,
        headers: {"Content-Type": "text/html"}
    };
};