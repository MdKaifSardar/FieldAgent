import { 
  CognitoIdentityProviderClient, 
  CreateUserPoolCommand, 
  CreateUserPoolClientCommand,
  ListUserPoolsCommand
} from '@aws-sdk/client-cognito-identity-provider';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error('ERROR: AWS credentials not found in environment.');
  process.exit(1);
}

const client = new CognitoIdentityProviderClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function setupCognito() {
  try {
    console.log(`Checking existing Cognito User Pools in ${region}...`);
    const poolsRes = await client.send(new ListUserPoolsCommand({ MaxResults: 20 }));
    let userPool = poolsRes.UserPools?.find(p => p.Name === 'FieldGuard-UserPool');

    let userPoolId = userPool?.Id;

    if (!userPoolId) {
      console.log('Creating new Amazon Cognito User Pool [FieldGuard-UserPool]...');
      const createPoolRes = await client.send(new CreateUserPoolCommand({
        PoolName: 'FieldGuard-UserPool',
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
        VerificationMessageTemplate: {
          DefaultEmailOption: 'CONFIRM_WITH_CODE',
          EmailSubject: 'FieldGuard — Your 6-Digit Verification Code',
          EmailMessage: 'Your FieldGuard verification code is {####}. Enter this code to verify your farm account.',
        },
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireUppercase: false,
            RequireLowercase: false,
            RequireNumbers: true,
            RequireSymbols: false,
          },
        },
        MfaConfiguration: 'OFF',
      }));

      userPoolId = createPoolRes.UserPool?.Id;
      console.log('User Pool created! ID:', userPoolId);
    } else {
      console.log('User Pool already exists! ID:', userPoolId);
    }

    // Now create or get App Client
    console.log('Creating public Web App Client for User Pool...');
    const clientRes = await client.send(new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: 'FieldGuard-WebClient',
      GenerateSecret: false, // Public browser client
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_CUSTOM_AUTH',
      ],
      PreventUserExistenceErrors: 'ENABLED',
    }));

    const clientId = clientRes.UserPoolClient?.ClientId;
    console.log('Cognito App Client created! Client ID:', clientId);

    // Append to .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    let updated = false;
    if (!envContent.includes('NEXT_PUBLIC_COGNITO_USER_POOL_ID')) {
      envContent += `\nNEXT_PUBLIC_COGNITO_USER_POOL_ID=${userPoolId}`;
      updated = true;
    } else {
      envContent = envContent.replace(/NEXT_PUBLIC_COGNITO_USER_POOL_ID=.*/g, `NEXT_PUBLIC_COGNITO_USER_POOL_ID=${userPoolId}`);
      updated = true;
    }

    if (!envContent.includes('NEXT_PUBLIC_COGNITO_CLIENT_ID')) {
      envContent += `\nNEXT_PUBLIC_COGNITO_CLIENT_ID=${clientId}`;
      updated = true;
    } else {
      envContent = envContent.replace(/NEXT_PUBLIC_COGNITO_CLIENT_ID=.*/g, `NEXT_PUBLIC_COGNITO_CLIENT_ID=${clientId}`);
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
      console.log('Updated .env.local with Cognito configuration!');
    }

    console.log('\nSUCCESS: Amazon Cognito is fully provisioned and ready for FieldGuard authentication!');
    console.log(`- User Pool ID: ${userPoolId}`);
    console.log(`- Client ID:    ${clientId}`);
  } catch (err) {
    console.error('Failed to setup Cognito:', err);
  }
}

setupCognito();
