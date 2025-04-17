import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { BannerData } from './interfaces/banner.interface';


@Injectable()
export class BannersService {
    private readonly dataFilePath = path.join(process.cwd(), 'banners-data.json');

    async saveBanner(bannerData: BannerData): Promise<BannerData> {
        try {
            let allData: BannerData[] = [];
            if (fs.existsSync(this.dataFilePath)) {
                const fileContent = fs.readFileSync(this.dataFilePath, 'utf8');
                allData = fileContent ? JSON.parse(fileContent) : [];
            }
            allData.push(bannerData);
            fs.writeFileSync(this.dataFilePath, JSON.stringify(allData, null, 2), 'utf8');
            return bannerData;
        } catch (error) {
            throw new Error(`Ошибка при сохранении данных: ${error.message}`);
        }
    }
}