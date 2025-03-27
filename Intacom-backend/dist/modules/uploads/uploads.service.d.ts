/// <reference types="multer" />
export declare class UploadsService {
    uploadFile(file: Express.Multer.File): Promise<string>;
}
