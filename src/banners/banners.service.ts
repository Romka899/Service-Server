import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { BannerData } from './interfaces/banner.interface';


@Injectable()
export class BannersService {
    private readonly baseDataPath: string;
    private readonly baseImagesPath: string;

    constructor() {
        this.baseDataPath = path.join(process.cwd(), 'banners');
        this.baseImagesPath = path.join(process.cwd(), 'images');
        this.ensureDirectoriesExist();
    }

    private ensureDirectoriesExist(): void{
        const app1Path = path.join(this.baseDataPath, 'app1');
        const app2Path = path.join(this.baseDataPath, 'app2');
        const imagesPath = this.baseImagesPath;

        if(!fs.existsSync(app1Path)){
            fs.mkdirSync(app1Path, {recursive:true});
        }
        if(!fs.existsSync(app2Path)){
            fs.mkdirSync(app2Path,{recursive:true});
        }
        if(!fs.existsSync(imagesPath)){
            fs.mkdirSync(imagesPath, {recursive:true});
        }
    }

    private generatedId():string{
        return crypto.randomBytes(16).toString('hex');
    }

    private getAppFilePath(app: 'app1' | 'app2'):string{
        return path.join(this.baseDataPath, app, 'banners-data.json')
    }

    async saveImages(images: Express.Multer.File[], bannerId: string): Promise<string[]>{
        const savedImagesName: string[] = [];

        for (const image of images){
            if(!image || !image.buffer){
                console.warn('Пустой файл изобраения', image);
                continue;
            }
            const extension = path.extname(image.originalname);
            const imageName = `${bannerId}-${Date.now()}${extension}`;
            const imagePath = path.join(this.baseImagesPath, imageName);

            fs.writeFileSync(imagePath, image.buffer);
            savedImagesName.push(imageName);
        }
        return savedImagesName;
    }

    async saveBanner(bannerData: Omit<BannerData, 'id' | 'imageNames' | 'timestamp' | 'imageCount'>, 
        images?:Express.Multer.File[]): Promise<BannerData> {
        let imageNames: string[] = [];

        try {
            const bannerId = this.generatedId();
            const timestamp = new Date().toISOString();

            if(images && images.length > 0){
                imageNames = await this.saveImages(images, bannerId);
            }

            const fullBannerData ={
                ...bannerData,
                id: bannerId,
                imageNames,
                timestamp,
                imageCount: imageNames.length
            };

            const filePath = this.getAppFilePath(fullBannerData.app)
            let allData: BannerData[] = [];
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                allData = fileContent ? JSON.parse(fileContent) : [];
            }
            allData.push(fullBannerData);
            fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');

            return fullBannerData;
        } catch (error) {
            if (imageNames && imageNames.length > 0) {
                imageNames.forEach(imageName => {
                    try {
                        fs.unlinkSync(path.join(this.baseImagesPath, imageName));
                    } catch (e) {}
                });
            }

            throw new Error(`Ошибка при сохранении данных: ${error.message}`);
        }
    }
}