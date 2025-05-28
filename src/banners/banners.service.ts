import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { BannerData } from './interfaces/banner.interface';
import { Request } from 'express';
import { count } from 'console';

@Injectable()
export class BannersService {
    private readonly baseDataPath: string;
    private readonly baseImagesPath: string;

    constructor() {
        this.baseDataPath = path.join(process.cwd(), 'banners');
        this.baseImagesPath = path.join(process.cwd(), 'images');
        this.ensureDirectoriesExist();
    }

    private ensureDirectoriesExist(): void {
        [path.join(this.baseDataPath, 'app1'),
         path.join(this.baseDataPath, 'app2'),
         this.baseImagesPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    private generateId(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    private getAppFilePath(app: 'app1' | 'app2'): string {
        return path.join(this.baseDataPath, app, 'banners-data.json');
    }

    async saveImages(images: Express.Multer.File[], bannerId: string): Promise<string[]> {
        const savedImageNames: string[] = [];

        for (const image of images) {
            if (!image?.buffer) continue;
            
            const extension = path.extname(image.originalname);
            const imageName = `${bannerId}-${Date.now()}${extension}`;
            const imagePath = path.join(this.baseImagesPath, imageName);

            fs.writeFileSync(imagePath, image.buffer);
            savedImageNames.push(imageName);
        }
        return savedImageNames;
    }

    async saveBanner(
        bannerData: Omit<BannerData, 'id' | 'imageNames' | 'timestamp' | 'imageCount' | 'userId' /*| 'companyId'*/>,
        images: Express.Multer.File[],
        req: Request
    ): Promise<BannerData> {
        const user = req.session.user;
        if (!user) {
            throw new HttpException('Пользователь не авторизован', HttpStatus.UNAUTHORIZED);
        }

        const bannerId = this.generateId();
        const timestamp = new Date().toISOString();
        let imageNames: string[] = [];

        try {
            if (images?.length) {
                imageNames = await this.saveImages(images, bannerId);
            }

            const fullBannerData: BannerData = {
                ...bannerData,
                id: bannerId,
                userId: user.id,
                companyId: bannerData.companyId,
                companyName: bannerData.companyName,
                imageNames,
                timestamp,
                showTime: bannerData.showTime,
                period: bannerData.period,
                imageCount: imageNames.length,
            };

            const filePath = this.getAppFilePath(fullBannerData.app);
            let allData: BannerData[] = fs.existsSync(filePath) 
                ? JSON.parse(fs.readFileSync(filePath, 'utf8')) 
                : [];
            
            allData.push(fullBannerData);
            fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');

            return fullBannerData;
        } catch (error) {

            imageNames.forEach(name => {
                try { fs.unlinkSync(path.join(this.baseImagesPath, name)); } catch {}
            });
            throw new HttpException('Ошибка сохранения баннера', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserBanners(userId: string): Promise<BannerData[]> {
        const user = userId;
        if (!user) {
            throw new HttpException('Пользователь не авторизован', HttpStatus.UNAUTHORIZED);
        }

        try {
            const app1Path = this.getAppFilePath('app1');
            const app2Path = this.getAppFilePath('app2');
            
            const userBanners: BannerData[] = [];
            
            if (fs.existsSync(app1Path)) {
                const app1Banners = JSON.parse(fs.readFileSync(app1Path, 'utf8'));
                userBanners.push(...app1Banners.filter(b => b.userId === userId || b.username === userId));
            }
            
            if (fs.existsSync(app2Path)) {
                const app2Banners = JSON.parse(fs.readFileSync(app2Path, 'utf8'));
                userBanners.push(...app2Banners.filter(b => b.userId === userId || b.username === userId));
            }

            return userBanners;
        } catch (error) {
            throw new HttpException('Ошибка получения баннеров', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteBanner(bannerId: string): Promise<BannerData> {
        try {
            const app1Path = this.getAppFilePath('app1');
            const app2Path = this.getAppFilePath('app2');
    
            let deletedBanner: BannerData | null = null;
    
            const processFile = (filePath: string): boolean => {
                if (!fs.existsSync(filePath)) return false;
    
                const banners: BannerData[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const bannerToDelete = banners.find((b) => b.id === bannerId);
    
                if (!bannerToDelete) return false;
    
                deletedBanner = bannerToDelete;
                const updatedBanners = banners.filter((b) => b.id !== bannerId);
                fs.writeFileSync(filePath, JSON.stringify(updatedBanners, null, 2));
                return true;
            };
    
            const isDeleted = processFile(app1Path) || processFile(app2Path);
    
            if (!isDeleted || !deletedBanner) {
                throw new HttpException('Баннер не найден', HttpStatus.NOT_FOUND);
            }
    
            /*
            if (deletedBanner.imageNames && deletedBanner.imageNames.length > 0) {
                deletedBanner.imageNames.forEach((imgName) => {
                    try {
                        const imagePath = path.join(this.baseImagesPath, imgName);
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                    } catch (err) {
                        console.error('Ошибка удаления изображения:', imgName, err);
                    }
                });
            }
            */
            return deletedBanner;
        } catch (error) {
            console.error('Ошибка при удалении баннера:', error);
            throw new HttpException(
                'Не удалось удалить баннер', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    async toggleBannersActivation(bannerIds: string[], isActive: boolean): Promise<number> {
        try {
            const app1Path = this.getAppFilePath('app1');
            const app2Path = this.getAppFilePath('app2');
            
            let updatedCount = 0;

            const processFile = (filePath: string): number => {
                if (!fs.existsSync(filePath)) return 0;

                const banners: BannerData[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let count = 0;

                const updatedBanners = banners.map(banner => {
                    if (bannerIds.includes(banner.id)) {
                        count++;
                        return { ...banner, isActive };
                    }
                    return banner;
                });

                if (count > 0) {
                    fs.writeFileSync(filePath, JSON.stringify(updatedBanners, null, 2));
                }

                return count;
            };

            updatedCount += processFile(app1Path);
            updatedCount += processFile(app2Path);

            return updatedCount;
        } catch (error) {
            console.error('Ошибка при изменении статуса баннеров:', error);
            throw new HttpException(
                'Не удалось изменить статус баннеров', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
    
    
