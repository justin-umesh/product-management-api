import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.5.0',
  defaultReleaseBranch: 'main',
  name: 'product-management-api',
  projenrcTs: true,
  jest: true,
  prettier: true,
  eslint: true,
  deps: ["aws-lambda", "mysql2", "@aws-sdk/client-secrets-manager"],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: ["@types/aws-lambda", "@types/node"],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();