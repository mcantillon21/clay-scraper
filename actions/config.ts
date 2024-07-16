import { Page } from "playwright";

export const DEFAULT_APP: AppName = "united_airlines";
export const NETWORK_TIMEOUT = 10000; // 10 seconds
export const MAX_RETRIES = 5;
export const DO_DELETE_SESSION = false;

export interface AppConfig {
  url: string;
  action: (page: Page) => Promise<void>;
}

export const APP_CONFIG: { [key: string]: AppConfig } = {

};

export type AppName = keyof typeof APP_CONFIG;
