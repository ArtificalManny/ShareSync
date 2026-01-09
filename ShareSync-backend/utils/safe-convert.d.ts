export type Sniff = {
    mime: string;
    ext: string;
};
export declare function sniffMime(buf: Buffer): Promise<Sniff>;
export declare function normalizeImageBuffer(buf: Buffer, target?: "jpeg" | "png" | "webp"): Promise<{
    buffer: Buffer;
    mime: string;
    width: number;
    height: number;
}>;
export declare function toPreviewWebp(buf: Buffer, width?: number, quality?: number): Promise<Buffer<ArrayBufferLike>>;
