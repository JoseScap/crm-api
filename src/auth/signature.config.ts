export interface SignatureConfig {
  secretKeyEnvVar: string; // Name of the environment variable for the secret key (e.g., 'KAPSO_WEBHOOK_SECRET')
  headerNameEnvVar: string; // Name of the environment variable for the header name (e.g., 'KAPSO_WEBHOOK_HEADER')
  algorithm?: 'sha256' | 'sha1' | 'sha512';
  encoding?: 'hex' | 'base64';
}

export const SIGNATURE_CONFIG_KEY = 'SIGNATURE_CONFIG';

export type KnownSignatureConfigKey = 'KAPSO_WEBHOOK';

export type KnownSignatureConfig = {
  [key in KnownSignatureConfigKey]: {
    headerEnvVar: string
    secretEnvVar: string
  };
};

export const knownSignatureConfigs: KnownSignatureConfig = {
  KAPSO_WEBHOOK: {
    headerEnvVar: 'KAPSO_WEBHOOK_HEADER',
    secretEnvVar: 'KAPSO_WEBHOOK_SECRET',
  },
}