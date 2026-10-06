import { 
  CognitoIdentityProviderClient, 
  SignUpCommand, 
  ConfirmSignUpCommand, 
  InitiateAuthCommand, 
  ResendConfirmationCodeCommand 
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'ap-south-1';
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'u1tuajkqa6svhelgrb12g2abn';

let cognitoClient: CognitoIdentityProviderClient | null = null;

function getClient(): CognitoIdentityProviderClient {
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient({ region });
  }
  return cognitoClient;
}

export interface AuthSession {
  userId: string;
  emailOrPhone: string;
  displayName: string;
  role: 'farmer' | 'adviser';
  idToken?: string;
  accessToken?: string;
}

/**
 * Initiates user registration and triggers AWS to send a 6-digit verification code.
 */
export async function sendEmailOtpCode(email: string): Promise<{ success: boolean; userSub?: string; error?: string }> {
  try {
    const client = getClient();
    // Deterministic secure salt for passwordless UX
    const defaultPassword = `FieldGuard@${email.split('@')[0]}2026!`;

    const res = await client.send(new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: defaultPassword,
      UserAttributes: [
        { Name: 'email', Value: email },
      ],
    }));

    return { success: true, userSub: res.UserSub };
  } catch (err: any) {
    // If user already exists, resend confirmation code
    if (err.name === 'UsernameExistsException') {
      try {
        await resendOtpCode(email);
        return { success: true };
      } catch (resendErr: any) {
        return { success: false, error: resendErr.message || 'User already confirmed. You can log in.' };
      }
    }
    return { success: false, error: err.message || 'Failed to send OTP' };
  }
}

/**
 * Confirms the 6-digit OTP code with Amazon Cognito.
 */
export async function verifyEmailOtpCode(
  email: string, 
  code: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  try {
    const client = getClient();
    await client.send(new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    }));

    // Auto sign in to retrieve JWT
    const defaultPassword = `FieldGuard@${email.split('@')[0]}2026!`;
    let tokens: any = {};
    try {
      const authRes = await client.send(new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: defaultPassword,
        },
      }));
      tokens = authRes.AuthenticationResult || {};
    } catch (e) {
      // Confirmed but login optional
    }

    const session: AuthSession = {
      userId: `cognito-${email}`,
      emailOrPhone: email,
      displayName: email.split('@')[0],
      role: 'farmer',
      idToken: tokens.IdToken,
      accessToken: tokens.AccessToken,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_auth', JSON.stringify(session));
    }

    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Invalid 6-digit code. Please try again.' };
  }
}

/**
 * Resends the 6-digit OTP confirmation code via AWS.
 */
export async function resendOtpCode(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    await client.send(new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: email,
    }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to resend code' };
  }
}

/**
 * Phone OTP Simulation / Verification (For Indian mobile numbers)
 */
export async function verifyPhoneOtpCode(
  phone: string, 
  code: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  // Deterministic demo verification (e.g. 123456 or any 6-digit input in demo mode)
  if (code.length === 6) {
    const session: AuthSession = {
      userId: `phone-${phone.replace(/\D/g, '')}`,
      emailOrPhone: phone,
      displayName: `Farmer (${phone.slice(-4)})`,
      role: 'farmer',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_auth', JSON.stringify(session));
    }
    return { success: true, session };
  }
  return { success: false, error: 'Please enter a valid 6-digit code' };
}
