import { Controller, Post, Body } from '@nestjs/common';
import { BannersService } from './banners.service';
import { BannerData } from './interfaces/banner.interface';
import * as path from 'path';
import * as fs from 'fs';

@Controller('api')
export class BannersController {
    constructor(private readonly bannersService: BannersService) {}

    @Post('save-banner')
    async saveBanner(@Body() bannerData: BannerData): Promise<{ message: string, data: BannerData }> {
        try {
            const result = await this.bannersService.saveBanner(bannerData);
            return { message: 'Данные успешно сохранены', data: result };
        } catch (error) {
            throw error;
        }
    }
}