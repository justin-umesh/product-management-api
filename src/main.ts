import { App, Aspects, IAspect, Stack, StackProps, aws_certificatemanager, aws_route53 } from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";
import { AuthorizationType, CfnMethod, IdentitySource, JsonSchemaType, LambdaIntegration, Model, RequestAuthorizer, ResponseType, RestApi } from "aws-cdk-lib/aws-apigateway";
import { getLambdaFunctions } from "./api/runtime/lambda";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, MysqlEngineVersion } from "aws-cdk-lib/aws-rds";
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // RDS Instance
    const instanceIdentifier = 'mysql-pma';
    const credsSecretName = `/${id}/rds/creds/${instanceIdentifier}`.toLocaleLowerCase();
    const creds = new DatabaseSecret(this, 'MysqlRdsCredentials', {
      secretName: credsSecretName,
      username: 'admin'
    });

    const vpc = new Vpc(this, 'MyVPC', {
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'ingress',
        subnetType: SubnetType.PUBLIC
      }, {
        cidrMask: 24,
        name: 'compute',
        subnetType: SubnetType.PRIVATE_WITH_NAT
      }, {
        cidrMask: 28,
        name: 'rds',
        subnetType: SubnetType.PRIVATE_ISOLATED
      }]
    });

    const databaseName = 'main';
    const dbInstance = new DatabaseInstance(this, 'MysqlRDSInstance', {
      vpcSubnets: {
        onePerAz: true,
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      credentials: Credentials.fromSecret(creds),
      vpc: vpc,
      port: 3306,
      databaseName,
      allocatedStorage: 20,
      instanceIdentifier,
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0
      }),
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.LARGE)
    });

    const lambdaSG = new SecurityGroup(this, 'ResourceInitializerFnSg', {
      securityGroupName: `${id}ResourceInitializerFnSg`,
      vpc: vpc,
      allowAllOutbound: true
    });


    // Lambda functions
    
    // API Gateway

const myHostedZone = aws_route53.HostedZone.fromHostedZoneId(this, 'MyZone', 'Z02222972QPK723Q8TGHL');

const acm = aws_certificatemanager;
const myCertificate = new acm.Certificate(this, 'Certificate', {
  domainName: 'api.open-projects.info',
  certificateName: 'Products Management Service',
  validation: acm.CertificateValidation.fromDns(myHostedZone)
});

const functions = getLambdaFunctions(this, {vpc, lambdaSG, database: dbInstance});
const authorizer = new RequestAuthorizer(this, 'MyAuthorizer', {
  handler: functions.authorizerFunction,
  identitySources: [IdentitySource.header('Authorization'), IdentitySource.queryString('allow')]
});

const restApi = new RestApi(this, 'ProductsManagementApi', {
    cloudWatchRole: true,
    defaultMethodOptions: {
      authorizer
    },
    domainName: {
      domainName: 'api.open-projects.info',
      certificate: myCertificate,
    }
});

// Products resource
const v1Resource = restApi.root.addResource('v1');
const products = v1Resource.addResource('products');
products.addMethod('GET', new LambdaIntegration(functions.getProducts, {
  requestTemplates: { "application/json": '{ "statusCode": "200" }' }
}));

const newProduct = v1Resource.addResource('product');
const requestBodySchema = new Model(this, 'RequestBodySchema', {
  restApi: restApi,
  contentType: 'application/json',
  schema: {
    type: JsonSchemaType.OBJECT,
    properties: {
      name: { type: JsonSchemaType.STRING },
      price: { type: JsonSchemaType.NUMBER}
    },
    required: ['name', 'price'],
  },
});
newProduct.addMethod('POST', new LambdaIntegration(functions.createProduct, {
  requestTemplates: { "application/json": '{ "statusCode": "200" }' },  
}),
{
  requestModels: {
    'application/json': requestBodySchema,
  },
  requestValidatorOptions: {
    validateRequestBody: true
  }
}
);

const product = newProduct.addResource('{productId}');
product.addMethod('GET', new LambdaIntegration(functions.getProductById, {
  requestTemplates: { "application/json": '{ "statusCode": "200" }' },
}));

product.addMethod('DELETE', new LambdaIntegration(functions.deleteProductById, {
  requestTemplates: { "application/json": '{ "statusCode": "200" }' },
}));

const explorer = v1Resource.addResource('explorer');
explorer.addMethod('GET', new LambdaIntegration(functions.explorer, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
}));

restApi.addGatewayResponse('test-response', {
  type: ResponseType.UNAUTHORIZED,
  statusCode: '401',
  templates: {
    'application/json': '{ "message": "You are not authorized to access", "statusCode": "401", "type": "$context.error.responseType" }'
  }
});

    // RDS Database

    // Outputs
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,

};

const app = new App();
const myStack = new MyStack(app, "product-management-api-dev", { env: devEnv });
// new MyStack(app, 'product-management-api-prod', { env: prodEnv });


const excludedMethodIds: any = ["OPTIONS"];

const aspect: IAspect = {
  visit(node: IConstruct): void {
    if (
      node instanceof CfnMethod
      && !excludedMethodIds.find((rid: any) => rid === node.resourceId)
    ) {
      delete node.authorizerId;
      node.authorizationType = AuthorizationType.NONE;
    }
  },
};

Aspects.of(myStack).add(aspect);

app.synth();
