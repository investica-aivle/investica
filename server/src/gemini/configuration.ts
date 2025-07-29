import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
    googleApiKey: process.env.GOOGLE_API_KEY,
}));