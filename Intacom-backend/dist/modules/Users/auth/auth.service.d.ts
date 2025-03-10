declare var __createBinding: any;
declare var __setModuleDefault: any;
declare var __decorate: any;
declare var __importStar: any;
declare var __metadata: any;
declare var __param: any;
declare const common_1: any;
declare const mongoose_1: any;
declare const mongoose_2: any;
declare const user_model_1: any;
declare const bcrypt: any;
declare let AuthService: {
    new (userModel: any): {
        register(username: any, password: any, profilePic: any): Promise<any>;
        login(username: any, password: any): Promise<any>;
        findUser(username: any): Promise<any>;
    };
};
