import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { BannerData } from './interfaces/banner.interface';


@Injectable()
export class BannersService {
    private readonly baseDataPath: string;
    constructor() {
        this.baseDataPath = path.join(process.cwd(), 'banners');
        this.ensureDirectoriesExist();
    }

    private ensureDirectoriesExist(){
        const app1Path = path.join(this.baseDataPath, 'app1');
        const app2Path = path.join(this.baseDataPath, 'app2');

        if(!fs.existsSync(app1Path)){
            fs.mkdirSync(app1Path, {recursive:true});
        }
        if(!fs.existsSync(app2Path)){
            fs.mkdirSync(app2Path,{recursive:true});
        }
    }

    private getAppFilePath(app: 'app1' | 'app2'):string{
        return path.join(this.baseDataPath, app, 'banners-data.json')
    }
    async saveBanner(bannerData: BannerData): Promise<BannerData> {
        try {
            const filePath = this.getAppFilePath(bannerData.app)
            let allData: BannerData[] = [];
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                allData = fileContent ? JSON.parse(fileContent) : [];
            }
            allData.push(bannerData);
            fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');
            return bannerData;
        } catch (error) {
            throw new Error(`Ошибка при сохранении данных: ${error.message}`);
        }
    }
}