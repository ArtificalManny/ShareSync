export declare class UsersController {
    getProfile(): {
        message: string;
    };
    updateProfile(updateUserDto: any): {
        message: string;
    };
    uploadProfileImage(file: Express.Multer.File): {
        message: string;
        filePath: string;
    };
    uploadCoverImage(file: Express.Multer.File): {
        message: string;
        filePath: string;
    };
}
