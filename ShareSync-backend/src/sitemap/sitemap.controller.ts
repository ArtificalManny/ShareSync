import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SitemapService } from './sitemap.service';

@Controller('sitemap.xml')
export class SitemapController {
  constructor(
    private readonly sitemapService: SitemapService,
  ) {}

  @Get()
  async getSitemap(@Res() res: Response) {
    const xml = await this.sitemapService.generateXml();

    res.setHeader(
      'Content-Type',
      'application/xml; charset=utf-8',
    );
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=300',
    );

    return res.status(200).send(xml);
  }
}
