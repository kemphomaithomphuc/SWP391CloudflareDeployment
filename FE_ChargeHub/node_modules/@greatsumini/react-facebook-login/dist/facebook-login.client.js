"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookLoginClient = exports.SDK_SCRIPT_ELE_ID = void 0;
const helpers_1 = require("./helpers");
exports.SDK_SCRIPT_ELE_ID = 'facebook-jssdk';
exports.FacebookLoginClient = {
    getFB: () => {
        if (!window.FB) {
            console.warn('FB not found');
            return null;
        }
        return window.FB;
    },
    getLoginStatus(callback, isForcingRoudtrip = false) {
        const FB = this.getFB();
        if (!FB) {
            callback({ status: 'unknown' });
            return;
        }
        FB.getLoginStatus(callback, isForcingRoudtrip);
    },
    getProfile(callback, params) {
        var _a;
        (_a = this.getFB()) === null || _a === void 0 ? void 0 : _a.api('me', params, callback);
    },
    init(initParams) {
        var _a;
        (_a = this.getFB()) === null || _a === void 0 ? void 0 : _a.init(initParams);
    },
    clear() {
        window.FB = null;
        const scriptEle = document.getElementById(exports.SDK_SCRIPT_ELE_ID);
        if (scriptEle) {
            scriptEle.remove();
        }
    },
    isRedirected(dialogParams) {
        var _a, _b;
        const params = (0, helpers_1.paramsToObject)(window.location.search);
        return (((_a = params['state'] === (dialogParams === null || dialogParams === void 0 ? void 0 : dialogParams.state)) !== null && _a !== void 0 ? _a : 'facebookdirect') &&
            params[(_b = dialogParams === null || dialogParams === void 0 ? void 0 : dialogParams.response_type) !== null && _b !== void 0 ? _b : ''] !== undefined);
    },
    loadSdk(language, useCustomerChat) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, helpers_1.createScriptEle)(exports.SDK_SCRIPT_ELE_ID, `https://connect.facebook.net/${language}/sdk${useCustomerChat ? '/xfbml.customerchat' : ''}.js`);
        });
    },
    redirectToDialog(dialogParams, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _a) {
        var 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { ignoreSdkError } = _a, loginOptions = __rest(_a, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ["ignoreSdkError"]);
        window.location.href = `https://www.facebook.com/dialog/oauth${(0, helpers_1.objectToParams)(Object.assign(Object.assign({}, dialogParams), loginOptions))}`;
    },
    login(callback, _a) {
        var _b;
        var { ignoreSdkError } = _a, loginOptions = __rest(_a, ["ignoreSdkError"]);
        try {
            (_b = this.getFB()) === null || _b === void 0 ? void 0 : _b.login(callback, loginOptions);
        }
        catch (e) {
            if (ignoreSdkError) {
                return;
            }
            else {
                throw e;
            }
        }
    },
    logout(callback) {
        this.getLoginStatus((res) => {
            var _a;
            if (res.status === 'connected') {
                (_a = this.getFB()) === null || _a === void 0 ? void 0 : _a.logout(callback);
            }
            else {
                callback();
            }
        });
    },
};
