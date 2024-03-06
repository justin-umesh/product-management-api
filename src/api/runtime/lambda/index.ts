import { Stack } from "aws-cdk-lib";
import { IVpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { join } from "path";

// Default nodejs function props
const nodeJsFunctionProps: NodejsFunctionProps = {
    bundling: {
        externalModules: [
            'aws-sdk', // Use the 'aws-sdk' availibale in the lambda runtime
        ]
    },
    environment: {

    },
    runtime: Runtime.NODEJS_20_X
};

export interface lambdaProps {
    vpc: IVpc,
    lambdaSG: SecurityGroup,
    database: DatabaseInstance,
  }

const getLambdaVpcConfigs = (props: lambdaProps) => ({
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
            subnetType: SubnetType.PRIVATE_WITH_EGRESS
        }),
        environment: {
            DB_ENDPOINT_ADDRESS: props.database.dbInstanceEndpointAddress,
            DB_NAME: 'main',
            DB_SECRET_ARN: props.database.secret?.secretFullArn || '',
            FAST_FOREX_API_KEY: '8483dc18f4-2af5b088c1-s9wn39',
            FAST_FOREX_API_URL: 'https://api.fastforex.io'
        },
        securityGroups: [props.lambdaSG]
});

// Create a lambda function for each of the CRUD operation
const createProductHandler = (stack: Stack, props: lambdaProps) => {
    const fn = new NodejsFunction(stack, 'createProductFunction', {
        entry: join(__dirname, '../../../handlers', 'create-product.ts'),
        ...nodeJsFunctionProps,
        ...getLambdaVpcConfigs(props)
    });
    props.database.secret?.grantWrite(fn);
    props.database.secret?.grantRead(fn);
    return fn;
};

const getProductsHandler = (stack: Stack, props: lambdaProps) => {
    const fn = new NodejsFunction(stack, 'getProductsFunction', {
        entry: join(__dirname, '../../../handlers', 'get-products.ts'),
        ...nodeJsFunctionProps,
        ...getLambdaVpcConfigs(props)
    });
    props.database.secret?.grantWrite(fn);
    props.database.secret?.grantRead(fn);
    return fn;
};

const getProductByIdHandler = (stack: Stack, props: lambdaProps) => {
    const fn = new NodejsFunction(stack, 'getProductByIdHandlerFunction', {
        entry: join(__dirname, '../../../handlers', 'get-product-by-id.ts'),
        ...nodeJsFunctionProps,
        ...getLambdaVpcConfigs(props)
    });
    props.database.secret?.grantWrite(fn);
    props.database.secret?.grantRead(fn);
    return fn;
};

const deleteProductByIdHandler = (stack: Stack, props: lambdaProps) => {
    const fn = new NodejsFunction(stack, 'deleteProductByIdHandlerFunction', {
        entry: join(__dirname, '../../../handlers', 'delete-product-by-id.ts'),
        ...nodeJsFunctionProps,
        ...getLambdaVpcConfigs(props)
    });
    props.database.secret?.grantWrite(fn);
    props.database.secret?.grantRead(fn);
    return fn;
};

const authorizerHandler = (stack: Stack) => new NodejsFunction(stack, 'authorizerFunction', {
    entry: join(__dirname, '../../../handlers', 'authorizer.ts'),
    ...nodeJsFunctionProps
});

const explorerHandler = (stack: Stack) => new NodejsFunction(stack, 'explorerFunction', {
    entry: join(__dirname, '../../../handlers', 'explorer.ts'),
    ...nodeJsFunctionProps
});

export const getLambdaFunctions = (
    stack: Stack,
    props: lambdaProps
) => {
    return {
        authorizerFunction: authorizerHandler(stack),
        createProduct : createProductHandler(stack, props),
        getProducts: getProductsHandler(stack, props),
        getProductById: getProductByIdHandler(stack, props),
        deleteProductById: deleteProductByIdHandler(stack, props),
        explorer: explorerHandler(stack)
    }
}