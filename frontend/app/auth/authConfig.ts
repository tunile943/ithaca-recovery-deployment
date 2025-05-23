// Config object to be passed to Msal on creation
import { Configuration, LogLevel } from "@azure/msal-node";
import "server-only";

export const msalConfig: Configuration = {
    auth: {
        clientId: process.env.CLIENT_ID || '',
        authority: `${process.env.CLOUD_INSTANCE || ''}${process.env.TENANT_ID || ''}`,
        clientSecret: process.env.CLIENT_SECRET || '',
    },
    system: {
        loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
            loggerCallback(logLevel, message) {
                switch (logLevel) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        console.log(message);
                        return;
                }
            },
        },
    }
};

export const scopes = [`${process.env.NEXT_PUBLIC_GRAPH_API_ENDPOINT}Group.Read.All`, `${process.env.NEXT_PUBLIC_GRAPH_API_ENDPOINT}Calendars.Read`];


// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};

export const authCallbackUri = process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_AUTH_CALLBACK_PROD_URI || "")
    : (process.env.NEXT_PUBLIC_AUTH_CALLBACK_URI || "");

export const sessionSecret = process.env.SESSION_SECRET!;

export const redisUrl = process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_REDIS_PROD_URL
    : process.env.NEXT_PUBLIC_REDIS_URL;
