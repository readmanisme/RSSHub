import { Route } from '@/types';

export const route: Route = {
    path: '/blog',
    categories: ['programming'],
    example: '/blog',
    // parameters: { user: 'GitHub username', repo: 'GitHub repo name', state: 'the state of the issues. Can be either `open`, `closed`, or `all`. Default: `open`.', labels: 'a list of comma separated label names' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.prefect.io', 'www.prefect.io/blog'],
            target: '/blog',
        },
    ],
    name: 'Prefect Blog',
    maintainers: ['wyz'],
    // @ts-ignore
    handler,
};

import ofetch from '@/utils/ofetch'; // 统一使用的请求库
import { load } from 'cheerio'; // 类似 jQuery 的 API HTML 解析器
import cache from '@/utils/cache';

async function handler(ctx: any) {
    ctx.state.source = 'prefect';
    const baseUrl = 'https://www.prefect.io';
    const response = await ofetch(`https://www.prefect.io/blog`);
    const $ = load(response);
    // 选择类名为ease flex flex-col overflow-hidden rounded-20 bg-space transition-colors duration-500 hover:bg-deepSpace 的a元素
    const items = $(String.raw`a.ease.flex.flex-col.overflow-hidden.rounded-20.bg-space.transition-colors.duration-500.hover\:bg-deepSpace`)
        .toArray()
        .map((item) => {
            const item_2 = $(item);
            const href = baseUrl + item_2.attr('href');
            // 获取下面类名为categories-and-gated-content-types flex flex-row justify-start的文字作为category
            const category = item_2.find(String.raw`div.categories-and-gated-content-types.flex.flex-row.justify-start`);
            // 获取下面类名为text-h5Mobile md:text-h5 text-inherit max-w-[350px]的div作为title
            const title = item_2.find(String.raw`div.text-h5Mobile.md\:text-h5.text-inherit.max-w-\[350px\]`);
            // 获取text-warmGray的div作为大致时间
            const approximate_time = item_2.find(String.raw`div.text-warmGray`);
            return {
                title: title.text().trim(),
                category: category.text().trim(),
                link: href,
                pubDate: approximate_time.text().trim(),
            };
        });
    const items_2 = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response_2 = await ofetch(item.link);
                const $_2 = load(response_2);
                // 定位mb-40 flex flex-col gap-20 px-20 lg:mb-60 lg:px-0的div
                let content = $_2('div[class*="mb-40 flex flex-col gap-20 px-20 lg:mb-60 lg:px-0"]');
                // 加入class="rich-text flex max-w-[800px] flex-col gap-40 px-20 lg:gap-60 lg:px-0"的div来自$_2
                const richTextContent = $_2('div[class*="rich-text flex max-w-[800px] flex-col gap-40 px-20 lg:gap-60 lg:px-0"]');
                content = content.append(richTextContent);
                // 在content的外面再包裹一个div
                // content = $(`<div>${content.html()}</div>`);
                // @ts-ignore
                item.description = content.html();
                return item;
            })
        )
    );
    return {
        title: 'Prefect Blog',
        link: 'https://www.prefect.io/blog',
        item: items_2,
    };
}
