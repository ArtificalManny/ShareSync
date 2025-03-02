import { UploadsService } from './uploads.service';
import { Request, Response } from 'express';
export declare class UploadsController {
    private uploadsService;
    constructor(uploadsService: UploadsService);
    uploadFile(req: Request, res: Response): Promise<void>;
}
