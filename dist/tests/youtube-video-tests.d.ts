/// <reference types="chai" />
import 'chai/chai.js';
declare global {
    interface Window {
        YT: any;
        chai: Chai.ChaiStatic;
    }
}
