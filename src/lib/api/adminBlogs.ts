import { blogPosts } from '../../data/blogs-data';
import { AdminBlogRecord } from '../../types/siteSettings';
import siteSettingsService from './siteSettings';

export interface AdminBlogListItem extends AdminBlogRecord {
  source: 'builtin' | 'custom';
  isHidden?: boolean;
}

function mapBuiltinPost(post: (typeof blogPosts)[number]): AdminBlogListItem {
  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle,
    content: post.content,
    author: post.author,
    country_code: post.country.code.toLowerCase(),
    date: post.date,
    read_time: post.readTime,
    image_url: post.image,
    is_published: true,
    source: 'builtin',
  };
}

export const adminBlogsService = {
  async listBlogs(): Promise<{ blogs: AdminBlogListItem[]; error: Error | null }> {
    const { settings, error } = await siteSettingsService.getSettings();
    const hidden = new Set(settings.hiddenBlogIds);

    const builtin = blogPosts.map((post) => {
      const item = mapBuiltinPost(post);
      return {
        ...item,
        isHidden: hidden.has(item.id),
        is_published: !hidden.has(item.id),
      };
    });

    const custom: AdminBlogListItem[] = (settings.customBlogs ?? []).map((blog) => ({
      ...blog,
      source: 'custom' as const,
    }));

    return {
      blogs: [...custom, ...builtin],
      error,
    };
  },

  async saveCustomBlog(
    blog: Omit<AdminBlogRecord, 'id' | 'source'> & { id?: string }
  ): Promise<{ blog: AdminBlogRecord | null; error: Error | null }> {
    const { settings } = await siteSettingsService.getSettings();
    const id = blog.id ?? `custom-${Date.now()}`;
    const record: AdminBlogRecord = {
      ...blog,
      id,
      source: 'custom',
    };

    const existing = settings.customBlogs ?? [];
    const index = existing.findIndex((item) => item.id === id);
    const customBlogs =
      index >= 0
        ? existing.map((item, i) => (i === index ? record : item))
        : [record, ...existing];

    const { settings: updated, error } = await siteSettingsService.updateSettings({
      customBlogs,
    });

    if (error) {
      return { blog: null, error };
    }

    return {
      blog: updated?.customBlogs.find((item) => item.id === id) ?? record,
      error: null,
    };
  },

  async deleteCustomBlog(id: string): Promise<{ error: Error | null }> {
    const { settings } = await siteSettingsService.getSettings();
    const customBlogs = (settings.customBlogs ?? []).filter((item) => item.id !== id);
    const { error } = await siteSettingsService.updateSettings({ customBlogs });
    return { error };
  },

  async setBuiltinPublished(
    id: string,
    isPublished: boolean
  ): Promise<{ error: Error | null }> {
    const { settings } = await siteSettingsService.getSettings();
    const hidden = new Set(settings.hiddenBlogIds);

    if (isPublished) {
      hidden.delete(id);
    } else {
      hidden.add(id);
    }

    const { error } = await siteSettingsService.updateSettings({
      hiddenBlogIds: Array.from(hidden),
    });
    return { error };
  },
};

export default adminBlogsService;
