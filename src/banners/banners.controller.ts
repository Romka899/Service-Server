import { Controller, Post, Body, UseInterceptors,  UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { BannerData } from './interfaces/banner.interface';


@Controller('api')
export class BannersController {
    constructor(private readonly bannersService: BannersService) {}

    @Post('save-banner')
    @UseInterceptors(FilesInterceptor('images', 5))
    async saveBanner(
        @Body() bannerData: any,
        @UploadedFiles() images?: Express.Multer.File[] 
    ) {
        try {
            const dataWithUsername = {
                ...bannerData, 
                username: bannerData.username || 'unknow'
            };

            const result = await this.bannersService.saveBanner(dataWithUsername, images);
            return { 
                message: 'Данные успешно сохранены', 
                data: result,
                imageUrls: result.imageNames?.map(name => `/images/${name}`) || []
             };
        } catch (error) {
            throw error;
        }
    }
}