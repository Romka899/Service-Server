import { Controller, Post, Body, UseInterceptors,  UploadedFiles, Req, HttpException, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { BannerData } from './interfaces/banner.interface';
import { Request } from 'express';

class CreateBannerDto {
    placement: string;
    app: 'app1' | 'app2';
    hideable: boolean;
    link: string;
    period: string;
    impressions: string;
    userImpressions: string;
    showTime: string;
    geoTargeting: string;
  }

@Controller('api')
export class BannersController {
    constructor(private readonly bannersService: BannersService) {}

    @Post('save-banner')
    @UseInterceptors(FilesInterceptor('images', 5))
    async saveBanner(
        @Req() req:Request,
        @Body() bannerData: BannerData,
        @UploadedFiles() images: Express.Multer.File[]

    ) {
        try {
            if (!req.session.user) {
                throw new HttpException('Не авторизован', HttpStatus.UNAUTHORIZED);
              }
            const result = await this.bannersService.saveBanner(
              {
                ...bannerData,
                username: req.session.user.username 
              },
              images,
              req
            );
            
            return { 
              message: 'Данные успешно сохранены',
              data: result,
              imageUrls: result.imageNames?.map(name => `/images/${name}`)
            };
          } catch (error) {
            if (error instanceof HttpException) {
              throw error;
            }
            throw new HttpException('Ошибка сохранения баннера', HttpStatus.UNRECOVERABLE_ERROR);
          }
    }
}