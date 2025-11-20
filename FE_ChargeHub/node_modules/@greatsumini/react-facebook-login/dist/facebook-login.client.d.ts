import { DialogParams, InitParams, LoginOptions, LoginResponse } from './types';
export declare const SDK_SCRIPT_ELE_ID = "facebook-jssdk";
export declare const FacebookLoginClient: {
    getFB: () => import("./types").FB;
    getLoginStatus(callback: (res: LoginResponse) => void, isForcingRoudtrip?: boolean): void;
    getProfile(callback: (res: unknown) => void, params: {
        fields: string;
    }): void;
    init(initParams: InitParams): void;
    clear(): void;
    isRedirected(dialogParams?: DialogParams): boolean;
    loadSdk(language: string, useCustomerChat?: boolean): Promise<void>;
    redirectToDialog(dialogParams: DialogParams, { ignoreSdkError, ...loginOptions }: LoginOptions): void;
    login(callback: (res: LoginResponse) => void, { ignoreSdkError, ...loginOptions }: LoginOptions): void;
    logout(callback: (res?: unknown) => void): void;
};
