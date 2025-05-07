import { Controller, Post, Get, Body, UseInterceptors,  UploadedFiles, Req, HttpException, HttpStatus, UseGuards, UnauthorizedException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { BannerData } from './interfaces/banner.interface';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';



@Controller('api')
export class BannersController {
    constructor(private readonly bannersService: BannersService) {}

    @Get('user-banners')
    async getUserBanners(@Req() req: Request) {
      console.log('Full session:', req.session);
      
      const userIdentifier = req.session.user?.id || req.session.user?.username;
      
      if (!userIdentifier) {
        console.error('No user identifier in session!');
        throw new UnauthorizedException('Требуется авторизация');
      }
    
      try {
        return await this.bannersService.getUserBanners(userIdentifier);
      } catch (error) {
        console.error('Error fetching banners:', error);
        throw new HttpException('Ошибка получения баннеров', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    @Post('save-banner') 
    @UseInterceptors(FilesInterceptor('images', 5))
    async saveBanner(
        @Req() req:Request,
        @Body() body: BannerData,
        @UploadedFiles() images: Express.Multer.File[]

    ) {
        
          if (!req.session.user) {
                throw new UnauthorizedException('Требуется авторизация');
              }
            try {
            const result = await this.bannersService.saveBanner(
              {
                ...body,
                username: req.session.user.username 
              },
              images,
              req
            );
            
            return { 
              status: 'success',
              message: 'Данные успешно сохранены',
              data: result,
              imageUrls: result.imageNames?.map(name => `/images/${name}`)
            };
          } catch (error) {
            if (error instanceof HttpException) {
              throw error;
            }
            throw new HttpException('Ошибка сохранения баннера', HttpStatus.BAD_REQUEST);
          }
    }
}