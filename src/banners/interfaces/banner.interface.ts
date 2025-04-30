export interface BannerData {
    id?: string;
    placement: string;
    app: 'app1' | 'app2';
    hideable: boolean;
    link: string;
    period: string;
    impressions: string;
    userImpressions: string;
    showTime: string;
    geoTargeting: string;
    imageCount?: number;
    imageNames?: string[];
    username: string;
    timestamp?: string;
    userId: string;
    companyId: number;
}